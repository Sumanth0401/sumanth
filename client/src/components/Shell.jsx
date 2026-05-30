import { useEffect, useMemo, useState } from "react";
import { Logo } from "./bits.jsx";
import { Dashboard, Tasks, Team, Audit } from "./views.jsx";
import TaskDrawer from "./TaskDrawer.jsx";
import AssignModal from "./AssignModal.jsx";
import { listenTasks, listenUsers, listenAudit } from "../data.js";
import { api } from "../api.js";
import { computeStats, initials, renderMarkdown, toast } from "../util.js";

const NAV = [
  { v: "dashboard", ic: "▦", label: "Dashboard" },
  { v: "tasks", ic: "◷", label: "Tasks" },
  { v: "team", ic: "👥", label: "Team", mgr: true },
  { v: "audit", ic: "⎙", label: "Audit Trail" },
];

const TITLES = {
  dashboard: ["Dashboard", { manager: "Real-time view of your team's accountability", employee: "Everything assigned to you, in one place" }],
  tasks: ["Tasks", { manager: "Track, filter and update every task", employee: "Track, filter and update your tasks" }],
  team: ["Team", { manager: "Workload and performance across your people", employee: "" }],
  audit: ["Audit Trail", { manager: "Every change, timestamped and attributed", employee: "Every change to your tasks, timestamped" }],
};

export default function Shell({ profile, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([profile]);
  const [audit, setAudit] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const isMgr = profile.role === "manager";

  useEffect(() => {
    const a = listenTasks(profile, setTasks);
    const b = listenUsers(profile, setUsers);
    const c = listenAudit(profile, setAudit);
    return () => { a(); b(); c(); };
  }, [profile.id]);

  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const employees = useMemo(() => users.filter((u) => u.role === "employee"), [users]);
  const selected = tasks.find((t) => t.id === selectedId) || null;

  async function genSummary() {
    setSummaryLoading(true); setSummary(null);
    try {
      const payload = tasks.map((t) => ({
        title: t.title, status: t.status, priority: t.priority,
        assigneeName: t.assigneeName, deadline: t.deadline, logCount: t.logCount || 0,
      }));
      const r = await api.teamSummary(payload);
      setSummary(r.summary);
    } catch (e) { toast(e.message, "err"); setSummary(null); }
    finally { setSummaryLoading(false); }
  }

  const aiPanel = isMgr ? (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <div className="ai-panel-title"><span className="ai-spark">✦</span> Where's My Team?</div>
        <button className="btn mini primary" disabled={summaryLoading} onClick={genSummary}>
          {summaryLoading ? "Generating…" : "Generate briefing"}
        </button>
      </div>
      {summaryLoading
        ? <div className="ai-loading"><span /><span /><span /></div>
        : summary
          ? <div className="ai-output" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
          : <div className="ai-placeholder">One click turns your whole task table into a plain-English briefing — who's behind, what's at risk, and who's quietly overperforming.</div>}
    </div>
  ) : null;

  const activeCount = tasks.filter((t) => t.status !== "done").length;
  const [title, subMap] = TITLES[view];
  const sub = subMap[profile.role];

  return (
    <div className="app-view">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark sm"><Logo size={22} /></div>
          <div className="brand-text"><span className="brand-name">WorkFlow</span></div>
        </div>
        <nav className="nav">
          {NAV.filter((n) => !n.mgr || isMgr).map((n) => (
            <button key={n.v} className={`nav-item ${view === n.v ? "active" : ""}`} onClick={() => setView(n.v)}>
              <span className="ni-ic">{n.ic}</span><span>{n.label}</span>
              {n.v === "tasks" && activeCount > 0 && <span className="ni-count">{activeCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-card">
            <div className="avatar">{initials(profile.name)}</div>
            <div className="user-meta">
              <div className="user-name">{profile.name}</div>
              <div className="user-role">{profile.title || profile.role}</div>
            </div>
            <button className="logout" title="Sign out" onClick={onLogout}>⏻</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="main-head">
          <div>
            <h1>{title}</h1>
            {sub && <p className="view-sub">{sub}</p>}
          </div>
          <div className="head-actions">
            {isMgr
              ? <button className="btn primary" onClick={() => setShowAssign(true)}>＋ Assign task</button>
              : <button className="btn primary" onClick={() => setView("tasks")}>View my tasks</button>}
          </div>
        </header>

        <div className="main-body">
          {view === "dashboard" && <Dashboard profile={profile} tasks={tasks} stats={stats} onOpen={(t) => setSelectedId(t.id)} aiPanel={aiPanel} />}
          {view === "tasks" && <Tasks tasks={tasks} onOpen={(t) => setSelectedId(t.id)} />}
          {view === "team" && isMgr && <Team users={users} tasks={tasks} />}
          {view === "audit" && <Audit items={audit} onOpenTask={(id) => setSelectedId(id)} />}
        </div>
      </main>

      {selected && <TaskDrawer task={selected} profile={profile} onClose={() => setSelectedId(null)} />}
      {showAssign && <AssignModal profile={profile} employees={employees} onClose={() => setShowAssign(false)} />}
    </div>
  );
}
