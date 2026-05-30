/* =============================================================
   WorkFlow — Manager screens
   ============================================================= */

// ---------- shared derivations ----------
function teamStats(tasks) {
  return TEAM.filter(u => u.id !== "u-priya").map(u => {
    const mine = tasks.filter(t => t.assignee === u.id);
    const active = mine.filter(t => t.status !== "done");
    const overdue = mine.filter(t => t.status === "overdue");
    const blocked = mine.filter(t => t.status === "blocked");
    const lowConf = mine.some(t => t.logs.some(l => l.conf === "low"));
    const avg = active.length ? Math.round(active.reduce((s,t)=>s+t.progress,0)/active.length) : 100;
    let state = "on-track";
    if (overdue.length || lowConf) state = "behind";
    else if (blocked.length) state = "blocked";
    else if (active.length && avg >= 80) state = "ahead";
    return { u, mine, active, overdue, blocked, avg, state };
  });
}
const STATE_META = {
  "on-track": { label: "On track", c: "#30D158" },
  "ahead":    { label: "Ahead",    c: "#0A84FF" },
  "blocked":  { label: "Blocked",  c: "#FF9F0A" },
  "behind":   { label: "Behind",   c: "#FF453A" },
};

// ============================================================
// MANAGER DASHBOARD
// ============================================================
function ManagerDashboard({ ctx }) {
  const tasks = ctx.tasks;
  const active = tasks.filter(t => t.status !== "done");
  const overdue = tasks.filter(t => t.status === "overdue");
  const blocked = tasks.filter(t => t.status === "blocked");
  const review = tasks.filter(t => t.status === "in-review");
  const lowLogs = tasks.flatMap(t => t.logs.filter(l => l.conf === "low").map(l => ({ t, l })));
  const doneWeek = tasks.filter(t => t.status === "done").length;
  const completion = Math.round(tasks.filter(t=>t.status==="done").length / tasks.length * 100);
  const stats = teamStats(tasks);

  const attention = [
    ...overdue.map(t => ({ t, kind: "overdue" })),
    ...lowLogs.map(({t,l}) => ({ t, l, kind: "low" })),
    ...blocked.map(t => ({ t, kind: "blocked" })),
  ];

  return (
    <div className="col gap16 fadeup">
      {/* header */}
      <div className="row gap16" style={{ alignItems: "flex-end" }}>
        <div className="col gap4">
          <div className="h-page">Good morning, Priya</div>
          <div className="h-sub">Friday, May 30 · {active.length} active tasks across your team of {TEAM.length-1}</div>
        </div>
        <button className="btn btn-primary mauto" onClick={ctx.openBrief} style={{ padding: "11px 18px" }}>
          <Icon name="spark" size={17} fill="current" /> Where's My Team?
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <Kpi icon="tasks" tint="#0A84FF" val={active.length} label="Active tasks" sub={`${doneWeek} completed this week`} />
        <Kpi icon="alert" tint="#FF453A" val={overdue.length} label="Overdue" sub={overdue.length ? "Needs action today" : "All clear"} danger={overdue.length>0} />
        <Kpi icon="pause" tint="#FF9F0A" val={blocked.length + review.length} label="Blocked / in review" sub={`${blocked.length} blocked · ${review.length} to review`} />
        <Kpi icon="target" tint="#30D158" val={completion + "%"} label="Completion rate" ring={completion} />
      </div>

      <div className="two-col">
        {/* team workload */}
        <div className="glass card col gap14">
          <div className="row">
            <div className="section-title">Team workload</div>
            <div className="faint mauto" style={{ fontSize: 12 }}>{stats.length} people</div>
          </div>
          <div className="col" style={{ gap: 6 }}>
            {stats.map(s => {
              const sm = STATE_META[s.state];
              return (
                <div key={s.u.id} className="trow" style={{ gridTemplateColumns: "auto 1fr auto auto" }}
                  onClick={() => ctx.openMember(s.u.id)}>
                  <Avatar user={s.u} size={40} />
                  <div className="col" style={{ gap: 3, minWidth: 0 }}>
                    <div className="row gap8">
                      <span style={{ fontWeight: 620, fontSize: 14.5 }}>{s.u.name}</span>
                      <span className="pill" style={{ background:`color-mix(in srgb, ${sm.c} 15%, transparent)`, color: sm.c, borderColor:`color-mix(in srgb, ${sm.c} 28%, transparent)`, fontSize: 11, padding: "2px 8px" }}>
                        <span className="dot" style={{ background: sm.c }}></span>{sm.label}
                      </span>
                    </div>
                    <div className="faint clip" style={{ fontSize: 12.5 }}>{s.u.role} · {s.active.length} active{s.overdue.length ? ` · ${s.overdue.length} overdue` : ""}</div>
                  </div>
                  <div className="col gap6" style={{ width: 120 }}>
                    <div className="row faint" style={{ fontSize: 11, justifyContent:"space-between" }}><span>progress</span><span className="tnum" style={{ color:"var(--text-2)" }}>{s.avg}%</span></div>
                    <Bar value={s.avg} />
                  </div>
                  <Icon name="chevR" size={16} style={{ color: "var(--text-3)" }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* needs attention */}
        <div className="col gap16">
          <div className="glass card col gap12 ai-glow">
            <div className="row gap8">
              <div className="kpi-ico" style={{ background:"color-mix(in srgb, var(--c-red) 16%, transparent)", color:"var(--c-red)", width:32, height:32, borderRadius:9 }}><Icon name="bell" size={16} /></div>
              <div className="section-title" style={{ color:"var(--text)" }}>Needs your attention</div>
              <span className="pill pill-soft mauto">{attention.length}</span>
            </div>
            <div className="col" style={{ gap: 7 }}>
              {attention.slice(0,5).map((a,i) => (
                <div key={i} className="trow" style={{ gridTemplateColumns:"auto 1fr", gap:11, padding:"10px 12px", background:"var(--tint)" }}
                  onClick={() => ctx.openTask(a.t.id)}>
                  <div className="center" style={{ width:30, height:30, borderRadius:9, flex:"none",
                    background:`color-mix(in srgb, ${a.kind==="overdue"?"#FF453A":a.kind==="blocked"?"#FF9F0A":"#FF453A"} 16%, transparent)`,
                    color: a.kind==="overdue"?"#FF453A":a.kind==="blocked"?"#FF9F0A":"#FF453A" }}>
                    <Icon name={a.kind==="blocked"?"pause":a.kind==="low"?"spark":"alert"} size={15} fill={a.kind==="low"?"current":"none"} />
                  </div>
                  <div className="col" style={{ gap:2, minWidth:0 }}>
                    <div className="clip" style={{ fontWeight:600, fontSize:13.5 }}>{a.t.title}</div>
                    <div className="faint" style={{ fontSize:12 }}>
                      {a.kind==="overdue" && <>Overdue · {byId(a.t.assignee).name.split(" ")[0]}</>}
                      {a.kind==="blocked" && <>Blocked · {byId(a.t.assignee).name.split(" ")[0]}</>}
                      {a.kind==="low" && <>Low-confidence log · {byId(a.t.assignee).name.split(" ")[0]}</>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass card col gap12">
            <div className="section-title">This week</div>
            <div className="row gap16" style={{ justifyContent:"space-around" }}>
              <MiniStat val={doneWeek} label="Completed" c="#30D158" />
              <div style={{ width:1, alignSelf:"stretch", background:"var(--sep)" }}></div>
              <MiniStat val={tasks.flatMap(t=>t.logs).length} label="Logs filed" c="#0A84FF" />
              <div style={{ width:1, alignSelf:"stretch", background:"var(--sep)" }}></div>
              <MiniStat val={lowLogs.length} label="Flagged" c="#FF453A" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, tint, val, label, sub, ring, danger }) {
  return (
    <div className="glass kpi">
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background:`color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}>
          <Icon name={icon} size={19} />
        </div>
        {ring != null ? <Ring value={ring} size={42} /> :
          <Icon name="trend" size={16} style={{ color:"var(--text-3)" }} />}
      </div>
      <div className="kpi-val" style={ danger ? { color:"var(--c-red)" } : null }>{val}</div>
      <div className="col gap4">
        <div className="kpi-label">{label}</div>
        <div className="faint" style={{ fontSize:12 }}>{sub}</div>
      </div>
    </div>
  );
}
function MiniStat({ val, label, c }) {
  return <div className="col gap4 center"><div className="kpi-val" style={{ fontSize:28, color:c }}>{val}</div><div className="faint" style={{ fontSize:12 }}>{label}</div></div>;
}

// ============================================================
// ALL TASKS (manager table)
// ============================================================
const TASK_FILTERS = [
  { k:"all", label:"All" }, { k:"overdue", label:"Overdue" }, { k:"in-progress", label:"In progress" },
  { k:"in-review", label:"In review" }, { k:"blocked", label:"Blocked" }, { k:"not-started", label:"Not started" }, { k:"done", label:"Completed" },
];
function AllTasks({ ctx }) {
  const [filter, setFilter] = React.useState("all");
  const q = ctx.query.trim().toLowerCase();
  let rows = ctx.tasks;
  if (filter !== "all") rows = rows.filter(t => t.status === filter);
  if (q) rows = rows.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || byId(t.assignee).name.toLowerCase().includes(q));
  const counts = (k) => k==="all" ? ctx.tasks.length : ctx.tasks.filter(t=>t.status===k).length;

  return (
    <div className="col gap16 fadeup">
      <div className="row gap16" style={{ alignItems:"flex-end" }}>
        <div className="col gap4">
          <div className="h-page">All tasks</div>
          <div className="h-sub">{rows.length} {rows.length===1?"task":"tasks"} shown · every change is logged to the audit trail</div>
        </div>
        <button className="btn btn-primary mauto" onClick={ctx.openNew}><Icon name="plus" size={16} sw={2.4} /> New task</button>
      </div>

      <div className="row gap8 wrap">
        {TASK_FILTERS.map(f => (
          <button key={f.k} className={"btn btn-sm " + (filter===f.k ? "btn-primary" : "btn-glass")} onClick={()=>setFilter(f.k)}>
            {f.label}<span style={{ opacity:.7, marginLeft:4 }}>{counts(f.k)}</span>
          </button>
        ))}
      </div>

      <div className="glass" style={{ padding:8 }}>
        <div className="trow" style={{ gridTemplateColumns:"2.4fr 1.3fr 1fr 1.1fr 1.2fr 0.5fr", cursor:"default", padding:"8px 16px" }}>
          {["Task","Assignee","Priority","Status","Deadline","",].map((h,i)=>(
            <div key={i} className="section-title" style={{ fontSize:11 }}>{h}</div>
          ))}
        </div>
        {rows.map(t => (
          <div key={t.id} className="trow" style={{ gridTemplateColumns:"2.4fr 1.3fr 1fr 1.1fr 1.2fr 0.5fr" }} onClick={()=>ctx.openTask(t.id)}>
            <div className="col" style={{ gap:3, minWidth:0 }}>
              <div className="row gap8">
                <span className="mono faint" style={{ fontSize:11 }}>{t.id}</span>
                {t.logs.some(l=>l.conf==="low") && <span title="Has a flagged log"><Icon name="alert" size={13} style={{ color:"var(--c-red)" }} /></span>}
              </div>
              <div className="clip" style={{ fontWeight:600, fontSize:14, textDecoration: t.status==="done"?"line-through":"none", color: t.status==="done"?"var(--text-3)":"var(--text)" }}>{t.title}</div>
              <div className="row gap8" style={{ width:140 }}><Bar value={t.progress} /><span className="faint tnum" style={{ fontSize:11 }}>{t.progress}%</span></div>
            </div>
            <div className="row gap8" style={{ minWidth:0 }}><Avatar user={t.assignee} size={28} /><span className="clip muted" style={{ fontSize:13.5 }}>{byId(t.assignee).name}</span></div>
            <div><PriorityPill priority={t.priority} /></div>
            <div><StatusPill status={t.status} /></div>
            <div><Deadline date={t.deadline} /></div>
            <div className="row" style={{ justifyContent:"flex-end" }}><Icon name="chevR" size={16} style={{ color:"var(--text-3)" }} /></div>
          </div>
        ))}
        {rows.length===0 && <div className="center faint" style={{ padding:40, fontSize:14 }}>No tasks match this filter.</div>}
      </div>
    </div>
  );
}

// ============================================================
// LOG REVIEW (AI Work-Log Verification)
// ============================================================
function LogReview({ ctx }) {
  const [filter, setFilter] = React.useState("all");
  const allLogs = ctx.tasks.flatMap(t => t.logs.map(l => ({ t, l }))).sort((a,b)=>b.l.date - a.l.date);
  let rows = allLogs;
  if (filter !== "all") rows = rows.filter(r => r.l.conf === filter);
  const cnt = (k) => k==="all" ? allLogs.length : allLogs.filter(r=>r.l.conf===k).length;

  return (
    <div className="col gap16 fadeup">
      <div className="col gap4">
        <div className="row gap10">
          <div className="h-page">Log review</div>
          <span className="ai-chip" style={{ alignSelf:"center" }}><Icon name="spark" size={13} fill="current" /> AI-verified</span>
        </div>
        <div className="h-sub">Every daily log is checked against its task. The AI flags vague entries, mismatches, and unsupported “done” claims — you confirm.</div>
      </div>

      <div className="row gap8 wrap">
        {[{k:"all",label:"All logs"},{k:"low",label:"Needs review"},{k:"medium",label:"Partial"},{k:"high",label:"Verified"}].map(f=>(
          <button key={f.k} className={"btn btn-sm "+(filter===f.k?"btn-primary":"btn-glass")} onClick={()=>setFilter(f.k)}>
            {f.k!=="all" && <ConfBadge conf={f.k} withLabel={false} />}{f.label}<span style={{opacity:.7,marginLeft:4}}>{cnt(f.k)}</span>
          </button>
        ))}
      </div>

      <div className="col gap12">
        {rows.map(({t,l}) => <LogCard key={l.id} t={t} l={l} ctx={ctx} />)}
      </div>
    </div>
  );
}

function LogCard({ t, l, ctx }) {
  const [open, setOpen] = React.useState(l.conf === "low");
  const c = CONF[l.conf];
  const reviewed = ctx.reviewed[l.id];
  return (
    <div className="glass card col gap12" style={{ borderColor: l.conf==="low" ? "color-mix(in srgb, var(--c-red) 32%, var(--glass-border))" : "var(--glass-border)" }}>
      <div className="row gap12">
        <Avatar user={t.assignee} size={38} />
        <div className="col" style={{ gap:2, minWidth:0, flex:1 }}>
          <div className="row gap8 wrap">
            <span style={{ fontWeight:640, fontSize:14.5 }}>{byId(t.assignee).name}</span>
            <span className="faint" style={{ fontSize:13 }}>logged on</span>
            <span className="clip" style={{ fontWeight:600, fontSize:14, maxWidth:280 }}>{t.title}</span>
          </div>
          <div className="faint row gap8" style={{ fontSize:12 }}><span className="mono">{t.id}</span> · {fmtDateTime(l.date)}</div>
        </div>
        <ConfBadge conf={l.conf} />
      </div>

      <div style={{ background:"var(--tint)", borderRadius:"var(--radius-sm)", padding:"12px 14px", fontSize:14, lineHeight:1.5, color:"var(--text)" }}>
        “{l.text}”
      </div>

      {open && (
        <div className="col gap10 fadeup" style={{ borderRadius:"var(--radius-sm)", padding:"13px 14px",
          background:`color-mix(in srgb, ${c.c} 8%, var(--tint))`, border:`1px solid color-mix(in srgb, ${c.c} 22%, transparent)` }}>
          <div className="row gap8">
            <Icon name="spark" size={15} fill="current" style={{ color:c.c }} />
            <span style={{ fontWeight:650, fontSize:13, color:c.c }}>AI assessment</span>
          </div>
          <div className="muted" style={{ fontSize:13.5, lineHeight:1.5 }}>{c.note}</div>
          {l.flags.length>0 && (
            <div className="col gap6" style={{ marginTop:2 }}>
              {l.flags.map((f,i)=>(
                <div key={i} className="row gap8" style={{ fontSize:13, color:"var(--text-2)", alignItems:"flex-start" }}>
                  <Icon name="flag" size={14} style={{ color:c.c, marginTop:2 }} /><span>{f}</span>
                </div>
              ))}
            </div>
          )}
          <div className="faint" style={{ fontSize:11.5, marginTop:2 }}>AI output is advisory — you make the final call.</div>
        </div>
      )}

      <div className="row gap8">
        <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(o=>!o)}>
          <Icon name={open?"chevD":"chevR"} size={14} />{open?"Hide":"Show"} AI assessment
        </button>
        <div className="mauto row gap8">
          <button className="btn btn-glass btn-sm" onClick={()=>ctx.openTask(t.id)}><Icon name="doc" size={14} /> Open task</button>
          {reviewed ? (
            <span className="pill" style={{ background:"color-mix(in srgb, var(--c-green) 14%, transparent)", color:"var(--c-green)", borderColor:"color-mix(in srgb, var(--c-green) 28%, transparent)" }}>
              <Icon name="check" size={13} sw={2.4} /> {reviewed}
            </span>
          ) : (
            <>
              {l.conf!=="high" && <button className="btn btn-glass btn-sm" onClick={()=>ctx.reviewLog(l.id,"Detail requested")}>Request detail</button>}
              <button className="btn btn-primary btn-sm" onClick={()=>ctx.reviewLog(l.id,"Approved")}><Icon name="check" size={14} sw={2.4} /> Approve</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEAM
// ============================================================
function TeamScreen({ ctx }) {
  const stats = teamStats(ctx.tasks);
  return (
    <div className="col gap16 fadeup">
      <div className="col gap4">
        <div className="h-page">Team</div>
        <div className="h-sub">Real-time view of who's carrying what — no spreadsheets, no chasing.</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))", gap:16 }}>
        {stats.map(s => {
          const sm = STATE_META[s.state];
          return (
            <div key={s.u.id} className="glass card col gap14">
              <div className="row gap12">
                <Avatar user={s.u} size={48} ring />
                <div className="col" style={{ gap:3, minWidth:0, flex:1 }}>
                  <span style={{ fontWeight:660, fontSize:16 }}>{s.u.name}</span>
                  <span className="faint clip" style={{ fontSize:13 }}>{s.u.role}</span>
                </div>
                <span className="pill" style={{ background:`color-mix(in srgb, ${sm.c} 15%, transparent)`, color:sm.c, borderColor:`color-mix(in srgb, ${sm.c} 28%, transparent)` }}>
                  <span className="dot" style={{ background:sm.c }}></span>{sm.label}
                </span>
              </div>
              <div className="row gap16" style={{ justifyContent:"space-between" }}>
                <MiniStat val={s.active.length} label="Active" c="#0A84FF" />
                <MiniStat val={s.overdue.length} label="Overdue" c={s.overdue.length?"#FF453A":"var(--text-3)"} />
                <MiniStat val={s.avg + "%"} label="Avg progress" c="#30D158" />
              </div>
              <div className="col" style={{ gap:4 }}>
                {s.mine.slice(0,4).map(t=>(
                  <div key={t.id} className="trow" style={{ gridTemplateColumns:"1fr auto", padding:"8px 10px" }} onClick={()=>ctx.openTask(t.id)}>
                    <span className="clip" style={{ fontSize:13.5, fontWeight:550, textDecoration:t.status==="done"?"line-through":"none", color:t.status==="done"?"var(--text-3)":"var(--text)" }}>{t.title}</span>
                    <StatusPill status={t.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ManagerDashboard, AllTasks, LogReview, TeamScreen, teamStats, STATE_META, Kpi, MiniStat });
