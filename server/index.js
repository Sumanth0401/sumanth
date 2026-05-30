/**
 * WorkFlow — Express backend (the AI layer).
 *
 * Responsibilities:
 *   - Verify the caller's Firebase ID token (via Google Identity Toolkit REST,
 *     so no service-account key is required — only the public web API key).
 *   - Call Google Gemini for: work-log verification, team summaries, and
 *     smart task suggestions. The Gemini key lives in .env and never reaches
 *     the browser.
 *
 * Data (tasks, logs, audit, users) lives in Firestore and is read/written
 * directly by the React client (real-time via onSnapshot), secured by
 * firestore.rules. This backend only handles the secret-bearing AI work.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT || 5000;
const GEMINI_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
const FIREBASE_API_KEY = (process.env.FIREBASE_API_KEY ||
  "AIzaSyCx1HISQk4RQaR5UDN4oljdoFV7tNdwXyg").trim();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ------------------------------------------------------------------ */
/* Firebase ID token verification (no service account needed)          */
/* ------------------------------------------------------------------ */
async function verifyIdToken(idToken) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const u = data.users && data.users[0];
  if (!u) return null;
  return { uid: u.localId, email: u.email, name: u.displayName || "" };
}

async function authRequired(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing auth token." });
  try {
    const user = await verifyIdToken(token);
    if (!user) return res.status(401).json({ error: "Invalid or expired session." });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: "Auth verification failed." });
  }
}

/* ------------------------------------------------------------------ */
/* Gemini helper                                                       */
/* ------------------------------------------------------------------ */
async function gemini({ prompt, system, schema, temperature = 0.3 }) {
  if (!GEMINI_KEY) {
    const err = new Error("No Gemini API key set. Add GEMINI_API_KEY to .env and restart the server.");
    err.code = "NO_KEY";
    throw err;
  }
  const generationConfig = { temperature };
  if (schema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = schema;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Unexpected Gemini response.");
  return schema ? JSON.parse(text) : text;
}

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */
const VERIFY_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["genuine", "needs_detail", "mismatch", "suspicious"] },
    confidence: { type: "integer" },
    summary: { type: "string" },
    reasons: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "confidence", "summary", "reasons"],
};
const SUGGEST_SCHEMA = {
  type: "object",
  properties: {
    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
    days: { type: "integer" },
    reasoning: { type: "string" },
  },
  required: ["priority", "days", "reasoning"],
};

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, gemini: !!GEMINI_KEY, model: GEMINI_MODEL }));

// 1) AI work-log verification
app.post("/api/ai/verify-log", authRequired, async (req, res) => {
  const { task, content } = req.body || {};
  if (!task || !content) return res.status(400).json({ error: "task and content are required." });
  const system =
    "You are an accountability auditor for a task-management tool. Compare an employee's " +
    "daily work log to the task it was filed against and decide if it describes genuine, " +
    "verifiable work. Verdicts: 'genuine' (specific, matches the task), 'needs_detail' " +
    "(too vague/low-effort to verify), 'mismatch' (unrelated to the task), 'suspicious' " +
    "(claims completion with no supporting detail). confidence is 0-100 that the log " +
    "reflects real progress. Give 1-4 short, concrete reasons. Be fair but skeptical of filler.";
  const prompt =
    `TASK TITLE: ${task.title}\nTASK DESCRIPTION: ${task.description || "(none)"}\n` +
    `TASK STATUS: ${task.status}\n\nEMPLOYEE WORK LOG:\n${content}`;
  try {
    const result = await gemini({ prompt, system, schema: VERIFY_SCHEMA, temperature: 0.2 });
    result.confidence = Math.max(0, Math.min(100, Number(result.confidence) || 0));
    res.json(result);
  } catch (e) {
    res.status(e.code === "NO_KEY" ? 400 : 502).json({ error: e.message });
  }
});

// 2) Manager team summary ("Where's My Team?")
app.post("/api/ai/team-summary", authRequired, async (req, res) => {
  const tasks = (req.body && req.body.tasks) || [];
  if (!tasks.length) return res.status(400).json({ error: "No tasks to summarize." });
  const system =
    "You are a chief of staff briefing a busy manager. From the task table, write a crisp, " +
    "plain-English briefing with short markdown sections covering: who is behind / at risk, " +
    "deadlines slipping, blockers, and who is quietly overperforming. Reference people and " +
    "tasks by name. Keep it under ~200 words, use short bullet points, and end with one " +
    "suggested action.";
  const now = Date.now();
  const lines = tasks.map((t) => {
    let when = "no deadline";
    if (t.deadline) {
      const d = (t.deadline - now) / 86400000;
      when = d >= 0 ? `due in ${d.toFixed(1)}d` : `OVERDUE by ${(-d).toFixed(1)}d`;
    }
    return `- [${t.status}/${t.priority}] "${t.title}" — ${t.assigneeName}; ${when}; ${t.logCount || 0} log(s)`;
  });
  try {
    const summary = await gemini({
      prompt: "TEAM TASK TABLE:\n" + lines.join("\n"),
      system, temperature: 0.4,
    });
    res.json({ summary });
  } catch (e) {
    res.status(e.code === "NO_KEY" ? 400 : 502).json({ error: e.message });
  }
});

// 3) Smart suggestion: priority + deadline from a description
app.post("/api/ai/suggest", authRequired, async (req, res) => {
  const description = (req.body && req.body.description || "").trim();
  if (!description) return res.status(400).json({ error: "description is required." });
  const system =
    "You triage tasks. From a short description, suggest a priority " +
    "(low/medium/high/urgent) and a realistic number of days to complete (1-30). " +
    "Give one sentence of reasoning.";
  try {
    const result = await gemini({ prompt: `TASK: ${description}`, system, schema: SUGGEST_SCHEMA });
    res.json(result);
  } catch (e) {
    res.status(e.code === "NO_KEY" ? 400 : 502).json({ error: e.message });
  }
});

/* ------------------------------------------------------------------ */
/* Serve built client in production                                    */
/* ------------------------------------------------------------------ */
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`\n  ▰▰▰ WorkFlow API — http://localhost:${PORT} ▰▰▰`);
  console.log(`  Gemini: ${GEMINI_KEY ? "key loaded ✓" : "NO KEY (add GEMINI_API_KEY to .env)"}  model: ${GEMINI_MODEL}`);
  console.log(`  Firebase token verification: ${FIREBASE_API_KEY ? "ready ✓" : "missing key"}\n`);
});
