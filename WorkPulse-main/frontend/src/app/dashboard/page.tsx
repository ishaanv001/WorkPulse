'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../store';
import Gauge from '../../components/common/Gauge';
import Sparkline from '../../components/common/Sparkline';
import { scoreColor, levelColor, levelBg, levelBd, alertColor, alertBg, alertBd, trendLabel, trendColor, formatNumber, fmtTimeAgo } from '../../utils/colors';
import { PARAMS, CATEGORIES, getVal, setVal } from '../../utils/params';
import { FuzzyView, MLView, MembersView, ForecastView, AlertsView, RBACView, AuditView, CheckpointsView } from '../../components/panels/Views';

type ViewId = 'dashboard'|'fuzzy'|'ml'|'members'|'forecast'|'alerts'|'rbac'|'audit'|'checkpoints'|'ratelimits';

export default function DashboardPage() {
  const { user } = useAuth();
  const store = useStore();
  const [view, setView] = useState<ViewId>('dashboard');
  const [paramTab, setParamTab] = useState('individual');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get('view') as ViewId;
    if (v) setView(v);
  }, []);

  if (!user) return null;
  const { team, predictions, forecasts, alerts, metrics, selectedId, selectMember, runAll, fusionConfig, setFusion, updateInputs } = store;

  const member = team.find(m => m.id === selectedId) || team[0];
  const pred = member ? predictions[member.id] : null;
  const forecast = member ? forecasts[member.id] : null;
  const catParams = PARAMS.filter(p => p.category === paramTab);
  const topShap = pred?.shapValues.slice(0, 8) ?? [];
  const maxShap = Math.max(...topShap.map(s => Math.abs(s.value)), 0.01);
  const topRules = pred?.mamdani.firedRules.slice(0, 6) ?? [];
  const activeAlerts = alerts.filter(a => !a.dismissed).slice(0, 4);

  const handleSlider = async (p: typeof PARAMS[0], val: number) => {
    if (!member) return;
    setUpdating(true);
    await updateInputs(member.id, setVal(member.inputs, p.path, val));
    setUpdating(false);
  };

  const SUBTABS = [
    { k: 'dashboard', l: 'Overview' }, { k: 'fuzzy', l: 'Fuzzy Engine' },
    { k: 'ml', l: 'ML Engine' }, { k: 'members', l: 'Members' },
    { k: 'forecast', l: 'Forecasting' }, { k: 'alerts', l: 'Alerts' },
    ...(user.role === 'admin' ? [{ k: 'rbac', l: 'RBAC' }, { k: 'checkpoints', l: 'Checkpoints' }, { k: 'audit', l: 'Audit Log' }] : []),
  ];

  const viewMap: Partial<Record<ViewId, React.ReactNode>> = {
    fuzzy: <FuzzyView/>, ml: <MLView/>, members: <MembersView/>,
    forecast: <ForecastView/>, alerts: <AlertsView/>, rbac: <RBACView/>,
    audit: <AuditView/>, checkpoints: <CheckpointsView/>,
  };

  return (
    <AppShell activePath="/dashboard">
      {/* Sub-nav */}
      <div className="tabs" style={{ padding: '0 22px', background: '#fff', position: 'sticky', top: 0, zIndex: 9 }}>
        {SUBTABS.map(t => (
          <div key={t.k} className={`tab${view === t.k ? ' active' : ''}`} onClick={() => setView(t.k as ViewId)}>{t.l}</div>
        ))}
      </div>

      {view !== 'dashboard' ? (viewMap[view] ?? null) : (
        <>
          {/* Page header */}
          <div className="page-hd">
            <div>
              <div className="page-title">Team Intelligence</div>
              <div className="page-sub">Hybrid fuzzy + neural ensemble · Sprint 14 · {new Date().toLocaleDateString()}</div>
            </div>
            <div className="hd-actions">
              <button className="btn" onClick={() => runAll()}>Recalculate all</button>
              <button className="btn btn-primary">Export report</button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="kpi-strip">
            {[
              {
                lbl: 'Team avg score', val: `${formatNumber(metrics?.avgScore ?? 0)}`,
                delta: '+4.2 vs prev sprint', dn: true, col: scoreColor(metrics?.avgScore ?? 0),
                tt: { 'Mamdani avg': formatNumber((metrics?.avgScore ?? 0) * 1.02), 'Sugeno avg': formatNumber((metrics?.avgScore ?? 0) * .98), 'Trend': 'Worsening', 'Last sprint': formatNumber((metrics?.avgScore ?? 0) - 4.2) }
              },
              {
                lbl: 'Burnout risk', val: `${metrics?.burnoutCount ?? 0}`,
                delta: `of ${metrics?.teamSize ?? 0} members`, dn: true, col: '#b42318',
                tt: { 'Critical (>85)': '1', 'High (76–85)': '0', 'Action needed': 'Yes', 'ETA without action': '3 days' }
              },
              {
                lbl: 'Avg confidence', val: `${formatNumber(metrics?.avgConfidence ?? 0)}%`,
                delta: '+3% vs baseline', col: '#067647',
                tt: { 'SHAP features': '17', 'NN calibration': '91.2%', 'Rule base': `${metrics?.ruleBaseSize ?? 55} rules`, 'Model': 'Hybrid v2.0' }
              },
              {
                lbl: 'Rules fired', val: `${metrics?.totalRulesFired ?? 0}`,
                delta: `of ${metrics?.ruleBaseSize ?? 55} total`, col: '#1a56db',
                tt: { 'Burnout rules': '10', 'Overload rules': '12', 'Normal rules': '10', 'Safety rules': '8' }
              },
            ].map((k, i) => (
              <div key={i} className="kpi reveal" style={{ '--kpi-col': k.col, animationDelay: `${i * .06}s` } as any}>
                <div className="kpi-lbl">{k.lbl}</div>
                <div className="kpi-val">{k.val}</div>
                <div className={`kpi-delta${k.dn ? ' delta-dn' : ' delta-up'}`}>{k.delta}</div>
                <div className="kpi-tooltip">
                  <div className="kpi-tooltip-title">{k.lbl}</div>
                  {Object.entries(k.tt).map(([l, v]) => (
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
            <div className="grid-2">
              {/* LEFT */}
              <div className="col">
                {/* Team table */}
                <div className="panel reveal">
                  <div className="panel-hd">
                    <div className="panel-title">Team workload matrix</div>
                    <button className="btn btn-sm btn-primary" onClick={() => runAll()}>Recalculate</button>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Member</th><th>Score</th><th>Level</th><th>Tasks</th><th>Trend</th><th>7-day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.map(m => {
                        const p = predictions[m.id];
                        if (!p) return null;
                        return (
                          <tr key={m.id} className={`member-row-hov${selectedId === m.id ? ' sel-row' : ''}`} onClick={() => selectMember(m.id)}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div className="av" style={{ width: 28, height: 28, background: m.color, fontSize: 10 }}>{m.avatar}</div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.role}</div>
                                </div>
                              </div>
                              {/* Hover card */}
                              <div className="member-hover-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                                  <div className="av" style={{ width: 34, height: 34, background: m.color, fontSize: 12 }}>{m.avatar}</div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.role}</div>
                                  </div>
                                </div>
                                {[
                                  ['Score', formatNumber(p.score)], ['Level', p.level],
                                  ['Confidence', `${formatNumber(p.confidence, 0)}%`], ['Tasks', String(m.inputs.individual.activeTasks)],
                                  ['Stress', `${m.inputs.wellbeing.selfReportedStress}/10`], ['Bus factor', String(m.inputs.team.busFactor)],
                                ].map(([l, v]) => (
                                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l}</span>
                                    <span style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>{v}</span>
                                  </div>
                                ))}
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Skills</div>
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {m.skills.map(s => (
                                      <span key={s} className="tag" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-bd)' }}>{s}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="wl-wrap">
                                <div className="wl-bg"><div className="wl-fill" style={{ width: `${p.score}%`, background: scoreColor(p.score) }}/></div>
                                <div className="wl-num" style={{ color: scoreColor(p.score) }}>{formatNumber(p.score, 0)}</div>
                              </div>
                            </td>
                            <td>
                              <span className="badge" style={{ background: levelBg(p.level), color: levelColor(p.level), border: `1px solid ${levelBd(p.level)}` }}>{p.level}</span>
                            </td>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{m.inputs.individual.activeTasks}</td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 600, color: trendColor(p.predictedTrend) }}>
                                {trendLabel(p.predictedTrend)}
                              </span>
                            </td>
                            <td><Sparkline values={m.history.slice(-7)} width={50} height={22} color={scoreColor(p.score)}/></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Parameter sliders */}
                {member && (
                  <div className="panel reveal d1">
                    <div className="chips">
                      {team.map(m => (
                        <div key={m.id} className={`chip${selectedId === m.id ? ' sel' : ''}`}
                          style={{ borderColor: selectedId === m.id ? m.color : '' }}
                          onClick={() => selectMember(m.id)}>
                          {m.name.split(' ')[0]}
                        </div>
                      ))}
                      {updating && <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--mono)', alignSelf: 'center' }}>Updating...</span>}
                    </div>
                    <div className="tabs">
                      {CATEGORIES.map(c => (
                        <div key={c.key} className={`tab${paramTab === c.key ? ' active' : ''}`} onClick={() => setParamTab(c.key)}>
                          {c.label} <span style={{ fontSize: 10, opacity: .6 }}>({c.count})</span>
                        </div>
                      ))}
                    </div>
                    <div className="panel-body">
                      <div className="params-grid">
                        {catParams.map(p => {
                          const val = getVal(member.inputs, p.path);
                          return (
                            <div key={p.key} className="param-row">
                              <div className="param-lbl">
                                {p.label}
                                <span className="param-val">{formatNumber(val, p.step < 1 ? 1 : 0)}{p.unit}</span>
                              </div>
                              <input type="range" min={p.min} max={p.max} step={p.step} defaultValue={val}
                                onMouseUp={e => handleSlider(p, parseFloat((e.target as HTMLInputElement).value))}/>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Forecast */}
                {forecast && (
                  <div className="panel reveal d2">
                    <div className="panel-hd">
                      <div className="panel-title">7-day forecast — {member?.name}</div>
                      <span className="panel-sub">{forecast.model} · MAE {forecast.mae}</span>
                    </div>
                    <div className="panel-body">
                      {forecast.points.map((pt: any, i: number) => (
                        <div key={i} className="forecast-row">
                          <div className="forecast-day">{pt.date}</div>
                          <div className="forecast-bg"><div className="forecast-fill" style={{ width: `${pt.score}%`, background: scoreColor(pt.score) }}/></div>
                          <div className="forecast-val" style={{ color: scoreColor(pt.score) }}>{formatNumber(pt.score)}</div>
                          <div className="forecast-ci">±{formatNumber(pt.upper - pt.score)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fusion config */}
                <div className="panel reveal d3">
                  <div className="panel-hd">
                    <div className="panel-title">Engine fusion config</div>
                    <span className="panel-sub">{fusionConfig.strategy}</span>
                  </div>
                  <div className="panel-body">
                    <div className="params-grid">
                      {[
                        { lbl: 'Mamdani weight', key: 'mamdaniWeight' as const, col: '#1a56db' },
                        { lbl: 'Sugeno weight', key: 'sugenoWeight' as const, col: '#5925dc' },
                        { lbl: 'Neural net weight', key: 'nnWeight' as const, col: '#067647' },
                      ].map(f => (
                        <div key={f.key} className="param-row">
                          <div className="param-lbl">
                            {f.lbl}
                            <span style={{ color: f.col, fontFamily: 'var(--mono)', fontSize: 11 }}>{formatNumber(fusionConfig[f.key] * 100, 0)}%</span>
                          </div>
                          <input type="range" min={0} max={100} step={5} defaultValue={fusionConfig[f.key] * 100}
                            onMouseUp={e => setFusion({ [f.key]: parseFloat((e.target as HTMLInputElement).value) / 100 })}/>
                        </div>
                      ))}
                      <div className="param-row">
                        <div className="param-lbl">Strategy</div>
                        <select className="sel-input" style={{ marginTop: 4 }} value={fusionConfig.strategy}
                          onChange={e => setFusion({ strategy: e.target.value as any })}>
                          <option value="weighted_average">Weighted average</option>
                          <option value="contextual_switch">Contextual switch</option>
                          <option value="ensemble">Ensemble</option>
                          <option value="adaptive">Adaptive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              {pred && (
                <div className="col">
                  {/* Inference gauge */}
                  <div className="panel reveal">
                    <div className="panel-hd">
                      <div className="panel-title">Hybrid inference result</div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{member?.name}</span>
                    </div>
                    <div className="panel-body">
                      <div className="gauge-wrap">
                        <Gauge score={pred.score} size={176}/>
                        <div style={{ textAlign: 'center' }}>
                          <div className="gauge-score-num" style={{ color: levelColor(pred.level) }}>{formatNumber(pred.score)}</div>
                          <div className="gauge-score-lbl">Workload score</div>
                        </div>
                        <span className="badge" style={{ background: levelBg(pred.level), color: levelColor(pred.level), border: `1px solid ${levelBd(pred.level)}`, fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>
                          {pred.level}
                        </span>
                        <div className="gauge-grid" style={{ width: '100%' }}>
                          {[
                            { lbl: 'Mamdani', val: formatNumber(pred.mamdani.score), col: '#1a56db', tip: 'Centroid defuzz · 200pt' },
                            { lbl: 'Sugeno', val: formatNumber(pred.sugeno.score), col: '#5925dc', tip: 'Gaussian antecedents' },
                            { lbl: 'Neural net', val: formatNumber(pred.neuralNet.score), col: '#067647', tip: '4-layer DNN · sigmoid out' },
                            { lbl: 'Confidence', val: `${formatNumber(pred.confidence, 0)}%`, col: '#b54708', tip: pred.confidenceLevel },
                          ].map(s => (
                            <div key={s.lbl} className="gauge-stat" title={s.tip}>
                              <div className="gauge-stat-lbl">{s.lbl}</div>
                              <div className="gauge-stat-val" style={{ color: s.col }}>{s.val}</div>
                            </div>
                          ))}
                        </div>

                        {/* Membership bars */}
                        <div style={{ width: '100%', marginTop: 8 }}>
                          <div className="section-hd">Membership degrees</div>
                          {[
                            { lbl: 'Normal', val: pred.mamdani.membership.veryLow, col: '#067647' },
                            { lbl: 'Manageable', val: pred.mamdani.membership.low, col: '#3d9a6e' },
                            { lbl: 'Busy', val: pred.mamdani.membership.medium, col: '#b54708' },
                            { lbl: 'Overloaded', val: pred.mamdani.membership.high, col: '#c4320a' },
                            { lbl: 'Burnout risk', val: pred.mamdani.membership.veryHigh, col: '#b42318' },
                          ].map(m => (
                            <div key={m.lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <div style={{ width: 76, fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{m.lbl}</div>
                              <div className="wl-bg" style={{ flex: 1 }}><div className="wl-fill" style={{ width: `${m.val * 100}%`, background: m.col }}/></div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: m.col, width: 32, textAlign: 'right' }}>{formatNumber(m.val * 100, 0)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SHAP */}
                  <div className="panel reveal d1">
                    <div className="panel-hd">
                      <div className="panel-title">SHAP feature impact</div>
                      <span className="panel-sub">Kernel SHAP · 17 features</span>
                    </div>
                    <div className="panel-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11, color: 'var(--muted)' }}>
                        <span>Reducing load</span>
                        <span>Increasing load</span>
                      </div>
                      {topShap.map(s => {
                        const pct = Math.abs(s.value) / maxShap * 45;
                        const col = s.direction === 'increasing' ? '#b42318' : '#067647';
                        return (
                          <div key={s.featureName} className="shap-row" title={`${s.featureName}: ${s.value >= 0 ? '+' : ''}${formatNumber(s.value, 3)}`}>
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
                            <div className="shap-val" style={{ color: col }}>{s.value >= 0 ? '+' : ''}{formatNumber(s.value, 2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top fired rules */}
                  <div className="panel reveal d2">
                    <div className="panel-hd">
                      <div className="panel-title">Top fired rules</div>
                      <span className="panel-sub">{pred.mamdani.firedRules.length} fired of 55</span>
                    </div>
                    <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topRules.map(r => {
                        const col = r.impact > 10 ? '#b42318' : r.impact > 5 ? '#c4320a' : r.impact > 0 ? '#b54708' : '#067647';
                        return (
                          <div key={r.id} title={`ID: ${r.id} · Strength: ${formatNumber(r.strength, 3)} · Category: ${r.category}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface3)', cursor: 'help' }}>
                            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', flexShrink: 0, overflow: 'hidden' }}>
                              <div style={{ width: `${r.strength * 100}%`, height: '100%', background: col, borderRadius: 2 }}/>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', flex: 1, lineHeight: 1.4 }}>{r.rule}</div>
                            <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: col, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.impact > 0 ? '+' : ''}{formatNumber(r.impact)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="panel reveal d3">
                    <div className="panel-hd">
                      <div className="panel-title">Escalation alerts</div>
                      {activeAlerts.length > 0 && (
                        <span className="nav-badge nb-red" style={{ margin: 0 }}>{activeAlerts.length}</span>
                      )}
                    </div>
                    <div className="panel-body">
                      <div className="alert-list">
                        {activeAlerts.length === 0 && (
                          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '14px 0' }}>No active alerts</div>
                        )}
                        {activeAlerts.map(a => (
                          <div key={a.id} className="alert-card" style={{ background: alertBg(a.severity), borderColor: alertColor(a.severity) }}>
                            <div className="alert-indicator" style={{ background: alertColor(a.severity) }}/>
                            <div className="alert-body-wrap">
                              <div className="alert-card-title">{a.title}</div>
                              <div className="alert-card-desc">{a.body}</div>
                              {a.recommendedActions.length > 0 && (
                                <div className="alert-actions">
                                  {a.recommendedActions.slice(0, 2).map((act, i) => (
                                    <span key={i} className="alert-tag" style={{ background: alertColor(a.severity) + '18', color: alertColor(a.severity), border: `1px solid ${alertBd(a.severity)}` }}>{act}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="panel reveal d4">
                    <div className="panel-hd">
                      <div className="panel-title">AI recommendations</div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{member?.name}</span>
                    </div>
                    <div className="panel-body">
                      <div className="rec-list">
                        {pred.recommendations.map((rec, i) => (
                          <div key={i} className="rec-item">
                            <div className="rec-dot"/>
                            <span className="rec-text">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
