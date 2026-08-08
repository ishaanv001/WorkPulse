'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useStore } from '../../store';
import { scoreColor, levelBg, levelBd, levelColor, formatNumber } from '../../utils/colors';

const TASKS = [
  { id:'t1', title:'Refactor payment gateway', assignees:['alex','raj'], priority:'critical', status:'in_progress', progress:62, due:'Tomorrow', estimate:'8h', category:'Backend' },
  { id:'t2', title:'Design system tokens migration', assignees:['maya','nina'], priority:'high', status:'in_progress', progress:40, due:'3 days', estimate:'12h', category:'Frontend' },
  { id:'t3', title:'LSTM forecast integration', assignees:['raj','priya'], priority:'high', status:'review', progress:88, due:'Today', estimate:'6h', category:'ML' },
  { id:'t4', title:'Kubernetes autoscaling config', assignees:['luis','tom'], priority:'medium', status:'in_progress', progress:30, due:'5 days', estimate:'10h', category:'DevOps' },
  { id:'t5', title:'Accessibility audit sprint', assignees:['tom','sara'], priority:'medium', status:'todo', progress:0, due:'Next week', estimate:'16h', category:'QA' },
  { id:'t6', title:'API rate limiter v2', assignees:['priya','alex'], priority:'high', status:'in_progress', progress:55, due:'4 days', estimate:'7h', category:'Backend' },
  { id:'t7', title:'Onboarding flow redesign', assignees:['maya','sara'], priority:'low', status:'todo', progress:0, due:'2 weeks', estimate:'20h', category:'Product' },
  { id:'t8', title:'CI/CD pipeline hardening', assignees:['luis'], priority:'medium', status:'done', progress:100, due:'Done', estimate:'5h', category:'DevOps' },
];

const EFFICIENCY = [
  { member:'alex', velocity:87, cycleTime:2.1, collaboration:78, load:91, color:'#b42318' },
  { member:'maya', velocity:74, cycleTime:2.8, collaboration:85, load:74, color:'#c4320a' },
  { member:'raj',  velocity:91, cycleTime:1.6, collaboration:70, load:62, color:'#b54708' },
  { member:'sara', velocity:96, cycleTime:1.2, collaboration:92, load:38, color:'#067647' },
  { member:'luis', velocity:88, cycleTime:1.9, collaboration:60, load:25, color:'#5925dc' },
  { member:'priya',velocity:79, cycleTime:2.4, collaboration:74, load:68, color:'#c4320a' },
  { member:'tom',  velocity:82, cycleTime:2.0, collaboration:88, load:49, color:'#1a56db' },
  { member:'nina', velocity:85, cycleTime:1.8, collaboration:95, load:54, color:'#b54708' },
];

const POSITIONS: Record<string, {x:number;y:number}> = {
  alex:{x:270,y:110}, maya:{x:420,y:85},  raj:{x:500,y:195},
  sara:{x:415,y:305}, luis:{x:270,y:330}, priya:{x:130,y:230},
  tom:{x:155,y:355},  nina:{x:490,y:350},
};

const LINKS = [
  { a:'alex',b:'raj',   w:90,type:'synergy' }, { a:'alex',b:'priya',w:75,type:'synergy' },
  { a:'maya',b:'nina',  w:85,type:'synergy' }, { a:'maya',b:'sara', w:65,type:'ok' },
  { a:'raj', b:'priya', w:88,type:'synergy' }, { a:'luis',b:'tom',  w:70,type:'ok' },
  { a:'tom', b:'sara',  w:60,type:'ok' },      { a:'alex',b:'maya', w:55,type:'friction' },
  { a:'priya',b:'luis', w:40,type:'friction' },{ a:'raj', b:'nina', w:50,type:'ok' },
  { a:'sara',b:'nina',  w:72,type:'ok' },      { a:'alex',b:'luis', w:30,type:'friction' },
  { a:'tom', b:'nina',  w:65,type:'ok' },
];

const PCOLOR: Record<string,string> = { critical:'#b42318', high:'#c4320a', medium:'#b54708', low:'#067647' };
const PBG:    Record<string,string> = { critical:'#fef3f2', high:'#fff6ed',  medium:'#fffaeb',  low:'#ecfdf3' };
const SCOLOR: Record<string,string> = { in_progress:'#1a56db', review:'#5925dc', done:'#067647', todo:'#667085' };
const SLABEL: Record<string,string> = { in_progress:'In progress', review:'In review', done:'Done', todo:'To do' };

type Metric = 'load'|'velocity'|'cycleTime'|'collaboration';

export default function CollabPage() {
  const { team, predictions, collaborations } = useStore();
  const [filter, setFilter] = useState('all');
  const [activeMetric, setActiveMetric] = useState<Metric>('load');
  const [hoveredNode, setHoveredNode] = useState<string|null>(null);

  const members = ['all', ...team.map(m => m.id)];
  const filteredTasks = TASKS.filter(t => filter === 'all' || t.assignees.includes(filter));

  const teamVelocity = Math.round(EFFICIENCY.reduce((s,m)=>s+m.velocity,0)/EFFICIENCY.length);
  const avgCycleTime = (EFFICIENCY.reduce((s,m)=>s+m.cycleTime,0)/EFFICIENCY.length).toFixed(1);
  const done = TASKS.filter(t=>t.status==='done').length;
  const inProgress = TASKS.filter(t=>t.status==='in_progress').length;

  return (
    <AppShell activePath="/collab">
      <div className="page-hd">
        <div>
          <div className="page-title">Team Collaboration</div>
          <div className="page-sub">Sprint 14 · Task efficiency · Network analysis · Brook's Law</div>
        </div>
        <div className="hd-actions">
          <button className="btn">Export sprint</button>
          <button className="btn btn-primary">New task</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {[
          { lbl:'Sprint velocity',  val:`${teamVelocity}%`, col:'#067647',
            tt:{'Target':'90%','Delta':'+3% to target','Trend':'Improving'} },
          { lbl:'Avg cycle time',   val:`${avgCycleTime}d`, col:'#1a56db',
            tt:{'P50 cycle time':'1.9d','P90':'3.2d','Blocked':'0.4d'} },
          { lbl:'Tasks done',       val:`${done}/${TASKS.length}`, col:'#5925dc',
            tt:{'In progress':String(inProgress),'In review':'1','Completion':'62.5%'} },
          { lbl:'Collab pairs',     val:`${collaborations.length}`, col:'#b54708',
            tt:{'Synergy pairs':'6','Friction pairs':'3','Brook paths':'28'} },
          { lbl:'Communication paths', val:'28', col:'#c4320a',
            tt:{'8 members':'n(n-1)/2 = 28','Add 1 member':'+7 paths','+25% overhead':'yes'} },
        ].map((k,i) => (
          <div key={i} className="kpi reveal" style={{ '--kpi-col': k.col } as any}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-tooltip">
              <div className="kpi-tooltip-title">{k.lbl}</div>
              {Object.entries(k.tt).map(([l,v]) => (
                <div key={l} className="kpi-tooltip-row">
                  <span className="kpi-tooltip-lbl">{l}</span>
                  <span className="kpi-tooltip-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="view-body">
        {/* Network + radar */}
        <div className="grid-2">
          {/* Network graph */}
          <div className="panel reveal">
            <div className="panel-hd">
              <div className="panel-title">Collaboration network</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#067647', display: 'inline-block' }}/> Synergy</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d0d5dd', display: 'inline-block' }}/> Neutral</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#b42318', display: 'inline-block' }}/> Friction</span>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 640 430" width="100%" style={{ display: 'block', background: '#f9fafb' }}>
                {LINKS.map((l,i) => {
                  const a = POSITIONS[l.a], b = POSITIONS[l.b];
                  const col = l.type === 'synergy' ? '#067647' : l.type === 'friction' ? '#b42318' : '#d0d5dd';
                  const isHov = hoveredNode === l.a || hoveredNode === l.b;
                  return (
                    <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={col} strokeWidth={isHov ? l.w/25 : l.w/45}
                      strokeDasharray={l.type === 'friction' ? '5 4' : ''}
                      opacity={hoveredNode && !isHov ? 0.08 : 0.5}
                      style={{ transition: 'opacity .2s' }}/>
                  );
                })}
                {team.map(m => {
                  const pos = POSITIONS[m.id];
                  if (!pos) return null;
                  const p = predictions[m.id];
                  const isHov = hoveredNode === m.id;
                  return (
                    <g key={m.id} style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredNode(m.id)}
                      onMouseLeave={() => setHoveredNode(null)}>
                      {p && p.score > 75 && (
                        <circle cx={pos.x} cy={pos.y} r={26} fill="none" stroke={scoreColor(p.score)} strokeWidth="1.5" opacity="0.3" style={{ animation: 'blink 2s infinite' }}/>
                      )}
                      <circle cx={pos.x} cy={pos.y} r={isHov ? 22 : 18}
                        fill={m.color + '18'} stroke={m.color} strokeWidth={isHov ? 2 : 1.5} style={{ transition: 'r .15s' }}/>
                      <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={m.color}>{m.avatar}</text>
                      <text x={pos.x} y={pos.y + 33} textAnchor="middle" fontSize="9" fill="#667085">{m.name.split(' ')[0]}</text>
                      {p && <text x={pos.x} y={pos.y + 44} textAnchor="middle" fontSize="8" fontFamily="monospace" fill={scoreColor(p.score)}>{formatNumber(p.score,0)}</text>}
                    </g>
                  );
                })}
                {/* Brook's Law box */}
                <g transform="translate(12,12)">
                  <rect width="145" height="36" rx="5" fill="#fff" stroke="#e4e7ec" strokeWidth="0.5"/>
                  <text x="8" y="15" fontSize="9" fontWeight="600" fill="#344054">Brook's Law</text>
                  <text x="8" y="27" fontSize="9" fill="#667085" fontFamily="monospace">8 members → 28 paths</text>
                </g>
              </svg>
              {/* Hover tooltip */}
              {hoveredNode && (() => {
                const m = team.find(t => t.id === hoveredNode);
                const ef = EFFICIENCY.find(e => e.member === hoveredNode);
                const p = m ? predictions[m.id] : null;
                if (!m || !ef || !p) return null;
                return (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', width: 170, pointerEvents: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                      <div className="av" style={{ width: 26, height: 26, background: m.color, fontSize: 9 }}>{m.avatar}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name.split(' ')[0]}</div>
                    </div>
                    {[
                      ['Load', `${ef.load}%`, scoreColor(ef.load)],
                      ['Velocity', `${ef.velocity}%`, '#067647'],
                      ['Cycle time', `${ef.cycleTime}d`, '#1a56db'],
                      ['Collab score', `${ef.collaboration}%`, '#5925dc'],
                    ].map(([l,v,c]) => (
                      <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{l}</span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: String(c) }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Efficiency radar */}
          <div className="panel reveal d1">
            <div className="panel-hd">
              <div className="panel-title">Member efficiency</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['load','velocity','cycleTime','collaboration'] as Metric[]).map(k => (
                  <button key={k} className={`btn btn-sm${activeMetric===k?' btn-primary':''}`}
                    style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => setActiveMetric(k)}>
                    {k==='cycleTime'?'Cycle':k==='collaboration'?'Collab':k.charAt(0).toUpperCase()+k.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-body">
              {EFFICIENCY.map(ef => {
                const m = team.find(t => t.id === ef.member);
                const raw = ef[activeMetric] as number;
                const maxVal = activeMetric === 'cycleTime' ? 5 : 100;
                const pct = (raw / maxVal) * 100;
                const col = activeMetric === 'load' ? scoreColor(raw) : activeMetric === 'cycleTime' ? (raw > 3 ? '#b42318' : raw > 2 ? '#b54708' : '#067647') : '#1a56db';
                return (
                  <div key={ef.member} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                    <div className="av" style={{ width: 22, height: 22, background: ef.color, fontSize: 8, flexShrink: 0 }}>{m?.avatar}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', width: 40, flexShrink: 0, fontWeight: 500 }}>{ef.member.charAt(0).toUpperCase()+ef.member.slice(1)}</div>
                    <div className="wl-bg" style={{ flex: 1 }}>
                      <div className="wl-fill" style={{ width: `${pct}%`, background: col }}/>
                    </div>
                    <div className="wl-num" style={{ color: col }}>
                      {activeMetric === 'cycleTime' ? `${raw}d` : `${raw}%`}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                {activeMetric === 'load'          && 'Alex and Maya are overloaded. Consider redistributing tasks before sprint end.'}
                {activeMetric === 'velocity'      && 'Raj leading velocity at 91%. Sara highest task completion rate at 96%.'}
                {activeMetric === 'cycleTime'     && 'Sara has shortest cycle time at 1.2d. Alex longest at 2.1d — task complexity factor.'}
                {activeMetric === 'collaboration' && 'Nina highest collab score at 95%. Luis most silo risk at 60% — schedule pairing sessions.'}
              </div>
            </div>
          </div>
        </div>

        {/* Task board */}
        <div className="panel reveal d1">
          <div className="panel-hd">
            <div className="panel-title">Sprint 14 task board</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
              <span>{TASKS.filter(t=>t.status==='done').length} done</span>
              <span>·</span>
              <span>{TASKS.filter(t=>t.status==='in_progress').length} in progress</span>
              <span>·</span>
              <span>{TASKS.filter(t=>t.status==='todo').length} to do</span>
            </div>
          </div>
          <div className="chips">
            {members.map(m => {
              const tm = team.find(t => t.id === m);
              return (
                <div key={m} className={`chip${filter===m?' sel':''}`} onClick={() => setFilter(m)}>
                  {m === 'all' ? 'All members' : tm?.name.split(' ')[0] ?? m}
                </div>
              );
            })}
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredTasks.map(task => {
              const assigneeMembers = task.assignees.map(id => team.find(m => m.id === id)).filter(Boolean);
              return (
                <div key={task.id} className="task-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderLeft: `3px solid ${PCOLOR[task.priority]}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: PBG[task.priority], color: PCOLOR[task.priority], border: `1px solid ${PCOLOR[task.priority]}30` }}>{task.priority}</span>
                      <span className="badge" style={{ background: SCOLOR[task.status] + '18', color: SCOLOR[task.status], border: `1px solid ${SCOLOR[task.status]}30` }}>{SLABEL[task.status]}</span>
                      <span className="tag" style={{ background: 'var(--surface3)', color: 'var(--muted)', borderColor: 'var(--border)' }}>{task.category}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{task.title}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${task.progress}%`, background: task.status === 'done' ? '#067647' : task.progress > 70 ? '#1a56db' : '#5925dc' }}/>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ display: 'flex' }}>
                      {assigneeMembers.map((m, i) => m && (
                        <div key={m.id} className="av" title={m.name}
                          style={{ width: 22, height: 22, fontSize: 8, background: m.color, marginLeft: i > 0 ? -6 : 0, border: '1.5px solid #fff' }}>
                          {m.avatar}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{task.estimate}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500, color: task.due === 'Today' || task.due === 'Tomorrow' ? '#b42318' : 'var(--muted)' }}>
                      {task.due}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600, color: task.status === 'done' ? '#067647' : 'var(--text)' }}>{task.progress}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pairing + silos */}
        <div className="grid-2-eq">
          <div className="panel reveal">
            <div className="panel-hd"><div className="panel-title">Pairing recommendations</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { pair:['alex','raj'],  reason:'High synergy (0.90) — good for payment gateway. Offloads Alex by estimated 14 points.', type:'synergy', impact:'-14 pts Alex' },
                { pair:['maya','nina'], reason:'Strong design synergy (0.85) — migrate token system together.', type:'synergy', impact:'-8 pts Maya' },
                { pair:['alex','priya'],reason:'Priya can absorb API rate limiter — reduces Alex overload significantly.', type:'rebalance', impact:'-18 pts Alex' },
                { pair:['alex','luis'], reason:'Friction detected (0.30). Avoid pairing this sprint to prevent coordination overhead.', type:'friction', impact:'+6 pts both' },
              ].map((r,i) => {
                const col = r.type === 'synergy' ? '#067647' : r.type === 'rebalance' ? '#5925dc' : '#b42318';
                const bg  = r.type === 'synergy' ? '#ecfdf3'  : r.type === 'rebalance' ? '#f4f3ff'  : '#fef3f2';
                const bd  = r.type === 'synergy' ? '#abefc6'  : r.type === 'rebalance' ? '#d9d6fe'  : '#fecdca';
                const mA = team.find(m => m.id === r.pair[0]);
                const mB = team.find(m => m.id === r.pair[1]);
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', border: `1px solid ${bd}`, borderRadius: 8, background: bg }}>
                    <div style={{ display: 'flex', flexShrink: 0 }}>
                      {[mA, mB].map((m, j) => m && (
                        <div key={m.id} className="av" style={{ width: 22, height: 22, fontSize: 8, background: m.color, marginLeft: j > 0 ? -5 : 0, border: '1.5px solid #fff' }}>{m.avatar}</div>
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
                        {r.pair[0].charAt(0).toUpperCase()+r.pair[0].slice(1)} + {r.pair[1].charAt(0).toUpperCase()+r.pair[1].slice(1)}
                        <span className="badge" style={{ background: bg, color: col, border: `1px solid ${bd}`, fontSize: 10 }}>{r.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{r.reason}</div>
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: col, flexShrink: 0, fontWeight: 600 }}>{r.impact}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel reveal d1">
            <div className="panel-hd"><div className="panel-title">Knowledge silo risk</div></div>
            <div className="panel-body">
              {team.filter(m => m.inputs.team.busFactor < 2 || m.inputs.team.knowledgeSilos > 65).map(m => {
                const p = predictions[m.id];
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div className="av" style={{ width: 28, height: 28, background: m.color, flexShrink: 0 }}>{m.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: '#b42318', marginTop: 1 }}>Bus factor: {m.inputs.team.busFactor} · Silos: {m.inputs.team.knowledgeSilos}%</div>
                    </div>
                    <span className="badge" style={{ background: '#fef3f2', color: '#b42318', border: '1px solid #fecdca', fontSize: 10 }}>High risk</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: '11px 13px', background: '#fffaeb', border: '1px solid #fedf89', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#b54708', marginBottom: 5 }}>Brook's Law</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {team.length} members creates <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{team.length*(team.length-1)/2}</strong> communication paths.<br/>
                  Adding 1 more member creates <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{team.length}</strong> new paths (+{Math.round((team.length/(team.length-1)-1)*100)}% overhead).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:.35}50%{opacity:.9}}`}</style>
    </AppShell>
  );
}
