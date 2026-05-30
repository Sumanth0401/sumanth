import { useState } from "react";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { createProfile, getProfile } from "../data";
import { Logo } from "./bits.jsx";
import { Icon } from "./ui.jsx";

export default function Auth({ onReady, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
        let p = await getProfile(cred.user.uid);
        if (!p) p = await createProfile(cred.user.uid, { name: cred.user.displayName || email.split("@")[0], email: cred.user.email, role: "employee" });
        onReady && onReady(p);
      } else {
        if (!name.trim()) throw new Error("Please enter your name.");
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        await updateProfile(cred.user, { displayName: name.trim() });
        const p = await createProfile(cred.user.uid, { name: name.trim(), email: cred.user.email, role, title: title.trim() });
        onReady && onReady(p);
      }
    } catch (e2) { setErr(prettyError(e2)); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-view">
      {onToggleTheme && (
        <button className="iconbtn" onClick={onToggleTheme} title="Toggle theme" style={{ position: "fixed", top: 18, right: 18, zIndex: 2 }}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
      )}
      <div className="glass auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><Logo size={26} /></div>
          <div className="col center gap4">
            <span className="brand-name" style={{ fontSize: 24 }}>WorkFlow</span>
            <span className="brand-sub">accountability, not just tracking</span>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign in</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Create account</button>
        </div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="field">
                <label className="field-label">Full name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="field">
                <label className="field-label">Role</label>
                <div className="role-pick">
                  <label className="role-opt">
                    <input type="radio" name="role" checked={role === "employee"} onChange={() => setRole("employee")} />
                    <span><Icon name="user" size={15} /> Employee</span>
                  </label>
                  <label className="role-opt">
                    <input type="radio" name="role" checked={role === "manager"} onChange={() => setRole("manager")} />
                    <span><Icon name="team" size={15} /> Manager</span>
                  </label>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Job title <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(optional)</span></label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Account Executive" />
              </div>
            </>
          )}
          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <div className="form-error" style={{ marginBottom: 14 }}>{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        <p className="faint" style={{ marginTop: 18, textAlign: "center", fontSize: 12.5, lineHeight: 1.6 }}>
          {mode === "login"
            ? "New here? Create a Manager account first, then register Employees — they auto-join your team."
            : "Managers assign & oversee. Employees log daily work that the AI verifies."}
        </p>
      </div>
    </div>
  );
}

function prettyError(e) {
  const c = e.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Invalid email or password.";
  if (c.includes("email-already-in-use")) return "That email is already registered — try signing in.";
  if (c.includes("weak-password")) return "Password should be at least 6 characters.";
  if (c.includes("invalid-email")) return "Please enter a valid email.";
  if (c.includes("permission-denied")) return "Firestore rules blocked this. Publish firestore.rules in the Firebase console.";
  return e.message || "Something went wrong.";
}
