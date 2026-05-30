/* =============================================================
   TaskFlow — icon set (hairline SF-Symbols-ish) + small UI atoms
   ============================================================= */

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
  chevL: "M15 6l-6 6 6 6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  close: "M6 6l12 12M18 6L6 18",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  doc: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5zM9 13h6M9 17h6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  filter: "M3 5h18M6 12h12M10 19h4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
  trend: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  star: "M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.5 3.2L7 14.2 2 9.4l7-.9L12 2z",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3.5-7z",
  calendar: "M3 9h18M7 3v4M17 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

function Icon({ name, size = 18, sw = 1.7, fill = "none", style }) {
  const d = ICONS[name] || ICONS.doc;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === "current" ? "currentColor" : "none"}
      stroke={fill === "current" ? "none" : "currentColor"} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flex: "none", ...style }}>
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

// ---- Avatar ----
function Avatar({ user, size = 36, ring }) {
  const u = typeof user === "string" ? byId(user) : user;
  if (!u) return null;
  return (
    <div className={"avatar" + (ring ? " ring" : "")}
      style={{ width: size, height: size, fontSize: size * 0.4,
        background: `linear-gradient(145deg, ${u.color[0]}, ${u.color[1]})` }}
      title={u.name}>
      {u.initials}
    </div>
  );
}

// ---- Pills ----
function StatusPill({ status, size }) {
  const s = STATUS[status];
  return (
    <span className="pill" style={{
      background: `color-mix(in srgb, ${s.c} 16%, transparent)`,
      color: s.c, borderColor: `color-mix(in srgb, ${s.c} 30%, transparent)`,
      fontSize: size === "sm" ? 11 : 12, padding: size === "sm" ? "3px 8px" : "4px 10px" }}>
      <span className="dot" style={{ background: s.c }}></span>{s.label}
    </span>
  );
}

function PriorityPill({ priority }) {
  const p = PRIORITY[priority];
  return (
    <span className="pill pill-soft" style={{ color: p.c }} title={"Priority: " + p.label}>
      <Icon name={priority === "high" ? "arrowUp" : priority === "low" ? "chevD" : "filter"} size={12} sw={2.2} />
      {p.label}
    </span>
  );
}

// ---- Confidence badge (AI) ----
function ConfBadge({ conf, withLabel = true }) {
  const c = CONF[conf];
  return (
    <span className="conf" style={{ color: c.c, background: `color-mix(in srgb, ${c.c} 12%, transparent)`,
      borderColor: `color-mix(in srgb, ${c.c} 28%, transparent)` }} title={c.note}>
      <span className="conf-bars">
        {[6, 9, 13].map((h, i) => <i key={i} style={{ height: h, opacity: i < c.bars ? 1 : 0.28 }} />)}
      </span>
      {withLabel && c.label}
    </span>
  );
}

// ---- Progress bar ----
function Bar({ value, w }) {
  return <div className="bar" style={{ width: w || "100%" }}><span style={{ width: value + "%" }}></span></div>;
}

// ---- Progress ring ----
function Ring({ value, size = 44, sw = 4, color }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flex: "none" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--tint)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || "url(#ringgrad)"} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value/100)}
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset .8s var(--ease-out)" }} />
      <defs>
        <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size * 0.28, fontWeight: 700, fill: "var(--text)" }} className="tnum">{value}</text>
    </svg>
  );
}

// ---- Deadline chip ----
function Deadline({ date }) {
  const r = relDeadline(date);
  const color = r.danger ? "var(--c-red)" : r.warn ? "var(--c-orange)" : "var(--text-2)";
  return (
    <span className="row gap6" style={{ color, fontSize: 13, fontWeight: 550 }}>
      <Icon name="clock" size={14} sw={1.8} />{r.txt}
    </span>
  );
}

// ---- Generic modal ----
function Modal({ children, onClose, right }) {
  React.useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className={"scrim" + (right ? " right" : "")} onClick={onClose}>
      <div className={right ? "glass sheet-r" : "glass sheet"} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ---- Empty / generic helpers ----
function Dot({ c }) { return <span style={{ width: 7, height: 7, borderRadius: 9, background: c, display: "inline-block" }} />; }

Object.assign(window, { Icon, Avatar, StatusPill, PriorityPill, ConfBadge, Bar, Ring, Deadline, Modal, Dot });
