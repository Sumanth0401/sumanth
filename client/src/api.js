// Client for the Express AI backend. Every call carries the current user's
// Firebase ID token so the server can verify it.
import { auth } from "./firebase";

async function post(path, body) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  health: () => fetch("/api/health").then((r) => r.json()),
  verifyLog: (task, content) => post("/api/ai/verify-log", { task, content }),
  teamSummary: (tasks) => post("/api/ai/team-summary", { tasks }),
  suggest: (description) => post("/api/ai/suggest", { description }),
};
