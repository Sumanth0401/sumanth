/* =============================================================
   TaskFlow — mock data + helpers
   ============================================================= */

// ---- People ----
const TEAM = [
  { id: "u-priya",  name: "Priya Nair",      role: "Operations Lead", title: "Manager", color: ["#0A84FF","#5E5CE6"], initials: "PN" },
  { id: "u-marcus", name: "Marcus Reyes",    role: "Logistics Coordinator", color: ["#FF9F0A","#FF375F"], initials: "MR" },
  { id: "u-aisha",  name: "Aisha Khan",      role: "Account Manager", color: ["#30D158","#40C8E0"], initials: "AK" },
  { id: "u-diego",  name: "Diego Santos",    role: "Warehouse Lead", color: ["#BF5AF2","#5E5CE6"], initials: "DS" },
  { id: "u-lena",   name: "Lena Müller",     role: "Finance Analyst", color: ["#40C8E0","#0A84FF"], initials: "LM" },
  { id: "u-tomas",  name: "Tomás Oliveira",  role: "Sales Representative", color: ["#FF375F","#FF9F0A"], initials: "TO" },
  { id: "u-grace",  name: "Grace Bennett",   role: "Operations Assistant", color: ["#FFD60A","#FF9F0A"], initials: "GB" },
];
const byId = (id) => TEAM.find(p => p.id === id);
const MANAGER = TEAM[0];
const ME = TEAM[1]; // Marcus — the "logged in" employee for employee view

// status meta
const STATUS = {
  "not-started": { label: "Not started", color: "var(--text-3)",  c: "#8A8F9C" },
  "in-progress": { label: "In progress", color: "var(--c-blue)",  c: "#0A84FF" },
  "in-review":   { label: "In review",   color: "var(--c-purple)",c: "#BF5AF2" },
  "blocked":     { label: "Blocked",     color: "var(--c-orange)",c: "#FF9F0A" },
  "overdue":     { label: "Overdue",     color: "var(--c-red)",   c: "#FF453A" },
  "done":        { label: "Completed",   color: "var(--c-green)", c: "#30D158" },
};
const PRIORITY = {
  high:   { label: "High",   c: "#FF453A" },
  medium: { label: "Medium", c: "#FF9F0A" },
  low:    { label: "Low",    c: "#30D158" },
};

// relative deadline helper: days from "now"
const REF = new Date("2026-05-30T09:00:00");
function dayOffset(n) { const d = new Date(REF); d.setDate(d.getDate() + n); return d; }
function fmtDate(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmtDateTime(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function relDeadline(d) {
  const ms = d - REF; const days = Math.round(ms / 86400000);
  if (days < 0) return { txt: `${Math.abs(days)}d overdue`, danger: true };
  if (days === 0) return { txt: "Due today", warn: true };
  if (days === 1) return { txt: "Due tomorrow", warn: true };
  if (days <= 3) return { txt: `Due in ${days}d`, warn: true };
  return { txt: `Due ${fmtDate(d)}`, warn: false };
}

// ---- Tasks ----
// each task: id, title, assignee, priority, status, deadline(Date), progress(0-100),
// project, desc, logs[], audit[]
let TASKS = [
  {
    id: "T-241", title: "Reconcile Q2 vendor invoices", assignee: "u-lena",
    priority: "high", status: "overdue", deadline: dayOffset(-2), progress: 60,
    project: "Finance", created: dayOffset(-9),
    desc: "Cross-check all 38 vendor invoices for Q2 against POs in the ledger. Flag mismatches over $500 for review before the month-end close.",
    logs: [
      { id:"L1", date: dayOffset(-4), text: "Pulled the full invoice export and started matching against PO numbers. ~20 of 38 reconciled, 3 mismatches flagged so far.", conf: "high", flags: [] },
      { id:"L2", date: dayOffset(-1), text: "Worked on invoices.", conf: "low", flags: ["Too vague — no detail on which invoices or what progress was made.", "Does not state how many of the remaining 18 were reconciled."] },
    ],
  },
  {
    id: "T-238", title: "Onboard new 3PL carrier — EastPort", assignee: "u-marcus",
    priority: "high", status: "in-progress", deadline: dayOffset(1), progress: 75,
    project: "Logistics", created: dayOffset(-6),
    desc: "Complete carrier setup for EastPort: rate cards loaded, SLA agreed, test shipment booked and tracked end-to-end.",
    logs: [
      { id:"L3", date: dayOffset(-2), text: "Loaded EastPort rate cards into the TMS and validated 4 lanes. SLA doc signed by both sides. Booked a test shipment (#TS-1182) for tomorrow.", conf: "high", flags: [] },
    ],
  },
  {
    id: "T-244", title: "Draft May client renewal proposals", assignee: "u-aisha",
    priority: "medium", status: "in-progress", deadline: dayOffset(2), progress: 45,
    project: "Accounts", created: dayOffset(-4),
    desc: "Prepare renewal proposals for the 6 accounts expiring in May. Include updated pricing and a usage summary per account.",
    logs: [
      { id:"L4", date: dayOffset(-1), text: "Finished 3 of 6 proposals (Aldridge, Vinet, Norcross). Pricing approved by finance. Remaining 3 need updated usage numbers from the data team.", conf: "high", flags: [] },
    ],
  },
  {
    id: "T-251", title: "Inventory count — Aisle 12–18", assignee: "u-diego",
    priority: "medium", status: "blocked", deadline: dayOffset(0), progress: 30,
    project: "Warehouse", created: dayOffset(-3),
    desc: "Physical cycle count for aisles 12–18 and reconcile against the WMS. Resolve any variance above 2%.",
    logs: [
      { id:"L5", date: dayOffset(-1), text: "Counted 12–14 but the scanner in zone B keeps dropping connection — can't finish 15–18 until IT replaces it. Raised ticket #IT-904.", conf: "high", flags: [] },
    ],
  },
  {
    id: "T-233", title: "Update safety stock thresholds", assignee: "u-marcus",
    priority: "medium", status: "in-review", deadline: dayOffset(3), progress: 90,
    project: "Logistics", created: dayOffset(-7),
    desc: "Recalculate safety stock for the top 50 SKUs using the last 90 days of demand. Submit for ops review.",
    logs: [
      { id:"L6", date: dayOffset(-1), text: "Recalculated thresholds for all 50 SKUs from the 90-day demand pull. Posted the new values to a review sheet and tagged Priya.", conf: "medium", flags: ["Mentions a review sheet but the calculation method isn't described — hard to verify the numbers."] },
    ],
  },
  {
    id: "T-256", title: "Close out April expense reports", assignee: "u-lena",
    priority: "low", status: "done", deadline: dayOffset(-1), progress: 100,
    project: "Finance", created: dayOffset(-10),
    desc: "Approve or return all outstanding April expense reports and post to the GL.",
    logs: [
      { id:"L7", date: dayOffset(-2), text: "Reviewed all 22 April reports — approved 19, returned 3 with notes for missing receipts. All approved reports posted to the GL.", conf: "high", flags: [] },
    ],
  },
  {
    id: "T-259", title: "Build May sales pipeline review deck", assignee: "u-tomas",
    priority: "high", status: "in-progress", deadline: dayOffset(0), progress: 25,
    project: "Sales", created: dayOffset(-3),
    desc: "Assemble the pipeline review deck for Friday: stage movement, at-risk deals, and forecast vs. target.",
    logs: [
      { id:"L8", date: dayOffset(-1), text: "Did some stuff on the deck, looking good.", conf: "low", flags: ["No detail on which slides or sections were completed.", "‘Looking good’ is a claim with no supporting evidence.", "Task is at 25% with the deadline today — log does not address the gap."] },
    ],
  },
  {
    id: "T-261", title: "Process warehouse returns backlog", assignee: "u-grace",
    priority: "medium", status: "in-progress", deadline: dayOffset(4), progress: 55,
    project: "Warehouse", created: dayOffset(-2),
    desc: "Clear the 140-unit returns backlog: inspect, restock or scrap, and update the WMS.",
    logs: [
      { id:"L9", date: dayOffset(-1), text: "Processed 78 of 140 returns — 61 restocked, 17 scrapped with photos logged. On pace to finish by Thursday.", conf: "high", flags: [] },
    ],
  },
  {
    id: "T-247", title: "Renew commercial insurance policy", assignee: "u-aisha",
    priority: "high", status: "not-started", deadline: dayOffset(5), progress: 0,
    project: "Accounts", created: dayOffset(-1),
    desc: "Gather quotes from 3 brokers and prepare a comparison for the renewal decision due next week.",
    logs: [],
  },
  {
    id: "T-262", title: "Month-end GL close checklist", assignee: "u-lena",
    priority: "high", status: "not-started", deadline: dayOffset(2), progress: 0,
    project: "Finance", created: dayOffset(-1),
    desc: "Run the full month-end close checklist: accruals, reconciliations, and variance commentary.",
    logs: [],
  },
  {
    id: "T-240", title: "Restock packing supplies — Dock 3", assignee: "u-grace",
    priority: "low", status: "done", deadline: dayOffset(-3), progress: 100,
    project: "Warehouse", created: dayOffset(-8),
    desc: "Reorder boxes, tape and labels for Dock 3 to cover the next 4 weeks.",
    logs: [
      { id:"L10", date: dayOffset(-4), text: "Counted current stock, placed PO #PO-5521 for boxes, tape and 4 label rolls. Confirmed delivery for Monday.", conf: "high", flags: [] },
    ],
  },
  {
    id: "T-263", title: "Follow up on overdue Norcross payment", assignee: "u-tomas",
    priority: "medium", status: "in-progress", deadline: dayOffset(1), progress: 50,
    project: "Sales", created: dayOffset(-2),
    desc: "Contact Norcross AP about the 45-day overdue invoice and confirm a payment date.",
    logs: [
      { id:"L11", date: dayOffset(-1), text: "Called Norcross AP, spoke to their controller. They confirmed payment will clear by June 4 and sent a remittance reference.", conf: "high", flags: [] },
    ],
  },
];

// Build audit trails programmatically for richness
function buildAudit(t) {
  const a = [];
  a.push({ at: t.created, who: "u-priya", kind: "create", text: `Created task and assigned to ${byId(t.assignee).name.split(" ")[0]}` });
  a.push({ at: new Date(t.created.getTime()+3600000), who: "u-priya", kind: "priority", text: `Set priority to ${PRIORITY[t.priority].label}` });
  if (t.progress > 0) a.push({ at: new Date(t.created.getTime()+2*86400000), who: t.assignee, kind: "status", text: "Moved to In progress" });
  t.logs.forEach(l => a.push({ at: l.date, who: t.assignee, kind: "log", text: "Submitted a daily work log", logId: l.id }));
  if (t.status === "in-review") a.push({ at: new Date(REF.getTime()-43200000), who: t.assignee, kind: "status", text: "Moved to In review" });
  if (t.status === "blocked") a.push({ at: new Date(REF.getTime()-43200000), who: t.assignee, kind: "status", text: "Flagged as Blocked" });
  if (t.status === "done") a.push({ at: t.deadline, who: t.assignee, kind: "status", text: "Marked Completed" });
  if (t.status === "overdue") a.push({ at: t.deadline, who: "system", kind: "alert", text: "Auto-flagged Overdue — deadline passed" });
  return a.sort((x,y)=>x.at-y.at);
}
TASKS = TASKS.map(t => ({ ...t, audit: buildAudit(t) }));

// ---- AI confidence meta ----
const CONF = {
  high:   { label: "Verified",   c: "#30D158", bars: 3, note: "Log clearly matches the task with specific, verifiable detail." },
  medium: { label: "Partial",    c: "#FF9F0A", bars: 2, note: "Some detail provided, but parts of the work can't be verified from the log." },
  low:    { label: "Needs review", c: "#FF453A", bars: 1, note: "Vague or low-effort — does not provide evidence the work was actually done." },
};

// ---- "Where's My Team?" AI briefing (pre-written, streamed) ----
const TEAM_BRIEF = [
  { h: "Needs attention now", icon: "alert", tone: "red", items: [
    { b: "Lena Müller", t: "is 2 days overdue on vendor invoice reconciliation (T-241), and her latest log (“Worked on invoices.”) was flagged low-confidence. Month-end close depends on this." },
    { b: "Tomás Oliveira", t: "is at 25% on the pipeline deck (T-259) due today, and logged only “did some stuff.” High risk of slipping Friday's review." },
  ]},
  { h: "Blocked & waiting", icon: "pause", tone: "orange", items: [
    { b: "Diego Santos", t: "is blocked on the aisle 12–18 count (T-251) by a faulty scanner — IT ticket #IT-904 is open. Needs a hardware swap to continue." },
  ]},
  { h: "On track", icon: "check", tone: "green", items: [
    { b: "Marcus Reyes", t: "is at 75% on the EastPort carrier onboarding with a clear, verified log and a test shipment booked for tomorrow." },
    { b: "Aisha Khan", t: "has 3 of 6 renewal proposals done, blocked only on usage data from the data team." },
  ]},
  { h: "Quietly overperforming", icon: "spark", tone: "blue", items: [
    { b: "Grace Bennett", t: "cleared 78 of 140 returns ahead of pace and closed the Dock 3 restock early — consistently high-confidence logs, no follow-ups needed." },
  ]},
];
const TEAM_BRIEF_TLDR = "2 items need you today, 1 person is blocked on IT, and the rest are on track. Grace is quietly ahead of schedule.";

Object.assign(window, {
  TEAM, byId, MANAGER, ME, STATUS, PRIORITY, CONF,
  TASKS, REF, dayOffset, fmtDate, fmtDateTime, relDeadline,
  TEAM_BRIEF, TEAM_BRIEF_TLDR,
});
