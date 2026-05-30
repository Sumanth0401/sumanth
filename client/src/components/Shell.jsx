import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "./bits.jsx";
import { Icon, Avatar } from "./ui.jsx";
import { Dashboard, Tasks, Team, Audit } from "./views.jsx";
import TaskDrawer from "./TaskDrawer.jsx";
import AssignModal from "./AssignModal.jsx";
import { listenTasks, listenUsers, listenAudit } from "../data.js";
import { api } from "../api.js";
import { computeStats, renderMarkdown, toast } from "../util.js";

const NAV = [
  { v: "dashboard", icon: "dashboard", label: "Dashboard" },
  { v: "tasks", icon: "tasks", label: "Tasks" },
  { v: "team", icon: "team", label: "Team", mgr: true },
  { v: "audit", icon: "audit", label: "Audit Trail" },
];

const TITLES = {
  dashboard: ["Dashboard", { manager: "Real-time view of your team's accountability", employee: "Everything assigned to you, in one place" }],
  tasks: ["Tasks", { manager: "Track, filter and update every task", employee: "Track, filter and update your tasks" }],
  team: ["Team", { manager: "Workload and performance across your people", employee: "" }],
  audit: ["Audit Trail", { manager: "Every change, timestamped and attributed", employee: "Every change to your tasks, timestamped" }],
};

export default function Shell({ profile, onLogout, theme, onToggleTheme }) {
  const [view, setView] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([profile]);
  const [audit, setAudit] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const searchRef = useRef(null);

  const isMgr = profile.role === "manager";

  useEffect(() => {
    const a = listenTasks(profile, setTasks);
    const b = listenUsers(profile, setUsers);
    const c = listenAudit(profile, setAudit);
    return () => { a(); b(); c(); };
  }, [profile.id]);

  // ⌘K / Ctrl-K focuses search
  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const employees = useMemo(() => users.filter((u) => u.role === "employee"), [users]);
  const selected = tasks.find((t) => t.id === selectedId) || null;
  const activeCount = tasks.filter((t) => t.status !== "done").length;

  async function genSummary() {
    setView("dashboard");
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

  function onSearch(v) {
    setQuery(v);
    if (v && view !== "tasks") setView("tasks");
  }

  const aiPanel = isMgr ? (
    <div className="glass card ai-glow col gap10" style={{ marginBottom: 4 }}>
      <div className="row gap10">
        <div className="kpi-ico" style={{ background: "linear-gradient(150deg, var(--accent), var(--accent-2))", color: "#fff" }}>
          <Icon name="spark" size={18} fill="current" />
        </div>
        <div className="col" style={{ gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>Where's My Team?</div>
          <div className="faint" style={{ fontSize: 12.5 }}>AI briefing from your whole task table</div>
        </div>
        <button className="btn btn-glass btn-sm mauto" disabled={summaryLoading} onClick={genSummary}>
          {summaryLoading ? "Generating…" : "Generate briefing"}
        </button>
      </div>
      {summaryLoading
        ? <div className="ai-loading" style={{ padding: "6px 2px" }}><span /><span /><span /></div>
        : summary
          ? <div className="ai-output" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
          : <div className="ai-placeholder">One click turns your whole task table into a plain-English briefing — who's behind, what's at risk, and who's quietly overperforming.</div>}
    </div>
  ) : null;

  const [title, subMap] = TITLES[view];
  const sub = subMap[profile.role];

  return (
    <div className={"shell" + (collapsed ? " collapsed" : "")}>
      {/* SIDEBAR */}
      <aside className="glass sidebar">
        <div className="brand">
          <div className="brand-mark"><Logo size={20} /></div>
          <div className="brand-text">
            <span className="brand-name">TaskFlow</span>
          </div>
        </div>

        <div className="nav-label">{isMgr ? "Manage" : "Work"}</div>
        {NAV.filter((n) => !n.mgr || isMgr).map((n) => (
          <button key={n.v} className={"nav-item" + (view === n.v ? " active" : "")} onClick={() => setView(n.v)} title={n.label}>
            <span className="nav-ico"><Icon name={n.icon} size={19} /></span>
            <span className="nav-text">{n.label}</span>
            {n.v === "tasks" && activeCount > 0 && <span className="nav-badge nav-text" style={{ background: "var(--accent)" }}>{activeCount}</span>}
          </button>
        ))}

        {/* {isMgr && (
          <>
            <div className="nav-label">Insights</div>
            <button className="nav-item" onClick={genSummary} title="Where's My Team?">
              <span className="nav-ico"><Icon name="spark" size={19} fill="current" /></span>
              <span className="nav-text">Where's My Team?</span>
            </button>
          </>
        )} */}

        <div className="sidebar-foot">
          <button className="nav-item" onClick={onLogout} title="Sign out">
            <span className="nav-ico"><Icon name="logout" size={18} /></span>
            <span className="nav-text">Sign out</span>
          </button>
          <div className="row gap10" style={{ padding: "10px 8px 2px" }}>
            <Avatar name={profile.name} size={36} ring />
            <div className="brand-text" style={{ minWidth: 0 }}>
              <span className="clip" style={{ fontWeight: 620, fontSize: 13.5 }}>{profile.name}</span>
              <span className="clip faint" style={{ fontSize: 11.5, textTransform: "capitalize" }}>{profile.title || profile.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-col">
        <header className="glass topbar">
          <button className="iconbtn" onClick={() => setCollapsed((c) => !c)} title="Toggle sidebar"><Icon name="filter" size={18} /></button>
          <div className="search">
            <Icon name="search" size={16} />
            <input ref={searchRef} value={query} onChange={(e) => onSearch(e.target.value)}
              onFocus={() => view !== "tasks" && setView("tasks")}
              placeholder={isMgr ? "Search tasks, people…" : "Search your tasks…"} />
            <kbd>⌘K</kbd>
          </div>
          <div className="spacer" />
          {isMgr && (
            <button className="btn btn-primary" onClick={genSummary}>
              <Icon name="spark" size={16} fill="current" /> <span className="nav-text">Where's My Team?</span>
            </button>
          )}
          <button className="iconbtn" onClick={onToggleTheme} title="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
        </header>

        <div className="content-scroll">
          <div className="col gap16 fadeup" style={{ paddingBottom: 24 }}>
            {/* page header — keeps current titles, sub-text and primary action placement */}
            <div className="page-head">
              <div className="col gap4">
                <div className="h-page">{title}</div>
                {sub && <div className="h-sub">{sub}</div>}
              </div>
              <div className="mauto">
                {isMgr
                  ? <button className="btn btn-primary" onClick={() => setShowAssign(true)}><Icon name="plus" size={16} sw={2.4} /> Assign task</button>
                  : <button className="btn btn-glass" onClick={() => setView("tasks")}><Icon name="tasks" size={16} /> View my tasks</button>}
              </div>
            </div>

            {view === "dashboard" && <Dashboard profile={profile} tasks={tasks} stats={stats} onOpen={(t) => setSelectedId(t.id)} aiPanel={aiPanel} />}
            {view === "tasks" && <Tasks profile={profile} tasks={tasks} query={query} onOpen={(t) => setSelectedId(t.id)} />}
            {view === "team" && isMgr && <Team users={users} tasks={tasks} onOpenTask={(id) => setSelectedId(id)} />}
            {view === "audit" && <Audit items={audit} onOpenTask={(id) => setSelectedId(id)} />}
          </div>
        </div>
      </div>

      {selected && <TaskDrawer task={selected} profile={profile} onClose={() => setSelectedId(null)} />}
      {showAssign && <AssignModal profile={profile} employees={employees} onClose={() => setShowAssign(false)} />}
    </div>
  );
}
