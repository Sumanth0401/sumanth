import { useEffect, useState } from "react";
import {
  STATUSES, initials, prioColor, statusColor, deadlineInfo, relTime,
} from "../util.js";
import { toast } from "../util.js";
import {
  listenLogs, listenTaskAudit, changeStatus, addLog, removeTask,
} from "../data.js";

const VLABEL = { genuine: "Genuine", needs_detail: "Needs detail", mismatch: "Mismatch", suspicious: "Suspicious" };

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
  const dl = deadlineInfo(task.deadline, task.status);

  async function setStatus(status) {
    if (status === task.status) return;
    try { await changeStatus(task, profile, status); toast(`Marked ${STATUSES.find((s) => s.k === status).label}`); }
    catch (e) { toast(e.message, "err"); }
  }

  async function submit() {
    if (!logText.trim()) { toast("Write your log first", "err"); return; }
    setSubmitting(true);
    try {
      const { ai, aiError } = await addLog(task, profile, logText.trim());
      setLogText("");
      if (aiError) toast("Saved (AI offline: " + aiError + ")", "info");
      else toast(`Log verified: ${VLABEL[ai.verdict]} (${ai.confidence}%) ✦`);
    } catch (e) { toast(e.message, "err"); }
    finally { setSubmitting(false); }
  }

  async function del() {
    if (!confirm("Delete this task and its logs? Recorded in the audit trail.")) return;
    try { await removeTask(task, profile); toast("Task deleted"); onClose(); }
    catch (e) { toast(e.message, "err"); }
  }

  return (
    <div className="drawer-root">
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <div className="dh-top">
            <div className="dh-title">{task.title}</div>
            <button className="modal-x" onClick={onClose}>✕</button>
          </div>
          <div className="dh-prio">
            <span className="pill" style={{ background: `color-mix(in srgb,${prioColor(task.priority)} 18%,transparent)`, color: prioColor(task.priority) }}>{task.priority} priority</span>
            <span className={`badge-deadline ${dl.cls}`}>⏱ {dl.text}</span>
          </div>
          <div className="dh-meta">
            <span>👤 {task.assigneeName}</span>
            <span>assigned by {task.assignerName}</span>
          </div>
        </div>

        <div className="drawer-body">
          <div className="dsec">
            <div className="dsec-label">Status</div>
            <div className="status-picker">
              {STATUSES.map((s) => (
                <button key={s.k} className={`status-opt ${task.status === s.k ? "active" : ""}`}
                  disabled={!canEdit}
                  style={task.status === s.k ? { background: statusColor(s.k), borderColor: statusColor(s.k) } : undefined}
                  onClick={() => setStatus(s.k)}>{s.label}</button>
              ))}
            </div>
          </div>

          {task.description && (
            <div className="dsec">
              <div className="dsec-label">Description</div>
              <div className="dsec-desc">{task.description}</div>
            </div>
          )}

          <div className="dsec">
            <div className="dsec-label">Daily work logs{logs.length ? ` · ${logs.length}` : ""}</div>
            {canEdit && (
              <div className="log-compose">
                <textarea value={logText} onChange={(e) => setLogText(e.target.value)}
                  placeholder="What did you actually do on this task today? Be specific — the AI checks it against the task." />
                <div className="log-compose-foot">
                  <span className="lc-hint">✦ AI verifies your log against the task</span>
                  <button className="btn primary mini" disabled={submitting} onClick={submit}>
                    {submitting ? "Verifying…" : "Submit log"}
                  </button>
                </div>
              </div>
            )}
            {logs.length === 0 && <div className="ai-placeholder">No work logged yet.</div>}
            {logs.map((l) => <LogItem key={l.id} log={l} />)}
          </div>

          <div className="dsec">
            <div className="dsec-label">Audit trail</div>
            <div className="timeline">
              {audit.map((a) => (
                <div className={`tl-item ${a.action}`} key={a.id}>
                  <div className="tl-dot" />
                  <div className="tl-main">
                    <span className="tl-actor">{a.actorName}</span>
                    <span className="tl-detail"> {a.action.replace("_", " ")}{a.detail ? " — " + a.detail : ""}</span>
                  </div>
                  <div className="tl-time">{relTime(a.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>

          {isMgr && (
            <button className="btn block" style={{ color: "var(--rose)", borderColor: "rgba(251,113,133,.3)" }} onClick={del}>
              Delete task
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function LogItem({ log }) {
  const ai = log.ai;
  return (
    <div className="log-item">
      <div className="li-head">
        <div className="li-author"><div className="mini-avatar">{initials(log.userName)}</div>{log.userName}</div>
        <div className="li-time">{relTime(log.createdAt)}</div>
      </div>
      <div className="li-content">{log.content}</div>
      {ai && (
        <div className="ai-verdict">
          <div className="av-head">
            <span className="ai-spark">✦</span> AI verification
            <span className={`av-badge v-${ai.verdict}`}>{VLABEL[ai.verdict]}</span>
            <span className="av-conf">{ai.confidence}% confidence</span>
          </div>
          <div className="av-meter"><i className={`m-${ai.verdict}`} style={{ width: `${ai.confidence}%` }} /></div>
          <div className="av-summary">{ai.summary}</div>
          {ai.reasons && ai.reasons.length > 0 && (
            <div className="av-reasons">{ai.reasons.map((r, i) => <div className="av-reason" key={i}>{r}</div>)}</div>
          )}
        </div>
      )}
    </div>
  );
}
