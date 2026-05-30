import { useState } from "react";
import {
  PRIOS, STATUSES, initials, prioColor, statusColor, statusLabel,
  deadlineInfo, relTime,
} from "../util.js";

/* ---------------- stat cards ---------------- */
export function StatCards({ stats }) {
  const cards = [
    ["total", "Total tasks", stats.total],
    ["progress", "In progress", stats.in_progress],
    ["soon", "Due soon", stats.due_soon],
    ["overdue", "Overdue", stats.overdue],
    ["done", "Completed", stats.done],
  ];
  return (
    <div className="stat-row">
      {cards.map(([a, l, v]) => (
        <div key={a} className={`stat-card accent-${a}`}>
          <div className="sc-bar" />
          <div className="sc-val">{v}</div>
          <div className="sc-label">{l}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- task card ---------------- */
export function TaskCard({ task, onOpen }) {
  const dl = deadlineInfo(task.deadline, task.status);
  return (
    <div className={`task-card ${task.overdue ? "overdue" : ""}`} onClick={() => onOpen(task)}>
      <div className="tc-prio" style={{ background: prioColor(task.priority) }} title={task.priority} />
      <div className="tc-main">
        <div className="tc-title">{task.title}</div>
        <div className="tc-meta">
          <span className="pill" style={{ background: `color-mix(in srgb,${prioColor(task.priority)} 18%,transparent)`, color: prioColor(task.priority) }}>{task.priority}</span>
          {task.logCount ? <span>📝 {task.logCount} log{task.logCount > 1 ? "s" : ""}</span> : <span style={{ color: "var(--text-faint)" }}>no logs yet</span>}
        </div>
      </div>
      <div className="tc-assignee"><div className="mini-avatar">{initials(task.assigneeName)}</div>{task.assigneeName}</div>
      <div className={`badge-deadline ${dl.cls}`}>{dl.text}</div>
      <div className="badge-status" style={{ background: `color-mix(in srgb,${statusColor(task.status)} 16%,transparent)`, color: statusColor(task.status) }}>{statusLabel(task.status)}</div>
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return <div className="empty-state"><div className="es-ic">{icon}</div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>;
}

/* ---------------- dashboard ---------------- */
export function Dashboard({ profile, tasks, stats, onOpen, aiPanel }) {
  if (profile.role === "manager") {
    const attention = tasks.filter((t) => t.overdue || t.status === "blocked")
      .sort((a, b) => (a.deadline || 9e15) - (b.deadline || 9e15));
    return (
      <>
        <StatCards stats={stats} />
        {aiPanel}
        <div className="section-title">⚠ Needs attention <span className="st-count">{attention.length}</span></div>
        {attention.length
          ? <div className="task-list">{attention.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}</div>
          : <Empty icon="✓" title="All clear" sub="No overdue or blocked tasks right now." />}
      </>
    );
  }
  const active = tasks.filter((t) => t.status !== "done")
    .sort((a, b) => PRIOS.indexOf(b.priority) - PRIOS.indexOf(a.priority));
  const overdue = active.filter((t) => t.overdue);
  return (
    <>
      <StatCards stats={stats} />
      {overdue.length > 0 && (
        <>
          <div className="section-title" style={{ color: "var(--rose)" }}>⚠ Overdue — needs action <span className="st-count">{overdue.length}</span></div>
          <div className="task-list" style={{ marginBottom: 22 }}>{overdue.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}</div>
        </>
      )}
      <div className="section-title">My responsibilities <span className="st-count">{active.length} active</span></div>
      {active.length
        ? <div className="task-list">{active.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}</div>
        : <Empty icon="🎉" title="Nothing pending" sub="You're all caught up." />}
    </>
  );
}

/* ---------------- tasks ---------------- */
export function Tasks({ tasks, onOpen }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const counts = { all: tasks.length, overdue: tasks.filter((t) => t.overdue).length };
  STATUSES.forEach((s) => (counts[s.k] = tasks.filter((t) => t.status === s.k).length));

  let list = tasks;
  if (filter === "overdue") list = list.filter((t) => t.overdue);
  else if (filter !== "all") list = list.filter((t) => t.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.assigneeName || "").toLowerCase().includes(q));
  }
  const Chip = ({ k, label }) => (
    <button className={`filter-chip ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
      {label}<b>{counts[k] || 0}</b>
    </button>
  );
  return (
    <>
      <div className="filters">
        <Chip k="all" label="All" /><Chip k="todo" label="To Do" /><Chip k="in_progress" label="In Progress" />
        <Chip k="blocked" label="Blocked" /><Chip k="done" label="Done" /><Chip k="overdue" label="⚠ Overdue" />
        <input className="text-input filter-search" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {list.length
        ? <div className="task-list">{list.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}</div>
        : <Empty icon="◷" title="No tasks here" sub="Try a different filter." />}
    </>
  );
}

/* ---------------- team ---------------- */
export function Team({ users, tasks }) {
  const employees = users.filter((u) => u.role === "employee");
  if (!employees.length) return <Empty icon="👥" title="No team members yet" sub="Employees who register join your team automatically." />;
  return (
    <div className="team-grid">
      {employees.map((emp) => {
        const ts = tasks.filter((t) => t.assigneeId === emp.id);
        const done = ts.filter((t) => t.status === "done").length;
        const overdue = ts.filter((t) => t.overdue).length;
        const active = ts.filter((t) => t.status !== "done").length;
        const total = ts.length || 1;
        const seg = (n, c) => (n ? <i style={{ width: `${(n / total) * 100}%`, background: c }} /> : null);
        return (
          <div className="member-card" key={emp.id}>
            <div className="mc-head">
              <div className="avatar">{initials(emp.name)}</div>
              <div><div className="mc-name">{emp.name}</div><div className="mc-title">{emp.title || "Employee"}</div></div>
            </div>
            <div className="mc-stats">
              <div className="mc-stat"><div className="v">{active}</div><div className="l">Active</div></div>
              <div className="mc-stat"><div className="v" style={{ color: "var(--green)" }}>{done}</div><div className="l">Done</div></div>
              <div className="mc-stat"><div className="v" style={{ color: overdue ? "var(--rose)" : "var(--text)" }}>{overdue}</div><div className="l">Overdue</div></div>
            </div>
            <div className="mc-bar">
              {seg(done, "var(--green)")}
              {seg(ts.filter((t) => t.status === "in_progress").length, "var(--cyan)")}
              {seg(ts.filter((t) => t.status === "todo").length, "var(--s-todo)")}
              {seg(ts.filter((t) => t.status === "blocked").length, "var(--rose)")}
            </div>
            <div className="mc-load">{ts.length} task{ts.length !== 1 ? "s" : ""} total · {overdue ? <span style={{ color: "var(--rose)" }}>{overdue} need attention</span> : "on track"}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- audit ---------------- */
export function Audit({ items, onOpenTask }) {
  if (!items.length) return <Empty icon="⎙" title="No activity yet" sub="Task changes and work logs will appear here." />;
  return (
    <div className="timeline">
      {items.map((a) => (
        <div className={`tl-item ${a.action}`} key={a.id}>
          <div className="tl-dot" />
          <div className="tl-main">
            <span className="tl-actor">{a.actorName || "System"}</span>
            <span className="tl-detail"> {a.action.replace("_", " ")}{a.detail ? " — " + a.detail : ""}</span>
          </div>
          {a.taskTitle && <div className="tl-task" onClick={() => onOpenTask && onOpenTask(a.taskId)}>{a.taskTitle}</div>}
          <div className="tl-time">{new Date(a.createdAt).toLocaleString()} · {relTime(a.createdAt)}</div>
        </div>
      ))}
    </div>
  );
}
