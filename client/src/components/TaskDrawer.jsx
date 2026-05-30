import { useEffect, useState } from "react";
import { STATUSES, relTime, toast } from "../util.js";
import { listenLogs, listenTaskAudit, changeStatus, addLog, removeTask } from "../data.js";
import {
  Icon, Avatar, StatusPill, PriorityPill, Deadline, Modal,
  STATUS_META, VERDICT_META,
} from "./ui.jsx";

export default function TaskDrawer({ task, profile, onClose }) {
  const [logs, setLogs] = useState([]);
  const [audit, setAudit] = useState([]);
  const [logText, setLogText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const a = listenLogs(task.id, setLogs);
    const b = listenTaskAudit(task.id, setAudit);
    return () => { a(); b(); };
  }, [task.id]);

  const isMgr = profile.role === "manager";
  const isOwner = task.assigneeId === profile.id;
  const canEdit = isMgr || isOwner;

  async function setStatus(status) {
    if (status === task.status) return;
    try { await changeStatus(task, profile, status); toast(`Marked ${STATUS_META[status].label}`); }
    catch (e) { toast(e.message, "err"); }
  }

  async function submit() {
    if (!logText.trim()) { toast("Write your log first", "err"); return; }
    setSubmitting(true);
    try {
      const { ai, aiError } = await addLog(task, profile, logText.trim());
      setLogText("");
      if (aiError) toast("Saved (AI offline: " + aiError + ")", "info");
      else toast(`Log verified: ${VERDICT_META[ai.verdict]?.label || ai.verdict} (${ai.confidence}%) ✦`);
    } catch (e) { toast(e.message, "err"); }
    finally { setSubmitting(false); }
  }

  async function del() {
    if (!confirm("Delete this task and its logs? Recorded in the audit trail.")) return;
    try { await removeTask(task, profile); toast("Task deleted"); onClose(); }
    catch (e) { toast(e.message, "err"); }
  }

  return (
    <Modal right onClose={onClose}>
      <div className="sheet-head">
        <div className="col gap4" style={{ flex: 1, minWidth: 0 }}>
          <div className="row gap8"><span className="mono faint" style={{ fontSize: 12 }}>#{task.id.slice(0, 6)}</span><StatusPill status={task.status} /></div>
          <div style={{ fontWeight: 720, fontSize: 21, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{task.title}</div>
        </div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={18} /></button>
      </div>

      <div className="content-scroll col gap18" style={{ padding: 20 }}>
        <div className="row gap16 wrap">
          <Meta label="Assignee"><div className="row gap8"><Avatar name={task.assigneeName} size={24} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>{task.assigneeName}</span></div></Meta>
          <Meta label="Priority"><PriorityPill priority={task.priority} /></Meta>
          <Meta label="Deadline"><Deadline ts={task.deadline} status={task.status} /></Meta>
          <Meta label="Assigned by"><span className="muted" style={{ fontSize: 13.5 }}>{task.assignerName}</span></Meta>
        </div>

        {task.description && (
          <div className="col gap8">
            <div className="section-title">Description</div>
            <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{task.description}</div>
          </div>
        )}

        {canEdit && (
          <div className="col gap8">
            <div className="section-title">Update status</div>
            <div className="row gap6 wrap">
              {STATUSES.map((s) => (
                <button key={s.k} className={"btn btn-sm " + (task.status === s.k ? "btn-primary" : "btn-glass")} onClick={() => setStatus(s.k)}>{s.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="col gap10">
          <div className="row"><div className="section-title">Daily work logs{logs.length ? ` · ${logs.length}` : ""}</div></div>
          {canEdit && (
            <div className="glass-2 col gap10" style={{ border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: 14 }}>
              <textarea className="input" rows={4} value={logText} onChange={(e) => setLogText(e.target.value)}
                placeholder="What did you actually do on this task today? Be specific — the AI checks it against the task." />
              <div className="row">
                <span className="ai-chip" style={{ background: "var(--tint)", border: "1px solid var(--glass-border)", color: "var(--text-2)" }}>
                  <Icon name="spark" size={13} fill="current" style={{ color: "var(--accent)" }} /> The AI verifies your log against the task
                </span>
                <button className="btn btn-primary btn-sm mauto" disabled={submitting} onClick={submit}>
                  {submitting ? "Verifying…" : <><Icon name="check" size={14} sw={2.4} /> Submit log</>}
                </button>
              </div>
            </div>
          )}
          {logs.length === 0 && <div className="faint" style={{ fontSize: 13 }}>No work logged yet.</div>}
          {logs.map((l) => <LogItem key={l.id} log={l} />)}
        </div>

        <div className="col gap10">
          <div className="row gap8"><div className="section-title">Audit trail</div><span className="pill pill-soft" style={{ fontSize: 11 }}>tamper-resistant</span></div>
          <div className="timeline">
            {audit.map((a) => (
              <div className={`tl-item ${a.action}`} key={a.id}>
                <div className="tl-dot" />
                <div className="tl-main"><span className="tl-actor">{a.actorName}</span><span className="tl-detail"> {a.action.replace("_", " ")}{a.detail ? " — " + a.detail : ""}</span></div>
                <div className="tl-time">{relTime(a.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>

        {isMgr && <button className="btn btn-danger btn-block" onClick={del}><Icon name="trash" size={15} /> Delete task</button>}
      </div>
    </Modal>
  );
}

function Meta({ label, children }) {
  return <div className="col gap6" style={{ minWidth: 120 }}><div className="field-label" style={{ marginBottom: 0 }}>{label}</div>{children}</div>;
}

function LogItem({ log }) {
  const ai = log.ai;
  const v = ai ? (VERDICT_META[ai.verdict] || VERDICT_META.needs_detail) : null;
  return (
    <div className="glass-2 col gap8" style={{ border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: 14 }}>
      <div className="row gap8">
        <Avatar name={log.userName} size={28} />
        <span style={{ fontWeight: 620, fontSize: 13.5 }}>{log.userName}</span>
        <span className="faint mono mauto" style={{ fontSize: 11.5 }}>{relTime(log.createdAt)}</span>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{log.content}</div>
      {ai && (
        <div className="ai-verdict">
          <div className="av-head">
            <Icon name="spark" size={14} fill="current" style={{ color: v.c }} />
            <span style={{ color: v.c }}>AI verification</span>
            <span className="av-badge" style={{ background: `color-mix(in srgb, ${v.c} 16%, transparent)`, color: v.c }}>{v.label}</span>
            <span className="av-conf">{ai.confidence}% confidence</span>
          </div>
          <div className="av-meter"><i style={{ width: `${ai.confidence}%`, background: v.c }} /></div>
          <div className="av-summary">{ai.summary}</div>
          {ai.reasons && ai.reasons.length > 0 && (
            <div className="av-reasons">{ai.reasons.map((r, i) => <div className="av-reason" key={i}>{r}</div>)}</div>
          )}
        </div>
      )}
    </div>
  );
}
