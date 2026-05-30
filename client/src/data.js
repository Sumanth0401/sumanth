// Firestore data layer — all reads use real-time onSnapshot listeners.
import {
  collection, doc, addDoc, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { api } from "./api";

const now = () => Date.now();

/* ---------------- user profiles ---------------- */
export async function createProfile(uid, { name, email, role, title }) {
  let managerId = null;
  if (role === "employee") {
    // attach to the first manager so the demo works out of the box
    const snap = await getDocsOnce(query(collection(db, "users"), where("role", "==", "manager")));
    if (snap.length) managerId = snap[0].id;
  }
  const profile = { name, email, role, managerId, title: title || "", createdAt: now() };
  await setDoc(doc(db, "users", uid), profile);
  return { id: uid, ...profile };
}

export async function getProfile(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// one-shot read helper
function getDocsOnce(q) {
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(q, (snap) => {
      unsub();
      resolve(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, reject);
  });
}

/* ---------------- listeners ---------------- */
export function listenUsers(profile, cb) {
  // managers see their employees; everyone sees themselves
  if (profile.role === "manager") {
    const q = query(collection(db, "users"), where("managerId", "==", profile.id));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb([profile, ...list.filter((u) => u.id !== profile.id)]);
    });
  }
  cb([profile]);
  return () => {};
}

export function listenTasks(profile, cb) {
  const field = profile.role === "manager" ? "assignerId" : "assigneeId";
  const q = query(collection(db, "tasks"), where(field, "==", profile.id));
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    cb(tasks.map(withDerived));
  });
}

export function listenLogs(taskId, cb) {
  const q = collection(db, "tasks", taskId, "logs");
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt));
  });
}

export function listenTaskAudit(taskId, cb) {
  const q = query(collection(db, "audit"), where("taskId", "==", taskId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt));
  });
}

export function listenAudit(profile, cb) {
  const q = query(collection(db, "audit"), where("participants", "array-contains", profile.id));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.createdAt - a.createdAt).slice(0, 100));
  });
}

function withDerived(t) {
  const overdue = !!(t.deadline && t.status !== "done" && t.deadline < now());
  return { ...t, overdue };
}

/* ---------------- writes (+ audit) ---------------- */
async function writeAudit(task, actor, action, detail) {
  await addDoc(collection(db, "audit"), {
    taskId: task.id, taskTitle: task.title,
    actorId: actor.id, actorName: actor.name,
    action, detail: detail || "",
    participants: [task.assigneeId, task.assignerId].filter(Boolean),
    createdAt: now(),
  });
}

export async function createTask(actor, { title, description, assignee, priority, deadline }) {
  const t = now();
  const ref = await addDoc(collection(db, "tasks"), {
    title, description: description || "",
    assigneeId: assignee.id, assigneeName: assignee.name,
    assignerId: actor.id, assignerName: actor.name,
    priority: priority || "medium", status: "todo",
    deadline: deadline || null, createdAt: t, updatedAt: t, completedAt: null,
  });
  await writeAudit({ id: ref.id, title, assigneeId: assignee.id, assignerId: actor.id },
    actor, "created", `Assigned to ${assignee.name} · ${priority} priority`);
  return ref.id;
}

export async function changeStatus(task, actor, status) {
  const patch = { status, updatedAt: now() };
  patch.completedAt = status === "done" ? now() : null;
  await updateDoc(doc(db, "tasks", task.id), patch);
  await writeAudit(task, actor, "updated", `status ${task.status} → ${status}`);
}

export async function editTask(task, actor, patch, detail) {
  await updateDoc(doc(db, "tasks", task.id), { ...patch, updatedAt: now() });
  await writeAudit(task, actor, "updated", detail || "edited task");
}

export async function removeTask(task, actor) {
  await writeAudit(task, actor, "deleted", "task removed");
  await deleteDoc(doc(db, "tasks", task.id));
}

// Add a daily work log — runs AI verification first, then stores everything.
export async function addLog(task, actor, content) {
  let ai = null, aiError = null;
  try {
    ai = await api.verifyLog(
      { title: task.title, description: task.description, status: task.status }, content);
  } catch (e) { aiError = e.message; }
  await addDoc(collection(db, "tasks", task.id, "logs"), {
    userId: actor.id, userName: actor.name, content, createdAt: now(),
    ai: ai || null,
  });
  await updateDoc(doc(db, "tasks", task.id), { logCount: increment(1), updatedAt: now() });
  await writeAudit(task, actor, "work_log",
    "logged work" + (ai ? ` · AI: ${ai.verdict} (${ai.confidence}%)` : ""));
  return { ai, aiError };
}
