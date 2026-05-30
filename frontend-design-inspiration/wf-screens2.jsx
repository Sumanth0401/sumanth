/* =============================================================
   WorkFlow — Task detail, AI brief, employee screens, modals
   ============================================================= */

// ---- local AI heuristic for live log verification ----
function assessLog(text, task) {
  const t = text.trim();
  const words = t.split(/\s+/).filter(Boolean).length;
  const hasNum = /\d/.test(t);
  const vague = /(worked on it|did some stuff|looking good|some stuff|made progress|on it|working on|stuff|things|almost done|nearly there)\b/i.test(t);
  const flags = [];
  let conf = "high";
  if (words < 6 || t.length < 30) { conf = "low"; flags.push("Too short — does not describe what was actually done."); }
  if (vague) { conf = "low"; flags.push("Uses vague language without concrete, verifiable detail."); }
  if (!hasNum && words < 18) { if (conf!=="low") conf = "medium"; flags.push("No specifics (quantities, IDs, names) that let this be verified."); }
  if (/done|completed|finished/i.test(t) && words < 12 && !hasNum) { conf="low"; flags.push("Claims completion with no supporting evidence."); }
  if (conf==="high" && words < 22) conf = "medium";
  return { conf, flags, note: CONF[conf].note };
}

// ============================================================
// TASK DETAIL  (right sheet) — with audit trail
// ============================================================
const AUDIT_ICON = { create:"plus", priority:"flag", status:"refresh", log:"doc", alert:"alert" };
const STATUS_FLOW = ["not-started","in-progress","in-review","blocked","done"];

function TaskDetail({ taskId, ctx, onClose }) {
  const t = ctx.tasks.find(x => x.id === taskId);
  if (!t) return null;
  const isMine = t.assignee === ME.id;
  const canEdit = ctx.role === "manager" || isMine;

  return (
    <Modal right onClose={onClose}>
      {/* header */}
      <div className="row gap12" style={{ padding:"18px 20px", borderBottom:"1px solid var(--sep)" }}>
        <div className="col gap4" style={{ flex:1, minWidth:0 }}>
          <div className="row gap8"><span className="mono faint" style={{ fontSize:12 }}>{t.id}</span><StatusPill status={t.status} /></div>
          <div style={{ fontWeight:720, fontSize:21, letterSpacing:"-0.02em", lineHeight:1.15 }}>{t.title}</div>
        </div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={18} /></button>
      </div>

      <div className="content-scroll col gap18" style={{ padding:20, gap:18 }}>
        {/* meta */}
        <div className="row gap12 wrap">
          <Meta label="Assignee"><div className="row gap8"><Avatar user={t.assignee} size={24} /><span style={{ fontWeight:600, fontSize:13.5 }}>{byId(t.assignee).name}</span></div></Meta>
          <Meta label="Priority"><PriorityPill priority={t.priority} /></Meta>
          <Meta label="Deadline"><Deadline date={t.deadline} /></Meta>
          <Meta label="Progress"><div className="row gap8"><Ring value={t.progress} size={28} sw={3.5} /></div></Meta>
        </div>

        <div className="col gap8">
          <div className="section-title">Description</div>
          <div className="muted" style={{ fontSize:14, lineHeight:1.55 }}>{t.desc}</div>
        </div>

        {/* status changer */}
        {canEdit && (
          <div className="col gap8">
            <div className="section-title">Update status</div>
            <div className="row gap6 wrap">
              {STATUS_FLOW.map(s => (
                <button key={s} className={"btn btn-sm "+(t.status===s?"btn-primary":"btn-glass")}
                  onClick={()=>ctx.setStatus(t.id, s)}>{STATUS[s].label}</button>
              ))}
            </div>
          </div>
        )}

        {/* logs */}
        <div className="col gap10">
          <div className="row"><div className="section-title">Work logs</div>
            {isMine && <button className="btn btn-glass btn-sm mauto" onClick={()=>ctx.openLog(t.id)}><Icon name="plus" size={14} sw={2.4} /> Add log</button>}
          </div>
          {t.logs.length===0 && <div className="faint" style={{ fontSize:13 }}>No logs yet.</div>}
          {[...t.logs].reverse().map(l => (
            <div key={l.id} className="col gap8" style={{ background:"var(--tint)", borderRadius:"var(--radius-sm)", padding:"12px 14px" }}>
              <div className="row gap8"><span className="faint" style={{ fontSize:12 }}>{fmtDateTime(l.date)}</span><div className="mauto"><ConfBadge conf={l.conf} /></div></div>
              <div style={{ fontSize:13.5, lineHeight:1.5 }}>“{l.text}”</div>
              {l.flags.length>0 && (
                <div className="col gap4" style={{ marginTop:2 }}>
                  {l.flags.map((f,i)=><div key={i} className="row gap6 faint" style={{ fontSize:12, alignItems:"flex-start" }}><Icon name="flag" size={12} style={{ color:CONF[l.conf].c, marginTop:2 }} /><span>{f}</span></div>)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* audit trail */}
        <div className="col gap10">
          <div className="row gap8"><div className="section-title">Audit trail</div><span className="pill pill-soft" style={{ fontSize:11 }}>tamper-resistant</span></div>
          <div className="col" style={{ position:"relative", paddingLeft:6 }}>
            {t.audit.map((a,i) => {
              const who = a.who==="system" ? { name:"WorkFlow", initials:"AI", color:["#0A84FF","#5E5CE6"] } : byId(a.who);
              const last = i===t.audit.length-1;
              return (
                <div key={i} className="row gap12" style={{ alignItems:"flex-start" }}>
                  <div className="col center" style={{ flex:"none" }}>
                    <div className="center" style={{ width:28, height:28, borderRadius:8, flex:"none",
                      background: a.kind==="alert"?"color-mix(in srgb, var(--c-red) 16%, transparent)":"var(--field)",
                      border:"1px solid var(--glass-border)", color: a.kind==="alert"?"var(--c-red)":"var(--text-2)" }}>
                      <Icon name={AUDIT_ICON[a.kind]||"doc"} size={13} sw={2} />
                    </div>
                    {!last && <div style={{ width:1.5, flex:1, minHeight:18, background:"var(--sep)", margin:"2px 0" }}></div>}
                  </div>
                  <div className="col" style={{ gap:2, paddingBottom:14, minWidth:0 }}>
                    <div style={{ fontSize:13.5 }}><span style={{ fontWeight:620 }}>{who.name}</span> <span className="muted">{a.text.toLowerCase().startsWith(who.name.toLowerCase())?a.text:lower1(a.text)}</span></div>
                    <div className="faint mono" style={{ fontSize:11 }}>{fmtDateTime(a.at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
function lower1(s){ return s; }
function Meta({ label, children }) {
  return <div className="col gap6" style={{ minWidth:120 }}><div className="faint" style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em", fontWeight:650 }}>{label}</div>{children}</div>;
}

// ============================================================
// "WHERE'S MY TEAM?"  AI brief (streamed)
// ============================================================
const TONE = { red:"#FF453A", orange:"#FF9F0A", green:"#30D158", blue:"#0A84FF" };
function BriefSheet({ ctx, onClose }) {
  const [phase, setPhase] = React.useState("gen"); // gen -> tldr -> done
  const [tldr, setTldr] = React.useState("");
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase("tldr"), 1300);
    return () => clearTimeout(t1);
  }, []);
  React.useEffect(() => {
    if (phase!=="tldr") return;
    let i = 0; const full = TEAM_BRIEF_TLDR;
    const iv = setInterval(() => { i += 2; setTldr(full.slice(0,i)); if (i>=full.length){ clearInterval(iv); setPhase("done"); } }, 18);
    return () => clearInterval(iv);
  }, [phase]);
  React.useEffect(() => {
    if (phase!=="done") return;
    let n = 0; const iv = setInterval(() => { n++; setShown(n); if (n>=TEAM_BRIEF.length) clearInterval(iv); }, 260);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <Modal right onClose={onClose}>
      <div className="row gap12 ai-glow" style={{ padding:"18px 20px", borderBottom:"1px solid var(--sep)" }}>
        <div className="kpi-ico" style={{ background:"linear-gradient(150deg, var(--accent), var(--accent-2))", color:"#fff", width:38, height:38 }}><Icon name="spark" size={19} fill="current" /></div>
        <div className="col" style={{ gap:2, flex:1 }}>
          <div style={{ fontWeight:720, fontSize:19, letterSpacing:"-0.02em" }}>Where's My Team?</div>
          <div className="faint" style={{ fontSize:12.5 }}>AI briefing · generated from {ctx.tasks.length} tasks · just now</div>
        </div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={18} /></button>
      </div>

      <div className="content-scroll col gap16" style={{ padding:20, gap:16 }}>
        {phase==="gen" ? (
          <div className="col gap12">
            <div className="row gap10 muted" style={{ fontSize:14 }}>
              <span className="center" style={{ width:24, height:24 }}><Icon name="refresh" size={16} style={{ animation:"spin 1s linear infinite" }} /></span>
              Reading every task, log and deadline…
            </div>
            {[80,95,70].map((w,i)=><div key={i} className="shimmer" style={{ height:14, width:w+"%", borderRadius:7, background:"var(--tint)" }} />)}
            <div className="shimmer" style={{ height:60, borderRadius:12, background:"var(--tint)" }} />
          </div>
        ) : (
          <>
            <div className="ai-glow glass" style={{ padding:"14px 16px", borderRadius:"var(--radius-sm)" }}>
              <div className="row gap8" style={{ marginBottom:6 }}><Icon name="spark" size={14} fill="current" style={{ color:"var(--accent)" }} /><span className="section-title" style={{ color:"var(--text)" }}>TL;DR</span></div>
              <div style={{ fontSize:15, lineHeight:1.55, fontWeight:520 }} className={phase==="tldr"?"caret":""}>{tldr}</div>
            </div>

            {TEAM_BRIEF.slice(0,shown).map((sec,si) => (
              <div key={si} className="col gap10 fadeup">
                <div className="row gap8">
                  <span className="center" style={{ width:24, height:24, borderRadius:7, background:`color-mix(in srgb, ${TONE[sec.tone]} 16%, transparent)`, color:TONE[sec.tone] }}>
                    <Icon name={sec.icon} size={14} fill={sec.icon==="spark"||sec.icon==="check"?"none":"none"} />
                  </span>
                  <span style={{ fontWeight:680, fontSize:14.5 }}>{sec.h}</span>
                </div>
                {sec.items.map((it,ii)=>(
                  <div key={ii} className="row gap10" style={{ alignItems:"flex-start", paddingLeft:4 }}>
                    <span style={{ width:6, height:6, borderRadius:9, background:TONE[sec.tone], marginTop:8, flex:"none" }}></span>
                    <div style={{ fontSize:13.5, lineHeight:1.55 }}><span style={{ fontWeight:660 }}>{it.b}</span> <span className="muted">{it.t}</span></div>
                  </div>
                ))}
              </div>
            ))}

            {phase==="done" && shown>=TEAM_BRIEF.length && (
              <div className="row gap8 fadeup" style={{ paddingTop:4 }}>
                <button className="btn btn-glass btn-sm" onClick={ctx.regenBrief}><Icon name="refresh" size={14} /> Regenerate</button>
                <span className="faint mauto" style={{ fontSize:11.5, alignSelf:"center" }}>Advisory summary — verify before acting.</span>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// EMPLOYEE — MY TASKS
// ============================================================
function MyTasks({ ctx }) {
  const mine = ctx.tasks.filter(t => t.assignee === ME.id);
  const active = mine.filter(t=>t.status!=="done");
  const todo = active.filter(t=>relDeadline(t.deadline).warn || relDeadline(t.deadline).danger);
  const [tab, setTab] = React.useState("active");
  const rows = tab==="active" ? active : tab==="done" ? mine.filter(t=>t.status==="done") : mine;

  return (
    <div className="col gap16 fadeup">
      <div className="col gap4">
        <div className="h-page">Your tasks, Marcus</div>
        <div className="h-sub">Everything assigned to you, with no ambiguity on what's due. Log your work to keep it verified.</div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(3, 1fr)" }}>
        <Kpi icon="inbox" tint="#0A84FF" val={active.length} label="Active tasks" sub={`${todo.length} due soon`} />
        <Kpi icon="alert" tint="#FF453A" val={mine.filter(t=>t.status==="overdue").length} label="Overdue" sub={mine.some(t=>t.status==="overdue")?"Log an update":"None — nice"} danger={mine.some(t=>t.status==="overdue")} />
        <Kpi icon="check" tint="#30D158" val={mine.filter(t=>t.status==="done").length} label="Completed" sub="this period" />
      </div>

      <div className="segmented" style={{ alignSelf:"flex-start" }}>
        {[["active","Active"],["done","Completed"],["all","All"]].map(([k,l])=>(
          <button key={k} className={tab===k?"on":""} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="col gap12">
        {rows.map(t => {
          const lastLog = t.logs[t.logs.length-1];
          return (
            <div key={t.id} className="glass card col gap12">
              <div className="row gap12">
                <div className="col" style={{ gap:6, flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>ctx.openTask(t.id)}>
                  <div className="row gap8"><span className="mono faint" style={{ fontSize:11 }}>{t.id}</span><PriorityPill priority={t.priority} /><StatusPill status={t.status} /></div>
                  <div style={{ fontWeight:660, fontSize:16.5, letterSpacing:"-0.01em", textDecoration:t.status==="done"?"line-through":"none", color:t.status==="done"?"var(--text-3)":"var(--text)" }}>{t.title}</div>
                  <div className="muted" style={{ fontSize:13.5, lineHeight:1.5 }}>{t.desc}</div>
                </div>
                <Ring value={t.progress} size={52} />
              </div>
              <div style={{ height:1, background:"var(--sep)" }}></div>
              <div className="row gap12 wrap">
                <Deadline date={t.deadline} />
                {lastLog ? (
                  <div className="row gap8"><span className="faint" style={{ fontSize:12.5 }}>Last log {fmtDate(lastLog.date)}</span><ConfBadge conf={lastLog.conf} withLabel={false} /></div>
                ) : <span className="faint" style={{ fontSize:12.5 }}>No log yet</span>}
                <div className="mauto row gap8">
                  <button className="btn btn-glass btn-sm" onClick={()=>ctx.openTask(t.id)}>Details</button>
                  {t.status!=="done" && <button className="btn btn-primary btn-sm" onClick={()=>ctx.openLog(t.id)}><Icon name="edit" size={14} /> Log work</button>}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length===0 && <div className="glass center faint" style={{ padding:50, fontSize:14 }}>Nothing here.</div>}
      </div>
    </div>
  );
}

// ============================================================
// EMPLOYEE — ACTIVITY (own log history)
// ============================================================
function Activity({ ctx }) {
  const mine = ctx.tasks.filter(t=>t.assignee===ME.id);
  const logs = mine.flatMap(t=>t.logs.map(l=>({t,l}))).sort((a,b)=>b.l.date-a.l.date);
  return (
    <div className="col gap16 fadeup">
      <div className="col gap4">
        <div className="h-page">Your activity</div>
        <div className="h-sub">Your work logs and how the AI verified them — your personal accountability record.</div>
      </div>
      <div className="glass card col gap6">
        {logs.map(({t,l})=>(
          <div key={l.id} className="trow" style={{ gridTemplateColumns:"auto 1fr auto", padding:"13px 12px" }} onClick={()=>ctx.openTask(t.id)}>
            <div className="center" style={{ width:34, height:34, borderRadius:9, background:"var(--tint)", color:"var(--text-2)" }}><Icon name="doc" size={16} /></div>
            <div className="col" style={{ gap:3, minWidth:0 }}>
              <div className="clip" style={{ fontSize:13.5 }}>“{l.text}”</div>
              <div className="faint row gap8" style={{ fontSize:12 }}><span className="clip" style={{ maxWidth:220 }}>{t.title}</span> · {fmtDate(l.date)}</div>
            </div>
            <ConfBadge conf={l.conf} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// LOG WORK modal (employee submits → live AI verification)
// ============================================================
function LogWorkModal({ taskId, ctx, onClose }) {
  const t = ctx.tasks.find(x=>x.id===taskId);
  const [text, setText] = React.useState("");
  const [stage, setStage] = React.useState("write"); // write | checking | result
  const [res, setRes] = React.useState(null);

  const check = () => {
    setStage("checking");
    setTimeout(() => { setRes(assessLog(text, t)); setStage("result"); }, 1100);
  };
  const submit = () => { ctx.submitLog(taskId, text, res); onClose(); };

  if (!t) return null;
  return (
    <Modal onClose={onClose}>
      <div className="row gap12" style={{ padding:"18px 20px", borderBottom:"1px solid var(--sep)" }}>
        <div className="kpi-ico" style={{ background:"color-mix(in srgb, var(--accent) 16%, transparent)", color:"var(--accent)", width:38, height:38 }}><Icon name="edit" size={18} /></div>
        <div className="col" style={{ gap:2, flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:18, letterSpacing:"-0.02em" }}>Log your work</div>
          <div className="faint clip" style={{ fontSize:13 }}>{t.id} · {t.title}</div>
        </div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={18} /></button>
      </div>

      <div className="content-scroll col gap14" style={{ padding:20, gap:14 }}>
        <div style={{ background:"var(--tint)", borderRadius:"var(--radius-sm)", padding:"11px 13px" }}>
          <div className="faint" style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em", fontWeight:650, marginBottom:4 }}>The task</div>
          <div className="muted" style={{ fontSize:13.5, lineHeight:1.5 }}>{t.desc}</div>
        </div>

        <div className="col gap8">
          <div className="row"><div className="section-title">What did you get done?</div><span className="faint mauto" style={{ fontSize:12 }}>{text.trim().split(/\s+/).filter(Boolean).length} words</span></div>
          <textarea className="input" rows={5} placeholder="Be specific — what you did, numbers, IDs, names. Specific logs get verified faster." value={text}
            onChange={e=>{ setText(e.target.value); if(stage==="result"){setStage("write");setRes(null);} }} autoFocus />
          <div className="row gap8 ai-chip" style={{ alignSelf:"flex-start", background:"var(--tint)", border:"1px solid var(--glass-border)", color:"var(--text-2)" }}>
            <Icon name="spark" size={13} fill="current" style={{ color:"var(--accent)" }} /> The AI checks your log against the task before it's saved
          </div>
        </div>

        {stage==="checking" && (
          <div className="glass-2 row gap10 fadeup" style={{ padding:"14px 16px", borderRadius:"var(--radius-sm)", border:"1px solid var(--glass-border)" }}>
            <Icon name="refresh" size={18} style={{ animation:"spin 1s linear infinite", color:"var(--accent)" }} />
            <span style={{ fontSize:14, fontWeight:550 }}>Verifying your log against the task…</span>
          </div>
        )}

        {stage==="result" && res && (
          <div className="col gap10 fadeup" style={{ padding:"14px 16px", borderRadius:"var(--radius-sm)",
            background:`color-mix(in srgb, ${CONF[res.conf].c} 9%, var(--tint))`, border:`1px solid color-mix(in srgb, ${CONF[res.conf].c} 26%, transparent)` }}>
            <div className="row gap8"><Icon name="spark" size={15} fill="current" style={{ color:CONF[res.conf].c }} /><span style={{ fontWeight:660, fontSize:14, color:CONF[res.conf].c }}>AI assessment: {CONF[res.conf].label}</span><div className="mauto"><ConfBadge conf={res.conf} withLabel={false} /></div></div>
            <div className="muted" style={{ fontSize:13.5, lineHeight:1.5 }}>{res.note}</div>
            {res.flags.length>0 && <div className="col gap5">{res.flags.map((f,i)=><div key={i} className="row gap6" style={{ fontSize:12.5, color:"var(--text-2)", alignItems:"flex-start" }}><Icon name="flag" size={12} style={{ color:CONF[res.conf].c, marginTop:2 }} /><span>{f}</span></div>)}</div>}
            {res.conf!=="high" && <div className="faint" style={{ fontSize:12 }}>Tip: add specifics and resubmit, or save as-is — your manager will see this rating.</div>}
          </div>
        )}
      </div>

      <div className="row gap10" style={{ padding:"14px 20px", borderTop:"1px solid var(--sep)" }}>
        <button className="btn btn-ghost mauto" onClick={onClose}>Cancel</button>
        {stage!=="result"
          ? <button className="btn btn-primary" disabled={text.trim().length<3||stage==="checking"} onClick={check}><Icon name="spark" size={15} fill="current" /> Check log</button>
          : <>
              <button className="btn btn-glass" onClick={()=>{setStage("write");}}>Edit</button>
              <button className="btn btn-primary" onClick={submit}><Icon name="check" size={15} sw={2.4} /> Submit log</button>
            </>
        }
      </div>
    </Modal>
  );
}

// ============================================================
// MEMBER sheet (manager taps a person)
// ============================================================
function MemberSheet({ userId, ctx, onClose }) {
  const u = byId(userId);
  const mine = ctx.tasks.filter(t=>t.assignee===userId);
  const st = teamStats(ctx.tasks).find(s=>s.u.id===userId);
  const sm = STATE_META[st.state];
  return (
    <Modal right onClose={onClose}>
      <div className="row gap14 ai-glow" style={{ padding:"20px", borderBottom:"1px solid var(--sep)" }}>
        <Avatar user={u} size={52} ring />
        <div className="col" style={{ gap:3, flex:1, minWidth:0 }}>
          <div style={{ fontWeight:720, fontSize:20, letterSpacing:"-0.02em" }}>{u.name}</div>
          <div className="faint" style={{ fontSize:13 }}>{u.role}</div>
        </div>
        <span className="pill" style={{ background:`color-mix(in srgb, ${sm.c} 15%, transparent)`, color:sm.c, borderColor:`color-mix(in srgb, ${sm.c} 28%, transparent)`, alignSelf:"flex-start" }}><span className="dot" style={{ background:sm.c }}></span>{sm.label}</span>
        <button className="iconbtn" onClick={onClose} style={{ alignSelf:"flex-start" }}><Icon name="close" size={18} /></button>
      </div>
      <div className="content-scroll col gap12" style={{ padding:20 }}>
        <div className="row gap16" style={{ justifyContent:"space-around" }}>
          <MiniStat val={st.active.length} label="Active" c="#0A84FF" />
          <MiniStat val={st.overdue.length} label="Overdue" c={st.overdue.length?"#FF453A":"var(--text-3)"} />
          <MiniStat val={st.avg+"%"} label="Avg progress" c="#30D158" />
        </div>
        <div className="section-title">Assigned tasks</div>
        {mine.map(t=>(
          <div key={t.id} className="trow glass-2" style={{ gridTemplateColumns:"1fr auto", padding:"12px 14px", border:"1px solid var(--glass-border)" }} onClick={()=>{onClose();ctx.openTask(t.id);}}>
            <div className="col" style={{ gap:4, minWidth:0 }}>
              <span className="clip" style={{ fontWeight:600, fontSize:14 }}>{t.title}</span>
              <div className="row gap8"><Deadline date={t.deadline} /></div>
            </div>
            <StatusPill status={t.status} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

// spin keyframe (used by several)
(function(){ const s=document.createElement("style"); s.textContent="@keyframes spin{to{transform:rotate(360deg)}}"; document.head.appendChild(s); })();

Object.assign(window, { TaskDetail, BriefSheet, MyTasks, Activity, LogWorkModal, MemberSheet, assessLog });
