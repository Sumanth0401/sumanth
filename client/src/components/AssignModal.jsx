import { useState } from "react";
import { toast } from "../util.js";
import { createTask } from "../data.js";
import { api } from "../api.js";
import { Icon, Modal } from "./ui.jsx";

export default function AssignModal({ profile, employees, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assigneeId, setAssigneeId] = useState(employees[0]?.id || "");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  async function suggest() {
    const text = (desc || title).trim();
    if (!text) { toast("Add a title or description first", "err"); return; }
    setSuggesting(true);
    try {
      const r = await api.suggest(text);
      setPriority(r.priority);
      const d = new Date(Date.now() + (r.days || 3) * 86400000);
      setDeadline(d.toISOString().slice(0, 10));
      toast(`AI: ${r.priority}, ~${r.days}d — ${r.reasoning}`, "info");
    } catch (e) { toast(e.message, "err"); }
    finally { setSuggesting(false); }
  }

  async function create() {
    setErr("");
    if (!title.trim()) { setErr("Title is required."); return; }
    const assignee = employees.find((u) => u.id === assigneeId);
    if (!assignee) { setErr("Pick an assignee."); return; }
    setBusy(true);
    try {
      await createTask(profile, {
        title: title.trim(), description: desc.trim(), assignee, priority,
        deadline: deadline ? new Date(deadline + "T17:00:00").getTime() : null,
      });
      toast("Task assigned ✓");
      onCreated && onCreated();
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose}>
      <div className="sheet-head">
        <div className="kpi-ico" style={{ background: "linear-gradient(150deg, var(--accent), var(--accent-2))", color: "#fff" }}><Icon name="plus" size={19} sw={2.4} /></div>
        <div className="col" style={{ gap: 2, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Assign a task</div>
          <div className="faint" style={{ fontSize: 13 }}>Assign it, set a deadline — the audit trail starts now.</div>
        </div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={18} /></button>
      </div>

      <div className="content-scroll" style={{ padding: 20 }}>
        <div className="field">
          <label className="field-label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Reconcile Q3 invoices" autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Description</label>
          <textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What exactly needs to be done?" />
        </div>
        <button className="btn btn-glass btn-block" style={{ marginBottom: 14, color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }} disabled={suggesting} onClick={suggest}>
          <Icon name="spark" size={15} fill="current" /> {suggesting ? "Thinking…" : "Suggest priority & deadline"}
        </button>
        <div className="grid2">
          <div className="field">
            <label className="field-label">Assignee</label>
            <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              {employees.length === 0 && <option value="">No employees yet</option>}
              {employees.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.title || "Employee"}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Deadline</label>
          <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        {err && <div className="form-error">{err}</div>}
      </div>

      <div className="sheet-foot">
        <button className="btn btn-ghost mauto" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={create}><Icon name="check" size={15} sw={2.4} /> {busy ? "Assigning…" : "Assign task"}</button>
      </div>
    </Modal>
  );
}
