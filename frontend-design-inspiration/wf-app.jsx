/* =============================================================
   WorkFlow — App shell, routing, state, Tweaks
   ============================================================= */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "glassBlur": 34,
  "radius": 22,
  "density": "regular",
  "accent": ["#0A84FF", "#5E5CE6"],
  "reduceMotion": false
}/*EDITMODE-END*/;

const DENSITY_MAP = { compact: 0.86, regular: 1, comfy: 1.16 };

const NAV = {
  manager: [
    { k: "dashboard", icon: "dashboard", label: "Dashboard" },
    { k: "tasks", icon: "tasks", label: "All tasks" },
    { k: "review", icon: "verify", label: "Log review" },
    { k: "team", icon: "team", label: "Team" },
  ],
  employee: [
    { k: "mytasks", icon: "tasks", label: "My tasks" },
    { k: "activity", icon: "audit", label: "Activity" },
  ],
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [theme, setTheme] = React.useState("dark");
  const [role, setRole] = React.useState("manager");
  const [screen, setScreen] = React.useState("dashboard");
  const [query, setQuery] = React.useState("");
  const [tasks, setTasks] = React.useState(() => TASKS.map(x => ({ ...x })));
  const [reviewed, setReviewed] = React.useState({});
  const [modal, setModal] = React.useState(null);
  const [briefKey, setBriefKey] = React.useState(0);
  const [collapsed, setCollapsed] = React.useState(false);

  // theme
  React.useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  // tweaks -> CSS vars
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--glass-blur", t.glassBlur + "px");
    r.setProperty("--radius", t.radius + "px");
    r.setProperty("--radius-sm", Math.max(8, t.radius - 8) + "px");
    r.setProperty("--radius-lg", (t.radius + 8) + "px");
    r.setProperty("--density", DENSITY_MAP[t.density] ?? 1);
    if (Array.isArray(t.accent)) { r.setProperty("--accent", t.accent[0]); r.setProperty("--accent-2", t.accent[1]); }
    document.documentElement.dataset.reduceMotion = t.reduceMotion ? "1" : "0";
  }, [t]);

  const switchRole = (r) => { setRole(r); setScreen(r === "manager" ? "dashboard" : "mytasks"); setModal(null); };

  // ---- actions ----
  const addAudit = (task, kind, text) => ({
    ...task, audit: [...task.audit, { at: new Date(), who: role === "manager" ? "u-priya" : ME.id, kind, text }],
  });
  const setStatus = (id, status) => setTasks(ts => ts.map(x => {
    if (x.id !== id) return x;
    let nx = { ...x, status, progress: status === "done" ? 100 : x.progress };
    nx = addAudit(nx, status === "done" ? "status" : status === "blocked" ? "status" : "status", `Moved to ${STATUS[status].label}`);
    return nx;
  }));
  const submitLog = (taskId, text, res) => setTasks(ts => ts.map(x => {
    if (x.id !== taskId) return x;
    const log = { id: "L" + Date.now(), date: new Date(), text, conf: res.conf, flags: res.flags };
    let nx = { ...x, logs: [...x.logs, log], progress: Math.min(100, x.progress + 8), status: x.status === "not-started" ? "in-progress" : x.status === "overdue" ? "in-progress" : x.status };
    nx = addAudit(nx, "log", "Submitted a daily work log");
    return nx;
  }));
  const reviewLog = (logId, label) => setReviewed(r => ({ ...r, [logId]: label }));
  const addTask = (task) => setTasks(ts => [{ ...task, audit: [{ at: new Date(), who: "u-priya", kind: "create", text: `Created task and assigned to ${byId(task.assignee).name.split(" ")[0]}` }] }, ...ts]);

  const lowCount = tasks.flatMap(x => x.logs).filter(l => l.conf === "low" && !reviewed[l.id]).length;

  const ctx = {
    tasks, role, query, reviewed,
    openTask: (id) => setModal({ type: "task", id }),
    openLog: (id) => setModal({ type: "log", id }),
    openBrief: () => { setBriefKey(k => k + 1); setModal({ type: "brief" }); },
    openMember: (id) => setModal({ type: "member", id }),
    openNew: () => setModal({ type: "new" }),
    regenBrief: () => setBriefKey(k => k + 1),
    setStatus, submitLog, reviewLog, addTask,
  };

  const nav = NAV[role];
  const me = role === "manager" ? MANAGER : ME;

  function renderScreen() {
    switch (screen) {
      case "dashboard": return <ManagerDashboard ctx={ctx} />;
      case "tasks": return <AllTasks ctx={ctx} />;
      case "review": return <LogReview ctx={ctx} />;
      case "team": return <TeamScreen ctx={ctx} />;
      case "mytasks": return <MyTasks ctx={ctx} />;
      case "activity": return <Activity ctx={ctx} />;
      default: return <ManagerDashboard ctx={ctx} />;
    }
  }

  return (
    <>
      <div className="app-bg"><div className="orb o1"></div><div className="orb o2"></div><div className="orb o3"></div><div className="orb o4"></div></div>

      <div className={"shell" + (collapsed ? " collapsed" : "")}>
        {/* SIDEBAR */}
        <aside className="glass sidebar">
          <div className="brand">
            <div className="brand-mark"><Icon name="target" size={20} fill="none" style={{ color: "#fff" }} /></div>
            <div className="col brand-text">
              <span className="brand-name">WorkFlow</span>
              <span className="brand-sub">Accountability OS</span>
            </div>
          </div>

          <div className="nav-label">{role === "manager" ? "Manage" : "Work"}</div>
          {nav.map(n => (
            <div key={n.k} className={"nav-item" + (screen === n.k ? " active" : "")} onClick={() => setScreen(n.k)} title={n.label}>
              <span className="nav-ico"><Icon name={n.icon} size={19} /></span>
              <span className="nav-text">{n.label}</span>
              {n.k === "review" && lowCount > 0 && <span className="nav-badge nav-text">{lowCount}</span>}
            </div>
          ))}

          {role === "manager" && (
            <>
              <div className="nav-label">Insights</div>
              <div className="nav-item" onClick={ctx.openBrief}>
                <span className="nav-ico"><Icon name="spark" size={19} fill="current" /></span>
                <span className="nav-text">Where's My Team?</span>
              </div>
            </>
          )}

          <div className="sidebar-foot">
            <div className="nav-item" onClick={() => switchRole(role === "manager" ? "employee" : "manager")} title="Switch role">
              <span className="nav-ico"><Icon name="refresh" size={18} /></span>
              <span className="nav-text">View as {role === "manager" ? "employee" : "manager"}</span>
            </div>
            <div className="row gap10" style={{ padding: "10px 10px 2px" }}>
              <Avatar user={me} size={36} ring />
              <div className="col brand-text" style={{ minWidth: 0 }}>
                <span className="clip" style={{ fontWeight: 620, fontSize: 13.5 }}>{me.name}</span>
                <span className="clip faint" style={{ fontSize: 11.5 }}>{me.role}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-col">
          {/* TOPBAR */}
          <header className="glass topbar">
            <button className="iconbtn" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar"><Icon name="filter" size={18} /></button>
            <div className="search">
              <Icon name="search" size={16} />
              <input placeholder={role === "manager" ? "Search tasks, people…" : "Search your tasks…"} value={query} onChange={e => setQuery(e.target.value)}
                onFocus={() => role === "manager" && screen !== "tasks" && setScreen("tasks")} />
              <kbd>⌘K</kbd>
            </div>
            <div className="spacer"></div>

            <div className="segmented" title="Role">
              <button className={role === "manager" ? "on" : ""} onClick={() => switchRole("manager")}><Icon name="team" size={15} /> Manager</button>
              <button className={role === "employee" ? "on" : ""} onClick={() => switchRole("employee")}><Icon name="user" size={15} /> Employee</button>
            </div>

            {role === "manager" && <button className="btn btn-primary" onClick={ctx.openBrief}><Icon name="spark" size={16} fill="current" /> <span className="nav-text">Where's My Team?</span></button>}

            <button className="iconbtn" onClick={() => setTheme(th => th === "dark" ? "light" : "dark")} title="Toggle theme">
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <button className="iconbtn" style={{ position: "relative" }} title="Notifications">
              <Icon name="bell" size={18} />
              {lowCount > 0 && <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: 9, background: "var(--c-red)", border: "1.5px solid var(--bg-0)" }}></span>}
            </button>
          </header>

          {/* CONTENT */}
          <div className="content-scroll">
            <div style={{ paddingBottom: 24 }}>{renderScreen()}</div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modal?.type === "task" && <TaskDetail taskId={modal.id} ctx={ctx} onClose={() => setModal(null)} />}
      {modal?.type === "log" && <LogWorkModal taskId={modal.id} ctx={ctx} onClose={() => setModal(null)} />}
      {modal?.type === "brief" && <BriefSheet key={briefKey} ctx={ctx} onClose={() => setModal(null)} />}
      {modal?.type === "member" && <MemberSheet userId={modal.id} ctx={ctx} onClose={() => setModal(null)} />}
      {modal?.type === "new" && <NewTaskModal ctx={ctx} onClose={() => setModal(null)} />}

      {/* TWEAKS */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Glass" />
        <TweakSlider label="Blur intensity" value={t.glassBlur} min={0} max={60} step={2} unit="px" onChange={v => setTweak("glassBlur", v)} />
        <TweakSlider label="Corner radius" value={t.radius} min={6} max={34} step={2} unit="px" onChange={v => setTweak("radius", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={v => setTweak("density", v)} />
        <TweakSection label="Accent" />
        <TweakColor label="Accent" value={t.accent} options={[["#0A84FF", "#5E5CE6"], ["#5E5CE6", "#BF5AF2"], ["#30D158", "#40C8E0"], ["#FF9F0A", "#FF375F"], ["#FF375F", "#BF5AF2"]]} onChange={v => setTweak("accent", v)} />
        <TweakSection label="Motion" />
        <TweakToggle label="Reduce motion" value={t.reduceMotion} onChange={v => setTweak("reduceMotion", v)} />
      </TweaksPanel>
    </>
  );
}

// ============================================================
// NEW TASK modal (with AI smart-assist)
// ============================================================
function NewTaskModal({ ctx, onClose }) {
  const [title, setTitle] = React.useState("");
  const [assignee, setAssignee] = React.useState("u-marcus");
  const [priority, setPriority] = React.useState("medium");
  const [days, setDays] = React.useState(3);
  const [suggesting, setSuggesting] = React.useState(false);
  const [suggested, setSuggested] = React.useState(false);

  const suggest = () => {
    setSuggesting(true);
    setTimeout(() => {
      const tx = title.toLowerCase();
      let p = "medium", d = 3;
      if (/(urgent|overdue|close|month-end|client|renew|payment|invoice|deadline)/.test(tx)) { p = "high"; d = 2; }
      else if (/(restock|tidy|clean|file|archive|update)/.test(tx)) { p = "low"; d = 5; }
      setPriority(p); setDays(d); setSuggesting(false); setSuggested(true);
    }, 900);
  };
  const create = () => {
    const id = "T-" + Math.floor(300 + Math.random() * 99);
    ctx.addTask({ id, title: title.trim(), assignee, priority, status: "not-started", deadline: dayOffset(days), progress: 0, project: byId(assignee).role.split(" ")[0], created: new Date(), desc: title.trim() + ".", logs: [] });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="row gap12" style={{ padding: "18px 20px", borderBottom: "1px solid var(--sep)" }}>
        <div className="kpi-ico" style={{ background: "linear-gradient(150deg, var(--accent), var(--accent-2))", color: "#fff", width: 38, height: 38 }}><Icon name="plus" size={19} sw={2.4} /></div>
        <div className="col" style={{ gap: 2, flex: 1 }}><div style={{ fontWeight: 700, fontSize: 18 }}>New task</div><div className="faint" style={{ fontSize: 13 }}>Assign it, set a deadline — the audit trail starts now.</div></div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={18} /></button>
      </div>
      <div className="content-scroll col gap14" style={{ padding: 20, gap: 14 }}>
        <div className="col gap6"><div className="section-title">Task</div>
          <input className="input" placeholder="e.g. Reconcile June vendor invoices" value={title} onChange={e => { setTitle(e.target.value); setSuggested(false); }} autoFocus />
        </div>
        <button className="btn btn-glass" style={{ alignSelf: "flex-start" }} disabled={title.trim().length < 4 || suggesting} onClick={suggest}>
          {suggesting ? <><Icon name="refresh" size={15} style={{ animation: "spin 1s linear infinite" }} /> Thinking…</> : <><Icon name="spark" size={15} fill="current" /> Suggest priority & deadline</>}
        </button>
        {suggested && <div className="ai-chip" style={{ alignSelf: "flex-start" }}><Icon name="spark" size={13} fill="current" /> AI set this to {PRIORITY[priority].label} priority, due in {days} days — edit if needed.</div>}

        <div className="col gap6"><div className="section-title">Assignee</div>
          <div className="row gap8 wrap">
            {TEAM.filter(u => u.id !== "u-priya").map(u => (
              <button key={u.id} className={"btn btn-sm " + (assignee === u.id ? "btn-primary" : "btn-glass")} onClick={() => setAssignee(u.id)} style={{ paddingLeft: 6 }}>
                <Avatar user={u} size={20} /> {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="row gap16 wrap">
          <div className="col gap6"><div className="section-title">Priority</div>
            <div className="segmented">{Object.keys(PRIORITY).map(p => <button key={p} className={priority === p ? "on" : ""} onClick={() => setPriority(p)}>{PRIORITY[p].label}</button>)}</div>
          </div>
          <div className="col gap6"><div className="section-title">Deadline</div>
            <div className="segmented">{[1, 2, 3, 5, 7].map(d => <button key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>{d}d</button>)}</div>
          </div>
        </div>
      </div>
      <div className="row gap10" style={{ padding: "14px 20px", borderTop: "1px solid var(--sep)" }}>
        <button className="btn btn-ghost mauto" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={title.trim().length < 4} onClick={create}><Icon name="check" size={15} sw={2.4} /> Create task</button>
      </div>
    </Modal>
  );
}

window.NewTaskModal = NewTaskModal;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
