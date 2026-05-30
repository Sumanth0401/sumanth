/* Shared Liquid-Glass UI atoms — icons, avatar, pills, meters, sheets. */
import { useEffect } from "react";
import { initials } from "../util.js";

/* ---------- Icon set (hairline, SF-Symbols-ish) ---------- */
const ICONS = {
  dashboard: "M3 13h7V3H3v10zm0 8h7v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z",
  tasks: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  verify: "M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z",
  team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  audit: "M3 3v18h18M8 16l3-4 3 2 4-6",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  sun: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  plus: "M12 5v14M5 12h14",
  check: "M5 12l5 5L20 7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  pause: "M8 5v14M16 5v14",
  flag: "M4 21V4M4 4h12l-2 4 2 4H4",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  close: "M6 6l12 12M18 6L6 18",
  doc: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5zM9 13h6M9 17h6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  filter: "M3 5h18M6 12h12M10 19h4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  trend: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3.5-7z",
  board: "M4 4h6v16H4zM14 4h6v9h-6z",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

export function Icon({ name, size = 18, sw = 1.7, fill = "none", style }) {
  const d = ICONS[name] || ICONS.doc;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === "current" ? "currentColor" : "none"}
      stroke={fill === "current" ? "none" : "currentColor"} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flex: "none", ...style }}>
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------- Avatar (deterministic gradient from name) ---------- */
const PALETTE = [
  ["#0A84FF", "#5E5CE6"], ["#30D158", "#40C8E0"], ["#FF9F0A", "#FF375F"],
  ["#BF5AF2", "#5E5CE6"], ["#FF453A", "#FF9F0A"], ["#40C8E0", "#0A84FF"], ["#FF375F", "#BF5AF2"],
];
export function avatarColors(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export function Avatar({ name, size = 36, ring }) {
  const [a, b] = avatarColors(name);
  return (
    <div className={"avatar" + (ring ? " ring" : "")} title={name}
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(145deg, ${a}, ${b})` }}>
      {initials(name)}
    </div>
  );
}

/* ---------- Status / priority / verdict meta ---------- */
export const STATUS_META = {
  todo: { label: "To Do", c: "var(--s-todo)", icon: "inbox" },
  in_progress: { label: "In Progress", c: "var(--s-in_progress)", icon: "refresh" },
  blocked: { label: "Blocked", c: "var(--s-blocked)", icon: "pause" },
  done: { label: "Done", c: "var(--s-done)", icon: "check" },
};
export const PRIORITY_META = {
  low: { label: "Low", c: "var(--p-low)", icon: "chevD" },
  medium: { label: "Medium", c: "var(--p-medium)", icon: "filter" },
  high: { label: "High", c: "var(--p-high)", icon: "arrowUp" },
  urgent: { label: "Urgent", c: "var(--p-urgent)", icon: "alert" },
};
export const VERDICT_META = {
  genuine: { label: "Genuine", c: "var(--v-genuine)", bars: 3 },
  needs_detail: { label: "Needs detail", c: "var(--v-needs_detail)", bars: 2 },
  mismatch: { label: "Mismatch", c: "var(--v-mismatch)", bars: 1 },
  suspicious: { label: "Suspicious", c: "var(--v-suspicious)", bars: 1 },
};

export function StatusPill({ status, size }) {
  const s = STATUS_META[status] || STATUS_META.todo;
  return (
    <span className="pill" style={{
      background: `color-mix(in srgb, ${s.c} 16%, transparent)`, color: s.c,
      borderColor: `color-mix(in srgb, ${s.c} 30%, transparent)`,
      fontSize: size === "sm" ? 11 : 12, padding: size === "sm" ? "3px 8px" : "4px 10px" }}>
      <span className="dot" style={{ background: s.c }} />{s.label}
    </span>
  );
}

export function PriorityPill({ priority }) {
  const p = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span className="pill pill-soft" style={{ color: p.c }} title={"Priority: " + p.label}>
      <Icon name={p.icon} size={12} sw={2.2} />{p.label}
    </span>
  );
}

export function VerdictBadge({ verdict, confidence, withLabel = true }) {
  const v = VERDICT_META[verdict] || VERDICT_META.needs_detail;
  return (
    <span className="conf" title={v.label}
      style={{ color: v.c, background: `color-mix(in srgb, ${v.c} 12%, transparent)`, borderColor: `color-mix(in srgb, ${v.c} 28%, transparent)` }}>
      <span className="conf-bars">
        {[6, 9, 13].map((h, i) => <i key={i} style={{ height: h, opacity: i < v.bars ? 1 : 0.28 }} />)}
      </span>
      {withLabel && (confidence != null ? `${v.label} · ${confidence}%` : v.label)}
    </span>
  );
}

/* ---------- Progress bar + ring ---------- */
export function Bar({ value, w }) {
  return <div className="bar" style={{ width: w || "100%" }}><span style={{ width: (value || 0) + "%" }} /></div>;
}
export function Ring({ value = 0, size = 44, sw = 4, color }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flex: "none" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--tint)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || "url(#ringgrad)"} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value/100)}
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset .8s var(--ease-out)" }} />
      <defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="tnum" style={{ fontSize: size * 0.28, fontWeight: 700, fill: "var(--text)" }}>{value}</text>
    </svg>
  );
}

/* ---------- Deadline chip ---------- */
export function Deadline({ ts, status }) {
  if (!ts) return <span className="row gap6 faint" style={{ fontSize: 13 }}><Icon name="clock" size={14} sw={1.8} />No deadline</span>;
  const days = (ts - Date.now()) / 86400000;
  const date = new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  let txt = date, color = "var(--text-2)";
  if (status === "done") { txt = date; }
  else if (days < 0) { txt = `${date} · overdue`; color = "var(--c-red)"; }
  else if (days < 1) { txt = `${date} · due soon`; color = "var(--c-orange)"; }
  else if (days < 7) { txt = `${date} · ${Math.ceil(days)}d`; }
  return <span className="row gap6" style={{ color, fontSize: 13, fontWeight: 550 }}><Icon name="clock" size={14} sw={1.8} />{txt}</span>;
}

/* ---------- Modal (centered) + Sheet (right) ---------- */
export function Modal({ children, onClose, right }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className={"scrim" + (right ? " right" : "")} onClick={onClose}>
      <div className={"glass " + (right ? "sheet-r" : "sheet")} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function MiniStat({ val, label, c }) {
  return <div className="col gap4 center"><div className="kpi-val" style={{ fontSize: 26, color: c }}>{val}</div><div className="faint" style={{ fontSize: 12 }}>{label}</div></div>;
}
