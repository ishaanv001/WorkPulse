'use client';
import { useState } from 'react';
import { useStore } from '../../store';
import Sparkline from '../common/Sparkline';
import { scoreColor, levelColor, levelBg, levelBd, alertColor, alertBg, alertBd, trendLabel, trendColor, formatNumber, fmtTimeAgo } from '../../utils/colors';

// ── SHARED HELPERS ─────────────────────────────────────────────────────────
function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

// ── FUZZY ENGINE ──────────────────────────────────────────────────────────────
export function FuzzyView() {
  const { team, predictions } = useStore();
  const [cat, setCat] = useState('all');
  const cats = ['all','burnout','overload','busy','normal','safety','critical'];
  const allRules = Object.values(predictions)[0]?.mamdani.firedRules ?? [];
  const filtered = cat === 'all' ? allRules : allRules.filter(r => r.category === cat);

  const catColor: Record<string,string> = {
    burnout:'#b42318', overload:'#c4320a', busy:'#b54708',
    normal:'#067647', safety:'#1a56db', critical:'#b42318',
  };

  return (
    <div className="view-body">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd">
              <div className="panel-title">Rule base explorer</div>
              <span className="panel-sub">55 rules · Mamdani MIN-MAX</span>
            </div>
            <div className="tabs" style={{ background: '#fff' }}>
              {cats.map(c => (
                <div key={c} className={`tab${cat===c?' active':''}`} onClick={() => setCat(c)} style={{ textTransform: 'capitalize' }}>{c}</div>
              ))}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <div style={{ padding: 20, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>No rules fired in this category</div>
              )}
              {filtered.map((r, i) => {
                const col = catColor[r.category] ?? '#667085';
                return (
                  <div key={r.id} style={{ display: 'flex', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', cursor: 'default' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', width: 28, flexShrink: 0, paddingTop: 1 }}>{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 4 }}>{r.rule}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ background: col+'12', color: col, border: `1px solid ${col}30`, fontSize: 10 }}>{r.category}</span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>strength: <span style={{ color: '#b54708' }}>{formatNumber(r.strength, 2)}</span></span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>→ {r.consequent}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: col, flexShrink: 0, fontWeight: 600 }}>{r.impact > 0 ? '+' : ''}{formatNumber(r.impact)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel reveal d1">
            <div className="panel-hd"><div className="panel-title">Sugeno coefficients</div></div>
            <div className="panel-body">
              {Object.values(predictions)[0]?.sugeno.coefficients.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', width: 58 }}>Coeff {i+1}</span>
                  <div className="wl-bg" style={{ flex: 1 }}>
                    <div className="wl-fill" style={{ width: `${Math.min(100, Math.abs(c) * 5)}%`, background: c > 0 ? '#5925dc' : '#b42318' }}/>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#5925dc', width: 48, textAlign: 'right' }}>{formatNumber(c, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col">
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 8, padding: '0 2px' }}>
            Per-member membership
          </div>
          {team.map(m => {
            const p = predictions[m.id];
            if (!p) return null;
            return (
              <div key={m.id} className="panel" style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div className="av" style={{ width: 26, height: 26, background: m.color, fontSize: 9 }}>{m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>M:{formatNumber(p.mamdani.score)} S:{formatNumber(p.sugeno.score)} NN:{formatNumber(p.neuralNet.score)}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: scoreColor(p.score) }}>{formatNumber(p.score,0)}</span>
                </div>
                {[
                  { lbl:'Normal',     k:'veryLow', col:'#067647' },
                  { lbl:'Busy',       k:'low',     col:'#3d9a6e' },
                  { lbl:'Medium',     k:'medium',  col:'#b54708' },
                  { lbl:'High',       k:'high',    col:'#c4320a' },
                  { lbl:'Burnout',    k:'veryHigh',col:'#b42318' },
                ].map(({ lbl, k, col }) => {
                  const val = (p.mamdani.membership as any)[k] * 100;
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 44, fontSize: 10, color: 'var(--muted)' }}>{lbl}</span>
                      <div className="wl-bg" style={{ flex: 1 }}><div className="wl-fill" style={{ width: `${val}%`, background: col }}/></div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: col, width: 28, textAlign: 'right' }}>{formatNumber(val,0)}%</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ML ENGINE ─────────────────────────────────────────────────────────────────
export function MLView() {
  const { team, predictions, selectedId, selectMember } = useStore();
  const member = team.find(m => m.id === selectedId) || team[0];
  const pred = member ? predictions[member.id] : null;
  if (!pred) return null;
  const maxShap = Math.max(...pred.shapValues.map(s => Math.abs(s.value)), 0.01);

  return (
    <div className="view-body">
      <div className="chips" style={{ padding: '12px 0', border: 'none' }}>
        {team.map(m => (
          <div key={m.id} className={`chip${selectedId===m.id?' sel':''}`} onClick={() => selectMember(m.id)}
            style={{ borderColor: selectedId===m.id ? m.color : '' }}>
            {m.name.split(' ')[0]}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd">
              <div className="panel-title">SHAP feature explainability</div>
              <span className="panel-sub">Kernel SHAP · 17 features · {member.name}</span>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11, color: 'var(--muted)' }}>
                <span>Reducing workload</span>
                <span>Increasing workload</span>
              </div>
              {pred.shapValues.map(s => {
                const pct = Math.abs(s.value) / maxShap * 46;
                const col = s.direction === 'increasing' ? '#b42318' : '#067647';
                return (
                  <div key={s.featureName} className="shap-row" title={`${s.featureName}: ${s.value>=0?'+':''}${formatNumber(s.value,3)}`}>
                    <div className="shap-name">{s.featureName}</div>
                    <div className="shap-bars">
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        {s.direction === 'decreasing' && <div className="shap-bar" style={{ width: `${pct}%`, background: col }}/>}
                      </div>
                      <div className="shap-center"/>
                      <div style={{ flex: 1 }}>
                        {s.direction === 'increasing' && <div className="shap-bar" style={{ width: `${pct}%`, background: col }}/>}
                      </div>
                    </div>
                    <div className="shap-val" style={{ color: col }}>{s.value>=0?'+':''}{formatNumber(s.value,3)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel reveal d1">
            <div className="panel-hd"><div className="panel-title">Action items</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pred.actionItems.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 14 }}>No action items</div>}
              {pred.actionItems.map(a => {
                const pCol = a.priority==='critical'?'#b42318':a.priority==='high'?'#c4320a':a.priority==='medium'?'#b54708':'#067647';
                const pBg  = a.priority==='critical'?'#fef3f2':a.priority==='high'?'#fff6ed':a.priority==='medium'?'#fffaeb':'#ecfdf3';
                const pBd  = a.priority==='critical'?'#fecdca':a.priority==='high'?'#f9dbaf':a.priority==='medium'?'#fedf89':'#abefc6';
                return (
                  <div key={a.id} style={{ padding: '10px 12px', border: `1px solid ${pBd}`, borderRadius: 8, background: pBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge" style={{ background: pBg, color: pCol, border: `1px solid ${pBd}` }}>{a.priority}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{a.description}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 11, fontFamily: 'var(--mono)' }}>
                      <span style={{ color: '#067647' }}>Impact: {a.expectedImpact}</span>
                      <span style={{ color: 'var(--muted)' }}>Effort: {a.effort}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd"><div className="panel-title">Neural network layers</div></div>
            <div className="panel-body">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 34, fontFamily: 'var(--mono)', fontWeight: 700, color: scoreColor(pred.neuralNet.score) }}>{formatNumber(pred.neuralNet.score)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>NN Output</div>
              </div>
              {pred.neuralNet.layerActivations.map((layer, li) => (
                <div key={li} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    {['Hidden 1 — ReLU', 'Hidden 2 — tanh', 'Output — sigmoid'][li]}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {layer.map((v, j) => (
                      <span key={j} title={`Activation: ${v.toFixed(4)}`}
                        className="tag" style={{ background: 'var(--purple-bg)', color: '#5925dc', borderColor: 'var(--purple-bd)', cursor: 'help' }}>
                        {formatNumber(v, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="divider" style={{ margin: '12px 0' }}/>
              <div className="grid-2-eq" style={{ gap: 8 }}>
                <div className="stat">
                  <div className="stat-lbl">Agreement</div>
                  <div className="stat-val" style={{ color: '#067647', fontSize: 18 }}>{formatNumber(pred.ensemble.agreementScore * 100)}%</div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">Calibration</div>
                  <div className="stat-val" style={{ color: '#b54708', fontSize: 18 }}>{formatNumber(pred.neuralNet.confidenceCalibration * 100)}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel reveal d1">
            <div className="panel-hd"><div className="panel-title">Ensemble comparison</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {team.map(m => {
                const p = predictions[m.id];
                if (!p) return null;
                return (
                  <div key={m.id} onClick={() => selectMember(m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface3)', cursor: 'pointer' }}>
                    <div className="av" style={{ width: 22, height: 22, background: m.color, fontSize: 8 }}>{m.avatar}</div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                      {([['M',p.mamdani.score,'#1a56db'],['S',p.sugeno.score,'#5925dc'],['NN',p.neuralNet.score,'#067647'],['H',p.score,scoreColor(p.score)]] as const).map(([l,v,c]) => (
                        <div key={String(l)} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--muted)' }}>{l}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: c as string, fontWeight: 700 }}>{formatNumber(Number(v), 0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MEMBERS VIEW ──────────────────────────────────────────────────────────────
export function MembersView() {
  const { team, predictions } = useStore();
  return (
    <div className="view-body">
      <div className="grid-2-eq">
        {team.map(m => {
          const p = predictions[m.id];
          if (!p) return null;
          return (
            <div key={m.id} className="panel reveal" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/member'}>
              <div className="panel-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="av" style={{ width: 34, height: 34, background: m.color, border: `2px solid ${m.color}`, fontSize: 12 }}>{m.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.role}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: scoreColor(p.score) }}>{formatNumber(p.score,0)}</div>
                  <span className="badge" style={{ background: levelBg(p.level), color: levelColor(p.level), border: `1px solid ${levelBd(p.level)}` }}>{p.level}</span>
                </div>
              </div>
              <div className="panel-body">
                <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
                  {m.skills.map(s => <span key={s} className="tag" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-bd)', fontSize: 10 }}>{s}</span>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { lbl:'Tasks', val:String(m.inputs.individual.activeTasks), col:scoreColor(m.inputs.individual.activeTasks*8) },
                    { lbl:'Stress', val:`${m.inputs.wellbeing.selfReportedStress}/10`, col:scoreColor(m.inputs.wellbeing.selfReportedStress*10) },
                    { lbl:'Bus', val:String(m.inputs.team.busFactor), col:m.inputs.team.busFactor<2?'#b42318':'#067647' },
                  ].map(s => (
                    <div key={s.lbl} style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 9px' }}>
                      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{s.lbl}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: s.col }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 6 }}>14-day history</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36 }}>
                  {m.history.map((v, i) => (
                    <div key={i} title={`Score: ${formatNumber(v,0)}`}
                      style={{ flex: 1, background: scoreColor(v), height: `${(v/100)*100}%`, borderRadius: '2px 2px 0 0', opacity: 0.4+(i/m.history.length)*0.6, minHeight: 2, cursor: 'help' }}
                      onMouseOver={e=>(e.currentTarget.style.opacity='1')} onMouseOut={e=>(e.currentTarget.style.opacity=String(0.4+(i/m.history.length)*0.6))}/>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FORECAST VIEW ─────────────────────────────────────────────────────────────
export function ForecastView() {
  const { team, forecasts, predictions } = useStore();
  return (
    <div className="view-body">
      <div className="grid-2-eq">
        {team.map(m => {
          const f = forecasts[m.id], p = predictions[m.id];
          if (!f || !p) return null;
          return (
            <div key={m.id} className="panel reveal">
              <div className="panel-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="av" style={{ width: 24, height: 24, background: m.color, fontSize: 9 }}>{m.avatar}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>MAE:{f.mae} RMSE:{f.rmse}</div>
                  </div>
                </div>
                <span className="badge" style={{ background: levelBg(p.level), color: levelColor(p.level), border: `1px solid ${levelBd(p.level)}` }}>{formatNumber(p.score,0)}</span>
              </div>
              <div className="panel-body">
                {f.points.map((pt: any, i: number) => (
                  <div key={i} className="forecast-row">
                    <div className="forecast-day">{pt.date}</div>
                    <div className="forecast-bg"><div className="forecast-fill" style={{ width:`${pt.score}%`, background:scoreColor(pt.score) }}/></div>
                    <div className="forecast-val" style={{ color:scoreColor(pt.score) }}>{formatNumber(pt.score)}</div>
                    <div className="forecast-ci">±{formatNumber(pt.upper-pt.score)}</div>
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

// ── ALERTS VIEW ───────────────────────────────────────────────────────────────
export function AlertsView() {
  const { alerts, escalationRules, rateLimits, refreshAlerts } = useStore();
  return (
    <div className="view-body">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd">
              <div className="panel-title">Active alerts ({alerts.filter(a=>!a.dismissed).length})</div>
              <button className="btn btn-sm" onClick={refreshAlerts}>Refresh</button>
            </div>
            <div className="panel-body">
              <div className="alert-list">
                {alerts.filter(a=>!a.dismissed).map(a => (
                  <div key={a.id} className="alert-card" style={{ background:alertBg(a.severity), borderColor:alertColor(a.severity) }}>
                    <div className="alert-indicator" style={{ background:alertColor(a.severity) }}/>
                    <div className="alert-body-wrap">
                      <div className="alert-card-title">{a.title}</div>
                      <div className="alert-card-desc">{a.body}</div>
                      <div className="alert-actions">
                        {a.recommendedActions.map((act,i) => (
                          <span key={i} className="alert-tag" style={{ background:alertColor(a.severity)+'18', color:alertColor(a.severity), border:`1px solid ${alertBd(a.severity)}` }}>{act}</span>
                        ))}
                      </div>
                    </div>
                    <div className="alert-time">{fmtTimeAgo(a.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel reveal d1">
            <div className="panel-hd"><div className="panel-title">Rate limit monitor</div></div>
            <div className="panel-body">
              {rateLimits.map(r => {
                const pct = (r.used/r.limit)*100;
                const col = pct>85?'#b42318':pct>60?'#c4320a':'#067647';
                return (
                  <div key={r.tier} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.tier}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: col, fontWeight: 600 }}>{r.used}/{r.limit}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${Math.min(100,pct)}%`, background:col }}/></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd"><div className="panel-title">Escalation rules</div></div>
            <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:580, overflowY:'auto' }}>
              {escalationRules.map(r => {
                const col = alertColor(r.severity);
                const bg  = alertBg(r.severity);
                const bd  = alertBd(r.severity);
                return (
                  <div key={r.id} style={{ padding:'9px 11px', border:`1px solid ${bd}`, borderRadius:8, background:bg }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                      <span className="badge" style={{ background:bg, color:col, border:`1px solid ${bd}` }}>{r.severity}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', flex:1 }}>{r.name}</span>
                      <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--muted)' }}>cd:{r.cooldownMinutes}m</span>
                    </div>
                    <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--muted)', marginBottom:5 }}>{r.condition}</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {r.actions.slice(0,2).map((a,i) => (
                        <span key={i} className="tag" style={{ background:col+'12', color:col, border:`1px solid ${col}25`, fontSize:10 }}>{a}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RBAC VIEW ─────────────────────────────────────────────────────────────────
export function RBACView() {
  const { roles } = useStore();
  const allPerms = [
    'workload:view:own','workload:view:team','workload:view:all','workload:export',
    'workload:edit:own','workload:edit:team','task:assign','team:manage',
    'analytics:view:basic','analytics:view:advanced','analytics:view:predictive',
    'fuzzy:configure','ml:retrain','admin:users:manage','admin:audit:view',
    'checkpoint:create','checkpoint:restore','checkpoint:delete',
  ];
  const hasAll = (role: typeof roles[0]) => {
    const all = new Set([...role.permissions,...(role.inheritsFrom??[]).flatMap(pid=>roles.find(r=>r.id===pid)?.permissions??[])]);
    return (p: string) => all.has(p);
  };
  return (
    <div className="view-body">
      <div className="panel reveal">
        <div className="panel-hd">
          <div className="panel-title">Permission matrix</div>
          <span className="panel-sub">6 roles · 25+ permissions · inheritance</span>
        </div>
        <div className="panel-body" style={{ overflowX: 'auto' }}>
          <table className="perm-table">
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>Permission</th>
                {roles.map(r => <th key={r.id}><span style={{ color:r.color }}>{r.name.split(' ')[0]}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {allPerms.map(perm => (
                <tr key={perm}>
                  <td style={{ textAlign:'left', fontFamily:'var(--mono)', fontSize:11, color:'var(--muted)' }}>{perm}</td>
                  {roles.map(r => { const ok=hasAll(r)(perm); return <td key={r.id} className={ok?'perm-check':'perm-x'}>{ok?'✓':'·'}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {roles.map(r => (
          <div key={r.id} className="panel reveal">
            <div className="panel-hd">
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:r.color }}/>
                <span style={{ fontSize:12, fontWeight:600, color:r.color }}>{r.name}</span>
              </div>
            </div>
            <div className="panel-body">
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8, lineHeight:1.5 }}>{r.description}</div>
              {r.inheritsFrom && <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--accent)', marginBottom:8 }}>extends: {r.inheritsFrom.join(', ')}</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {r.permissions.slice(0,5).map(p => <span key={p} className="tag" style={{ background:r.color+'12', color:r.color, border:`1px solid ${r.color}25`, fontSize:10 }}>{p.split(':').pop()}</span>)}
                {r.permissions.length>5 && <span className="tag" style={{ background:'var(--surface3)', color:'var(--muted)', borderColor:'var(--border)', fontSize:10 }}>+{r.permissions.length-5}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AUDIT VIEW ─────────────────────────────────────────────────────────────────
export function AuditView() {
  const { auditEvents, refreshAudit } = useStore();
  const lCol: Record<string,string> = { info:'#1a56db', warning:'#b54708', critical:'#b42318' };
  return (
    <div className="view-body">
      <div className="panel reveal">
        <div className="panel-hd">
          <div className="panel-title">Immutable SOC2 audit stream</div>
          <button className="btn btn-sm" onClick={refreshAudit}>Refresh</button>
        </div>
        <div className="panel-body">
          {auditEvents.map(ev => (
            <div key={ev.id} className="audit-row">
              <div className="audit-dot" style={{ background:lCol[ev.level]||'var(--muted)' }}/>
              <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--muted)', whiteSpace:'nowrap', width:58, flexShrink:0 }}>{fmtTimeAgo(ev.timestamp)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{ev.action}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{ev.userName} · {ev.resourceType} · {JSON.stringify(ev.details).slice(0,60)}</div>
              </div>
              <span className="badge" style={{ background:lCol[ev.level]+'18'||'var(--surface3)', color:lCol[ev.level]||'var(--muted)', border:`1px solid ${lCol[ev.level]||'var(--border)'}30`, fontSize:10 }}>{ev.level}</span>
            </div>
          ))}
          {auditEvents.length === 0 && <div style={{ fontSize:13, color:'var(--muted)', textAlign:'center', padding:20 }}>No audit events yet</div>}
        </div>
      </div>
    </div>
  );
}

// ── CHECKPOINTS VIEW ──────────────────────────────────────────────────────────
export function CheckpointsView() {
  const { checkpoints, saveCheckpoint, restoreCheckpoint, deleteCheckpoint } = useStore();
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    await saveCheckpoint(label.trim());
    setLabel('');
    setSaving(false);
  };

  const fmtSize = (b: number) => b > 1000 ? `${(b/1000).toFixed(1)}KB` : `${b}B`;

  return (
    <div className="view-body">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd"><div className="panel-title">Save checkpoint</div></div>
            <div className="panel-body">
              <div style={{ display:'flex', gap:8 }}>
                <input type="text" value={label} onChange={e=>setLabel(e.target.value)}
                  placeholder="e.g. Sprint14-EOD"
                  style={{ flex:1, background:'#fff', border:'1px solid var(--border2)', color:'var(--text)', padding:'8px 12px', borderRadius:8, fontFamily:'var(--mono)', fontSize:12, outline:'none' }}
                  onFocus={e=>{e.target.style.borderColor='var(--accent)';}} onBlur={e=>{e.target.style.borderColor='var(--border2)';}}/>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving||!label.trim()}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:7, fontFamily:'var(--mono)' }}>Rotation policy: 50 manual · 10 auto · Full state snapshot</div>
            </div>
          </div>

          <div className="panel reveal d1">
            <div className="panel-hd"><div className="panel-title">Snapshots ({checkpoints.length})</div></div>
            <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {checkpoints.length === 0 && <div style={{ fontSize:13, color:'var(--muted)', textAlign:'center', padding:16 }}>No checkpoints saved yet</div>}
              {checkpoints.map((cp:any) => (
                <div key={cp.id} className="cp-item">
                  <div style={{ width:32, height:32, borderRadius:7, background:'var(--surface3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14, color:'var(--muted)' }}>
                    {cp.type==='auto'?'A':cp.type==='incremental'?'I':'M'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{cp.label}</div>
                    <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--muted)', marginTop:2 }}>{fmtTimeAgo(cp.timestamp)} · {fmtSize(cp.size)} · {cp.type}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-sm" onClick={()=>restoreCheckpoint(cp.id)}>Restore</button>
                    <button className="btn btn-sm btn-danger" onClick={()=>deleteCheckpoint(cp.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel reveal">
            <div className="panel-hd"><div className="panel-title">Backup strategy</div></div>
            <div className="panel-body">
              {[
                { abbr:'M', title:'Manual', desc:'Save on demand. Max 50 retained. Recommended at end of each sprint and before major changes.', col:'#1a56db' },
                { abbr:'A', title:'Automatic', desc:'System auto-saves before destructive operations. Max 10 retained.', col:'#5925dc' },
                { abbr:'I', title:'Incremental', desc:'Hourly deltas of changed parameters. Enables fine-grained rollback. Max 100 retained.', col:'#067647' },
              ].map(s => (
                <div key={s.title} style={{ display:'flex', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:32, height:32, borderRadius:7, background:s.col+'12', border:`1px solid ${s.col}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:700, color:s.col }}>{s.abbr}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:s.col, marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
