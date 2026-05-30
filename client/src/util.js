// Shared helpers.
export const PRIOS = ["low", "medium", "high", "urgent"];
export const STATUSES = [
  { k: "todo", label: "To Do" },
  { k: "in_progress", label: "In Progress" },
  { k: "blocked", label: "Blocked" },
  { k: "done", label: "Done" },
];

export const initials = (n) =>
  (n || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export const prioColor = (p) => `var(--p-${p})`;
export const statusColor = (s) => `var(--s-${s})`;
export const statusLabel = (s) => (STATUSES.find((x) => x.k === s) || {}).label || s;

export function relTime(ts) {
  if (!ts) return "";
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function deadlineInfo(ts, status) {
  if (!ts) return { text: "no deadline", cls: "" };
  const days = (ts - Date.now()) / 86400000;
  const date = new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (status === "done") return { text: date, cls: "" };
  if (days < 0) return { text: `${date} · overdue`, cls: "over" };
  if (days < 1) return { text: `${date} · due soon`, cls: "soon" };
  if (days < 7) return { text: `${date} · ${Math.ceil(days)}d`, cls: "" };
  return { text: date, cls: "" };
}

export function computeStats(tasks) {
  const s = { total: 0, todo: 0, in_progress: 0, blocked: 0, done: 0, overdue: 0, due_soon: 0 };
  const now = Date.now();
  for (const t of tasks) {
    s.total++;
    s[t.status] = (s[t.status] || 0) + 1;
    if (t.deadline && t.status !== "done") {
      if (t.deadline < now) s.overdue++;
      else if (t.deadline < now + 86400000) s.due_soon++;
    }
  }
  return s;
}

// minimal, safe markdown → HTML (bold, bullets, headings) for AI output
export function renderMarkdown(md) {
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (md || "").split("\n").map((raw) => {
    const t = raw.trim();
    if (!t) return "";
    let line = escape(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (/^#{1,4}\s/.test(t)) return `<h4>${line.replace(/^#+\s/, "")}</h4>`;
    if (/^[-*•]\s/.test(t)) return `<div class="ai-bullet">${line.replace(/^[-*•]\s/, "")}</div>`;
    return `<div style="margin:5px 0">${line}</div>`;
  }).join("");
}

// toast — lightweight, no context needed
export function toast(msg, kind = "ok") {
  let el = document.getElementById("wf-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "wf-toast";
    document.body.appendChild(el);
  }
  const ic = kind === "err" ? "✕" : kind === "info" ? "✦" : "✓";
  el.className = `toast show ${kind}`;
  el.innerHTML = `<span class="t-ic">${ic}</span><span></span>`;
  el.lastChild.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}
