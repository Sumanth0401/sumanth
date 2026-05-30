import { useState } from "react";
import { PRIOS, STATUSES, relTime, toast } from "../util.js";
import { changeStatus } from "../data.js";
import {
  Icon, Avatar, StatusPill, PriorityPill, Bar, Ring, Deadline, MiniStat,
  STATUS_META, PRIORITY_META,
} from "./ui.jsx";

/* ---------------- KPI card ---------------- */
function Kpi({ icon, tint, val, label, sub, ring, danger }) {
  return (
    <div className="glass kpi">
      <div className="kpi-val" style={danger ? { color: "var(--c-red)" } : null}>{val}</div>
      <div className="col gap4">
        <div className="kpi-label">{label}</div>
        {sub && <div className="faint" style={{ fontSize: 12 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="es-ic"><Icon name={icon} size={24} /></div>
      <h3>{title}</h3>{sub && <p>{sub}</p>}
    </div>
  );
}

/* ---------------- a single task row (list) ---------------- */
function TaskRow({ task, showAssignee, onOpen }) {
  return (
    <div className="trow glass-2" style={{ gridTemplateColumns: showAssignee ? "2.3fr 1.2fr 1fr 1.1fr 1.1fr auto" : "2.6fr 1fr 1.1fr 1.2fr auto",
      border: "1px solid var(--glass-border)", padding: "12px 16px" }} onClick={() => onOpen(task)}>
      <div className="col" style={{ gap: 4, minWidth: 0 }}>
        <div className="row gap8">
          <span className="mono faint" style={{ fontSize: 11 }}>#{task.id.slice(0, 5)}</span>
          {task.overdue && <span title="Overdue"><Icon name="alert" size={13} style={{ color: "var(--c-red)" }} /></span>}
        </div>
        <div className="clip" style={{ fontWeight: 620, fontSize: 14, textDecoration: task.status === "done" ? "line-through" : "none", color: task.status === "done" ? "var(--text-3)" : "var(--text)" }}>{task.title}</div>
      </div>
      {showAssignee && (
        <div className="row gap8" style={{ minWidth: 0 }}><Avatar name={task.assigneeName} size={26} /><span className="clip muted" style={{ fontSize: 13 }}>{task.assigneeName}</span></div>
      )}
      <div><PriorityPill priority={task.priority} /></div>
      <div><StatusPill status={task.status} /></div>
      <div><Deadline ts={task.deadline} status={task.status} /></div>
      <div className="row" style={{ justifyContent: "flex-end" }}><Icon name="chevR" size={16} style={{ color: "var(--text-3)" }} /></div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */
export function Dashboard({ profile, tasks, stats, onOpen, aiPanel }) {
  const isMgr = profile.role === "manager";
  const completion = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  if (isMgr) {
    const attention = tasks.filter((t) => t.overdue || t.status === "blocked")
      .sort((a, b) => (a.deadline || 9e15) - (b.deadline || 9e15));
    return (
      <div className="col gap16">
        <div className="kpi-grid">
          <Kpi icon="tasks" tint="#0A84FF" val={stats.total - stats.done} label="Active tasks" sub={`${stats.done} completed`} />
          <Kpi icon="alert" tint="#FF453A" val={stats.overdue} label="Overdue" sub={stats.overdue ? "Needs action today" : "All clear"} danger={stats.overdue > 0} />
          <Kpi icon="pause" tint="#FF9F0A" val={stats.blocked} label="Blocked" sub={`${stats.due_soon} due soon`} />
          <Kpi icon="target" tint="#30D158" val={completion + "%"} label="Completion rate" ring={completion} />
        </div>
        {aiPanel}
        <div className="glass card col gap12">
          <div className="row gap8">
            <div className="kpi-ico" style={{ background: "color-mix(in srgb, var(--c-red) 16%, transparent)", color: "var(--c-red)", width: 32, height: 32, borderRadius: 9 }}><Icon name="bell" size={16} /></div>
            <div className="section-title" style={{ color: "var(--text)" }}>Needs attention</div>
            <span className="pill pill-soft mauto">{attention.length}</span>
          </div>
          {attention.length
            ? <div className="col gap8">{attention.map((t) => <TaskRow key={t.id} task={t} showAssignee onOpen={onOpen} />)}</div>
            : <Empty icon="check" title="All clear" sub="No overdue or blocked tasks right now." />}
        </div>
      </div>
    );
  }

  // employee
  const active = tasks.filter((t) => t.status !== "done")
    .sort((a, b) => PRIOS.indexOf(b.priority) - PRIOS.indexOf(a.priority));
  const overdue = active.filter((t) => t.overdue);
  return (
    <div className="col gap16">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Kpi icon="inbox" tint="#0A84FF" val={active.length} label="Active tasks" sub={`${stats.due_soon} due soon`} />
        <Kpi icon="alert" tint="#FF453A" val={stats.overdue} label="Overdue" sub={stats.overdue ? "Log an update" : "None — nice"} danger={stats.overdue > 0} />
        <Kpi icon="check" tint="#30D158" val={stats.done} label="Completed" sub="this period" />
      </div>
      {overdue.length > 0 && (
        <div className="glass card col gap10">
          <div className="section-title" style={{ color: "var(--c-red)" }}>⚠ Overdue — needs action <span className="pill pill-soft">{overdue.length}</span></div>
          <div className="col gap8">{overdue.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}</div>
        </div>
      )}
      <div className="glass card col gap10">
        <div className="section-title" style={{ color: "var(--text)" }}>My responsibilities <span className="pill pill-soft">{active.length} active</span></div>
        {active.length
          ? <div className="col gap8">{active.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}</div>
          : <Empty icon="check" title="Nothing pending" sub="You're all caught up." />}
      </div>
    </div>
  );
}

/* ---------------- tasks (List + Board) ---------------- */
const FILTERS = [
  { k: "all", label: "All" }, { k: "todo", label: "To Do" }, { k: "in_progress", label: "In Progress" },
  { k: "blocked", label: "Blocked" }, { k: "done", label: "Done" }, { k: "overdue", label: "Overdue" },
];

export function Tasks({ profile, tasks, query, onOpen }) {
  const isMgr = profile.role === "manager";
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState(isMgr ? "list" : "board"); // employees default to the board

  let list = tasks;
  if (filter === "overdue") list = list.filter((t) => t.overdue);
  else if (filter !== "all") list = list.filter((t) => t.status === filter);
  const q = (query || "").trim().toLowerCase();
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.assigneeName || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q));

  const counts = (k) => k === "all" ? tasks.length : k === "overdue" ? tasks.filter((t) => t.overdue).length : tasks.filter((t) => t.status === k).length;

  return (
    <div className="col gap14">
      <div className="row gap10 wrap">
        <div className="segmented">
          <button className={mode === "board" ? "on" : ""} onClick={() => setMode("board")}><Icon name="board" size={15} /> Board</button>
          <button className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}><Icon name="tasks" size={15} /> List</button>
        </div>
        <div className="row gap8 wrap mauto">
          {FILTERS.map((f) => (
            <button key={f.k} className={"btn btn-sm " + (filter === f.k ? "btn-primary" : "btn-glass")} onClick={() => setFilter(f.k)}>
              {f.label}<span style={{ opacity: .7, marginLeft: 4 }}>{counts(f.k)}</span>
            </button>
          ))}
        </div>
      </div>

      {q && <div className="board-hint">Showing results for “{query}” · {list.length} match{list.length === 1 ? "" : "es"}</div>}

      {mode === "board"
        ? <Board profile={profile} tasks={list} onOpen={onOpen} />
        : (list.length
            ? <div className="glass" style={{ padding: 8 }}>
                <div className="col gap2">{list.map((t) => <TaskRow key={t.id} task={t} showAssignee={isMgr} onOpen={onOpen} />)}</div>
              </div>
            : <Empty icon="tasks" title="No tasks here" sub="Try a different filter or search." />)}
    </div>
  );
}

/* ---------------- Kanban board (drag & drop) ---------------- */
function Board({ profile, tasks, onOpen }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  async function move(task, status) {
    if (!task || task.status === status) return;
    const canEdit = profile.role === "manager" || task.assigneeId === profile.id;
    if (!canEdit) { toast("You can only move your own tasks", "err"); return; }
    try { await changeStatus(task, profile, status); toast(`Moved to ${STATUS_META[status].label}`); }
    catch (e) { toast(e.message, "err"); }
  }

  return (
    <div className="board">
      {STATUSES.map((col) => {
        const meta = STATUS_META[col.k];
        const items = tasks.filter((t) => t.status === col.k);
        return (
          <div key={col.k}
            className={"glass board-col" + (overCol === col.k ? " drag-over" : "")}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.k); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setOverCol(null); }}
            onDrop={(e) => {
              e.preventDefault(); setOverCol(null);
              const id = e.dataTransfer.getData("text/plain") || dragId;
              move(tasks.find((t) => t.id === id), col.k);
              setDragId(null);
            }}>
            <div className="board-col-head">
              <span className="dot" style={{ background: meta.c }} />
              <span className="board-col-title">{meta.label}</span>
              <span className="board-col-count">{items.length}</span>
            </div>
            <div className="board-cards">
              {items.map((t) => (
                <div key={t.id}
                  className={"board-card" + (t.overdue && t.status !== "done" ? " overdue" : "") + (dragId === t.id ? " dragging" : "")}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; setDragId(t.id); }}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onClick={() => onOpen(t)}>
                  <div className="row gap8">
                    <PriorityPill priority={t.priority} />
                    {t.logCount ? <span className="ai-chip" style={{ padding: "3px 9px", fontSize: 11 }}><Icon name="spark" size={11} fill="current" />{t.logCount}</span> : null}
                  </div>
                  <div className="bc-title">{t.title}</div>
                  <div className="row gap10 wrap" style={{ justifyContent: "space-between" }}>
                    <Deadline ts={t.deadline} status={t.status} />
                    {profile.role === "manager" && <Avatar name={t.assigneeName} size={22} />}
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="board-empty">Drop tasks here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- team ---------------- */
export function Team({ users, tasks, onOpenTask }) {
  const employees = users.filter((u) => u.role === "employee");
  if (!employees.length) return <Empty icon="team" title="No team members yet" sub="Employees who register join your team automatically." />;
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
      {employees.map((emp) => {
        const ts = tasks.filter((t) => t.assigneeId === emp.id);
        const done = ts.filter((t) => t.status === "done").length;
        const overdue = ts.filter((t) => t.overdue).length;
        const active = ts.filter((t) => t.status !== "done").length;
        const total = ts.length || 1;
        const pct = Math.round((done / total) * 100);
        const state = overdue ? { label: "Behind", c: "#FF453A" } : active === 0 ? { label: "On track", c: "#30D158" } : { label: "Active", c: "#0A84FF" };
        return (
          <div className="glass card col gap14" key={emp.id}>
            <div className="row gap12">
              <Avatar name={emp.name} size={48} ring />
              <div className="col" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 660, fontSize: 16 }} className="clip">{emp.name}</span>
                <span className="faint clip" style={{ fontSize: 13 }}>{emp.title || "Employee"}</span>
              </div>
              <span className="pill" style={{ background: `color-mix(in srgb, ${state.c} 15%, transparent)`, color: state.c, borderColor: `color-mix(in srgb, ${state.c} 28%, transparent)`, alignSelf: "flex-start" }}>
                <span className="dot" style={{ background: state.c }} />{state.label}
              </span>
            </div>
            <div className="row" style={{ justifyContent: "space-around" }}>
              <MiniStat val={active} label="Active" c="#0A84FF" />
              <MiniStat val={overdue} label="Overdue" c={overdue ? "#FF453A" : "var(--text-3)"} />
              <MiniStat val={done} label="Done" c="#30D158" />
            </div>
            <div className="col gap6">
              <div className="row faint" style={{ fontSize: 11, justifyContent: "space-between" }}><span>completion</span><span className="tnum">{pct}%</span></div>
              <Bar value={pct} />
            </div>
            <div className="col gap2">
              {ts.slice(0, 4).map((t) => (
                <div key={t.id} className="trow" style={{ gridTemplateColumns: "1fr auto", padding: "8px 10px" }} onClick={() => onOpenTask(t.id)}>
                  <span className="clip" style={{ fontSize: 13.5, fontWeight: 550, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "var(--text-3)" : "var(--text)" }}>{t.title}</span>
                  <StatusPill status={t.status} size="sm" />
                </div>
              ))}
              {ts.length === 0 && <span className="faint" style={{ fontSize: 12.5 }}>No tasks assigned yet.</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- audit ---------------- */
export function Audit({ items, onOpenTask }) {
  if (!items.length) return <Empty icon="audit" title="No activity yet" sub="Task changes and work logs will appear here." />;
  return (
    <div className="glass card">
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
    </div>
  );
}
