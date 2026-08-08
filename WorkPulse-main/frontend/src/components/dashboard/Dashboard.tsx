'use client';
import { useState } from 'react';
import { useStore } from '../../store';
import Gauge from '../common/Gauge';
import Sparkline from '../common/Sparkline';
import { scoreColor, levelColor, levelBg, alertColor, alertBg, trendIcon, trendColor, formatNumber } from '../../utils/colors';
import { PARAMS, CATEGORIES, getVal, setVal } from '../../utils/params';

export default function Dashboard() {
  const { team, predictions, forecasts, alerts, metrics, selectedId, selectMember, runAll, fusionConfig, setFusion, updateInputs } = useStore();
  const [paramTab, setParamTab] = useState('individual');
  const [updating, setUpdating] = useState(false);

  const member = team.find(m => m.id === selectedId) || team[0];
  const pred = member ? predictions[member.id] : null;
  const forecast = member ? forecasts[member.id] : null;

  if (!member || !pred) return <div style={{ padding: 24, color: 'var(--muted)' }}>Loading data...</div>;

  const catParams = PARAMS.filter(p => p.category === paramTab);
  const topShap = pred.shapValues.slice(0, 8);
  const maxShap = Math.max(...topShap.map(s => Math.abs(s.value)), 0.01);
  const topRules = pred.mamdani.firedRules.slice(0, 6);
  const critAlerts = alerts.filter(a => !a.dismissed).slice(0, 4);

  const handleSlider = async (p: typeof PARAMS[0], val: number) => {
    if (!member) return;
    setUpdating(true);
    const newInputs = setVal(member.inputs, p.path, val);
    await updateInputs(member.id, newInputs);
    setUpdating(false);
  };

  return (
    <div>
      {/* KPI Strip */}
      <div className="kpi-strip">
        {[
          { lbl:'Team Avg Score', val:`${formatNumber(metrics?.avgScore ?? 0)}`, delta:'+4.2 vs prev', dn:true, col:scoreColor(metrics?.avgScore ?? 0) },
          { lbl:'Burnout Risk', val:`${metrics?.burnoutCount ?? 0}`, delta:`of ${metrics?.teamSize ?? 0} members`, dn:true, col:'#ef4444' },
          { lbl:'Avg Confidence', val:`${formatNumber(metrics?.avgConfidence ?? 0)}%`, delta:'+3% accuracy', col:'#10b981' },
          { lbl:'Rules Fired', val:`${metrics?.totalRulesFired ?? 0}`, delta:`of ${metrics?.ruleBaseSize ?? 55} rule base`, col:'#00d9ff' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ '--kpi-col': k.col } as any}>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-val">{k.val}</div>
            <div className={`kpi-delta${k.dn ? ' dn' : ' up'}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="view-body">
        <div className="content-grid">
          {/* LEFT COLUMN */}
          <div className="col">

            {/* Team Matrix */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">◉ Team Workload Matrix</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="panel-sub">HYBRID FUZZY · SUGENO+MAMDANI</span>
                  <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => runAll()}>↻ Run All</button>
                </div>
              </div>
              <div style={{ padding: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Workload Score</th>
                      <th>Level</th>
                      <th>Tasks</th>
                      <th>Trend</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(m => {
                      const p = predictions[m.id];
                      if (!p) return null;
                      return (
                        <tr key={m.id} className={selectedId === m.id ? 'sel' : ''} onClick={() => selectMember(m.id)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="av" style={{ background: m.color + '22', color: m.color }}>{m.avatar}</div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{m.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.role}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="wl-wrap">
                              <div className="wl-bg">
                                <div className="wl-fill" style={{ width: `${p.score}%`, background: scoreColor(p.score) }}/>
                              </div>
                              <div className="wl-num" style={{ color: scoreColor(p.score) }}>{formatNumber(p.score, 0)}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: levelBg(p.level), color: levelColor(p.level) }}>{p.level}</span>
                          </td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{m.inputs.individual.activeTasks}</td>
                          <td>
                            <span style={{ color: trendColor(p.predictedTrend), fontSize: 13, fontWeight: 700 }}>{trendIcon(p.predictedTrend)}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Sparkline values={m.history.slice(-7)} width={48} height={20} color={scoreColor(p.score)}/>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{formatNumber(p.confidence, 0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="panel">
              <div className="chips">
                {team.map(m => (
                  <div key={m.id} className={`chip${selectedId === m.id ? ' sel' : ''}`} onClick={() => selectMember(m.id)}>
                    {m.avatar}
                  </div>
                ))}
                {updating && <span style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'var(--mono)', alignSelf: 'center' }}>Updating...</span>}
              </div>
              <div className="tabs">
                {CATEGORIES.map(cat => (
                  <div key={cat.key} className={`tab${paramTab === cat.key ? ' active' : ''}`} onClick={() => setParamTab(cat.key)}>
                    {cat.label}
                  </div>
                ))}
              </div>
              <div className="params-grid">
                {catParams.map(p => {
                  const val = getVal(member.inputs, p.path);
                  return (
                    <div key={p.key} className="param-row">
                      <div className="param-lbl">
                        {p.label}
                        <span className="param-val">{formatNumber(val, p.step < 1 ? 1 : 0)}{p.unit}</span>
                      </div>
                      <input type="range" min={p.min} max={p.max} step={p.step}
                        defaultValue={val}
                        onMouseUp={e => handleSlider(p, parseFloat((e.target as HTMLInputElement).value))}
                        onTouchEnd={e => handleSlider(p, parseFloat((e.target as HTMLInputElement).value))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Forecast */}
            {forecast && (
              <div className="panel">
                <div className="panel-hd">
                  <div className="panel-title">✦ Predictive Workload Forecast — {member.name}</div>
                  <span className="panel-sub">{forecast.model} · MAE {forecast.mae}</span>
                </div>
                <div className="panel-body">
                  {forecast.points.map((pt, i) => (
                    <div key={i} className="forecast-row">
                      <div className="forecast-day">{pt.date}</div>
                      <div className="forecast-bg">
                        <div className="forecast-fill" style={{ width: `${pt.score}%`, background: scoreColor(pt.score) }}/>
                      </div>
                      <div className="forecast-val" style={{ color: scoreColor(pt.score) }}>{formatNumber(pt.score)}</div>
                      <div className="forecast-ci">±{formatNumber(pt.upper - pt.score)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fusion Config */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">⚙ Fusion Configuration</div>
                <span className="panel-sub">{fusionConfig.strategy}</span>
              </div>
              <div className="panel-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { lbl: 'Mamdani Weight', key: 'mamdaniWeight' as const, color: '#00d9ff' },
                    { lbl: 'Sugeno Weight', key: 'sugenoWeight' as const, color: '#6c63ff' },
                    { lbl: 'Neural Net Weight', key: 'nnWeight' as const, color: '#10b981' },
                  ].map(f => (
                    <div key={f.key} className="param-row">
                      <div className="param-lbl">
                        {f.lbl}
                        <span style={{ color: f.color, fontFamily: 'var(--mono)', fontSize: 11 }}>
                          {formatNumber(fusionConfig[f.key] * 100, 0)}%
                        </span>
                      </div>
                      <input type="range" min={0} max={100} step={5}
                        defaultValue={fusionConfig[f.key] * 100}
                        onMouseUp={e => setFusion({ [f.key]: parseFloat((e.target as HTMLInputElement).value) / 100 })}
                      />
                    </div>
                  ))}
                  <div className="param-row">
                    <div className="param-lbl">Strategy</div>
                    <select className="sel-input" style={{ marginTop: 4 }}
                      value={fusionConfig.strategy}
                      onChange={e => setFusion({ strategy: e.target.value as any })}>
                      <option value="weighted_average">Weighted Average</option>
                      <option value="contextual_switch">Contextual Switch</option>
                      <option value="ensemble">Ensemble</option>
                      <option value="adaptive">Adaptive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col">
            {/* Hybrid Inference Gauge */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">◈ Hybrid Inference Result</div>
                <span className="panel-sub">{pred.fusionConfig.strategy}</span>
              </div>
              <div className="panel-body">
                <div className="gauge-wrap">
                  <Gauge score={pred.score} size={180}/>
                  <div style={{ textAlign: 'center' }}>
                    <div className="gauge-score-num" style={{ color: levelColor(pred.level) }}>
                      {formatNumber(pred.score)}
                    </div>
                    <div className="gauge-score-lbl">Workload Score</div>
                  </div>
                  <span className="badge" style={{ background: levelBg(pred.level), color: levelColor(pred.level), fontSize: 11, padding: '4px 16px', borderRadius: 20 }}>
                    {pred.level}
                  </span>
                  <div className="gauge-detail" style={{ width: '100%' }}>
                    {[
                      { lbl: 'Mamdani', val: formatNumber(pred.mamdani.score), col: '#00d9ff' },
                      { lbl: 'Sugeno', val: formatNumber(pred.sugeno.score), col: '#6c63ff' },
                      { lbl: 'Neural Net', val: formatNumber(pred.neuralNet.score), col: '#10b981' },
                      { lbl: 'Confidence', val: `${formatNumber(pred.confidence, 0)}%`, col: '#ffb300' },
                    ].map(s => (
                      <div key={s.lbl} className="gauge-stat">
                        <div className="gauge-stat-lbl">{s.lbl}</div>
                        <div className="gauge-stat-val" style={{ color: s.col }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Membership bars */}
                  <div style={{ width: '100%', marginTop: 8 }}>
                    <div className="section-hd" style={{ marginBottom: 6 }}>Membership Degrees</div>
                    {[
                      { lbl: 'Very Low (Normal)', val: pred.mamdani.membership.veryLow, col: '#10b981' },
                      { lbl: 'Low (Manageable)', val: pred.mamdani.membership.low, col: '#6cb36c' },
                      { lbl: 'Medium (Busy)', val: pred.mamdani.membership.medium, col: '#ffb300' },
                      { lbl: 'High (Overloaded)', val: pred.mamdani.membership.high, col: '#f97316' },
                      { lbl: 'Very High (Burnout)', val: pred.mamdani.membership.veryHigh, col: '#ef4444' },
                    ].map(m => (
                      <div key={m.lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{ width: 110, fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{m.lbl}</div>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${m.val * 100}%`, height: '100%', background: m.col, borderRadius: 2 }}/>
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: m.col, width: 32, textAlign: 'right' }}>
                          {formatNumber(m.val * 100, 0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SHAP */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">⊕ SHAP Feature Impact</div>
                <span className="panel-sub">Kernel SHAP · XAI</span>
              </div>
              <div className="panel-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>← Reducing</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Increasing →</span>
                </div>
                {topShap.map(s => {
                  const pct = Math.abs(s.value) / maxShap * 45;
                  const col = s.direction === 'increasing' ? '#ef4444' : '#10b981';
                  return (
                    <div key={s.featureName} className="shap-row">
                      <div className="shap-name">{s.featureName}</div>
                      <div className="shap-bars">
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                          {s.direction === 'decreasing' && (
                            <div className="shap-bar" style={{ width: `${pct}%`, background: col }}/>
                          )}
                        </div>
                        <div className="shap-center"/>
                        <div style={{ flex: 1 }}>
                          {s.direction === 'increasing' && (
                            <div className="shap-bar" style={{ width: `${pct}%`, background: col }}/>
                          )}
                        </div>
                      </div>
                      <div className="shap-val" style={{ color: col }}>
                        {s.value >= 0 ? '+' : ''}{formatNumber(s.value, 2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fired Rules */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">⬡ Top Fired Rules</div>
                <span className="panel-sub">{pred.mamdani.firedRules.length} fired</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topRules.map(r => {
                  const col = r.impact > 10 ? '#ef4444' : r.impact > 5 ? '#f97316' : r.impact > 0 ? '#ffb300' : '#10b981';
                  return (
                    <div key={r.id} className="rule-item">
                      <div className="rule-bar-bg">
                        <div className="rule-bar-fill" style={{ width: `${r.strength * 100}%`, background: col }}/>
                      </div>
                      <div className="rule-txt">{r.rule}</div>
                      <div className="rule-impact" style={{ color: col }}>{r.impact > 0 ? '+' : ''}{formatNumber(r.impact)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">⚠ Escalation Alerts</div>
                <span className="nav-badge red" style={{ marginLeft: 0 }}>{critAlerts.length}</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {critAlerts.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>No active alerts ✓</div>}
                {critAlerts.map(a => (
                  <div key={a.id} className="alert-item" style={{ background: alertBg(a.severity), borderColor: alertColor(a.severity) }}>
                    <div>
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-body">{a.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">◈ AI Recommendations</div>
                <span className="panel-sub">{member.name}</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pred.recommendations.map((rec, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6,
                    padding: '6px 10px', background: 'rgba(255,255,255,.03)',
                    borderRadius: 6, border: '1px solid var(--border)' }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
