'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../store';
import Gauge from '../../components/common/Gauge';
import { scoreColor, levelColor, levelBg, levelBd, alertColor, alertBg, alertBd, trendLabel, trendColor, formatNumber, fmtTimeAgo } from '../../utils/colors';
import { PARAMS, CATEGORIES, getVal, setVal } from '../../utils/params';

export default function MemberPage() {
  const { user } = useAuth();
  const { team, predictions, forecasts, alerts, updateInputs, init } = useStore();
  const [paramTab, setParamTab] = useState('individual');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview'|'inputs'|'forecast'|'alerts'>('overview');

  useEffect(() => { init(); }, []);

  const myMember = user?.memberId ? team.find(m => m.id === user.memberId) ?? team[0] : team[0];
  const member = myMember;
  const pred = member ? predictions[member.id] : null;
  const forecast = member ? forecasts[member.id] : null;
  const myAlerts = alerts.filter(a => a.memberId === member?.id && !a.dismissed);
  const topShap = pred?.shapValues.slice(0, 6) ?? [];
  const maxShap = Math.max(...topShap.map(s => Math.abs(s.value)), 0.01);
  const catParams = PARAMS.filter(p => p.category === paramTab);

  const handleSlider = async (p: typeof PARAMS[0], val: number) => {
    if (!member) return;
    setUpdating(true);
    await updateInputs(member.id, setVal(member.inputs, p.path, val));
    setUpdating(false);
  };

  if (!member || !pred) return (
    <AppShell activePath="/member">
      <div style={{ padding: 24, color: 'var(--muted)' }}>Loading your dashboard...</div>
    </AppShell>
  );

  return (
    <AppShell activePath="/member">
      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '24px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 20, gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div className="av" style={{ width: 48, height: 48, fontSize: 16, background: member.color, border: `2px solid ${member.color}` }}>{member.avatar}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>{member.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 1 }}>{member.role} · {user?.teamName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {member.skills.map(s => (
                <span key={s} className="tag" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-bd)' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 40, fontFamily: 'var(--mono)', fontWeight: 700, color: levelColor(pred.level), lineHeight: 1 }}>
              {formatNumber(pred.score, 0)}
            </div>
            <span className="badge" style={{ background: levelBg(pred.level), color: levelColor(pred.level), border: `1px solid ${levelBd(pred.level)}`, fontSize: 12, padding: '4px 12px', borderRadius: 20, marginTop: 5, display: 'inline-block' }}>
              {pred.level}
            </span>
            <div style={{ fontSize: 12, color: trendColor(pred.predictedTrend), marginTop: 5, fontWeight: 500 }}>
              {trendLabel(pred.predictedTrend)} trend
            </div>
          </div>
        </div>
        <div className="tabs" style={{ margin: '0 -22px', paddingLeft: 22 }}>
          {[['overview','Overview'],['inputs','My Inputs'],['forecast','Forecast'],['alerts','Alerts']].map(([k,l]) => (
            <div key={k} className={`tab${activeTab === k ? ' active' : ''}`} onClick={() => setActiveTab(k as any)}>
              {l}
              {k === 'alerts' && myAlerts.length > 0 && (
                <span className="nav-badge nb-red" style={{ marginLeft: 6 }}>{myAlerts.length}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="view-body">
        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="col">
              {/* Stats row */}
              <div className="grid-3">
                {[
                  { lbl: 'Active tasks', val: member.inputs.individual.activeTasks, col: scoreColor(member.inputs.individual.activeTasks * 10), tip: 'Tasks currently in progress' },
                  { lbl: 'Bus factor', val: member.inputs.team.busFactor, col: member.inputs.team.busFactor < 2 ? '#b42318' : '#067647', tip: 'People who can cover your work' },
                  { lbl: 'Focus blocks', val: `${member.inputs.wellbeing.focusTimeBlocks}h`, col: '#1a56db', tip: 'Daily deep work hours' },
                ].map((s, i) => (
                  <div key={i} className="stat reveal" title={s.tip}>
                    <div className="stat-lbl">{s.lbl}</div>
                    <div className="stat-val" style={{ color: s.col }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Wellbeing */}
              <div className="panel reveal d1">
                <div className="panel-hd"><div className="panel-title">Wellbeing snapshot</div></div>
                <div className="panel-body">
                  {[
                    { lbl: 'Self-reported stress', val: member.inputs.wellbeing.selfReportedStress, max: 10, inv: true },
                    { lbl: 'Sleep quality', val: member.inputs.wellbeing.sleepQuality, max: 10, inv: false },
                    { lbl: 'Exercise frequency', val: member.inputs.wellbeing.exerciseFrequency, max: 7, inv: false },
                    { lbl: 'Task satisfaction', val: member.inputs.wellbeing.taskSatisfaction, max: 100, inv: false },
                    { lbl: 'Career growth', val: member.inputs.wellbeing.careerGrowth, max: 100, inv: false },
                  ].map(item => {
                    const pct = (item.val / item.max) * 100;
                    const col = item.inv
                      ? (pct > 70 ? '#b42318' : pct > 40 ? '#b54708' : '#067647')
                      : (pct > 60 ? '#067647' : pct > 30 ? '#b54708' : '#b42318');
                    return (
                      <div key={item.lbl} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                          <span style={{ color: 'var(--text2)' }}>{item.lbl}</span>
                          <span style={{ fontFamily: 'var(--mono)', color: col, fontWeight: 600 }}>{item.val}{item.max === 10 ? '/10' : '%'}</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: col }}/></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History */}
              <div className="panel reveal d2">
                <div className="panel-hd"><div className="panel-title">14-day score history</div></div>
                <div className="panel-body">
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
                    {member.history.map((v, i) => (
                      <div key={i} title={`${formatNumber(v, 0)} workload`}
                        style={{ flex: 1, background: scoreColor(v), height: `${(v / 100) * 100}%`, borderRadius: '3px 3px 0 0', opacity: 0.4 + (i / member.history.length) * 0.6, minHeight: 2, cursor: 'help', transition: 'opacity .15s' }}
                        onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                        onMouseOut={e => (e.currentTarget.style.opacity = String(0.4 + (i / member.history.length) * 0.6))}/>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                    <span>14 days ago</span><span>today</span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="panel reveal d3">
                <div className="panel-hd"><div className="panel-title">AI recommendations</div></div>
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

            <div className="col">
              {/* Score gauge */}
              <div className="panel reveal">
                <div className="panel-hd"><div className="panel-title">Your workload score</div></div>
                <div className="panel-body">
                  <div className="gauge-wrap">
                    <Gauge score={pred.score} size={172}/>
                    <div style={{ textAlign: 'center' }}>
                      <div className="gauge-score-num" style={{ color: levelColor(pred.level) }}>{formatNumber(pred.score)}</div>
                      <div className="gauge-score-lbl">Workload score</div>
                    </div>
                    <span className="badge" style={{ background: levelBg(pred.level), color: levelColor(pred.level), border: `1px solid ${levelBd(pred.level)}`, fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>
                      {pred.level}
                    </span>
                    <div className="gauge-grid" style={{ width: '100%' }}>
                      {[
                        { lbl: 'Mamdani', val: formatNumber(pred.mamdani.score), col: '#1a56db' },
                        { lbl: 'Sugeno', val: formatNumber(pred.sugeno.score), col: '#5925dc' },
                        { lbl: 'Neural net', val: formatNumber(pred.neuralNet.score), col: '#067647' },
                        { lbl: 'Confidence', val: `${formatNumber(pred.confidence, 0)}%`, col: '#b54708' },
                      ].map(s => (
                        <div key={s.lbl} className="gauge-stat">
                          <div className="gauge-stat-lbl">{s.lbl}</div>
                          <div className="gauge-stat-val" style={{ color: s.col }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SHAP */}
              <div className="panel reveal d1">
                <div className="panel-hd">
                  <div className="panel-title">Why is my score {formatNumber(pred.score, 0)}?</div>
                  <span className="panel-sub">SHAP explanation</span>
                </div>
                <div className="panel-body">
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                    The AI analyzed <strong style={{ color: 'var(--text)' }}>17 factors</strong>. Base score {formatNumber(62, 0)} + adjustments = {formatNumber(pred.score, 0)}.
                  </div>
                  {topShap.map(s => {
                    const pct = Math.abs(s.value) / maxShap * 44;
                    const col = s.direction === 'increasing' ? '#b42318' : '#067647';
                    return (
                      <div key={s.featureName} className="shap-row">
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

              {/* Action items */}
              <div className="panel reveal d2">
                <div className="panel-hd"><div className="panel-title">Action items</div></div>
                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pred.actionItems.length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 14 }}>No action items — looking good</div>
                  )}
                  {pred.actionItems.map(a => {
                    const pCol = a.priority === 'critical' ? '#b42318' : a.priority === 'high' ? '#c4320a' : a.priority === 'medium' ? '#b54708' : '#067647';
                    const pBg = a.priority === 'critical' ? '#fef3f2' : a.priority === 'high' ? '#fff6ed' : a.priority === 'medium' ? '#fffaeb' : '#ecfdf3';
                    const pBd = a.priority === 'critical' ? '#fecdca' : a.priority === 'high' ? '#f9dbaf' : a.priority === 'medium' ? '#fedf89' : '#abefc6';
                    return (
                      <div key={a.id} style={{ padding: '10px 12px', border: `1px solid ${pBd}`, borderRadius: 8, background: pBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="badge" style={{ background: pBg, color: pCol, border: `1px solid ${pBd}` }}>{a.priority}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{a.description}</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, fontFamily: 'var(--mono)' }}>
                          <span style={{ color: '#067647' }}>Impact: {a.expectedImpact}</span>
                          <span style={{ color: 'var(--muted)' }}>Effort: {a.effort}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="panel">
            <div className="chips">
              {CATEGORIES.map(cat => (
                <div key={cat.key} className={`chip${paramTab === cat.key ? ' sel' : ''}`} onClick={() => setParamTab(cat.key)}>
                  {cat.label} ({cat.count})
                </div>
              ))}
              {updating && <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--mono)', alignSelf: 'center' }}>Updating...</span>}
            </div>
            <div className="panel-body">
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
                Adjust your inputs below. Changes trigger a full hybrid engine recalculation in real time.
              </div>
              <div className="params-grid">
                {catParams.map(p => {
                  const val = getVal(member.inputs, p.path);
                  return (
                    <div key={p.key} className="param-row">
                      <div className="param-lbl">{p.label} <span className="param-val">{formatNumber(val, p.step < 1 ? 1 : 0)}{p.unit}</span></div>
                      <input type="range" min={p.min} max={p.max} step={p.step} defaultValue={val}
                        onMouseUp={e => handleSlider(p, parseFloat((e.target as HTMLInputElement).value))}/>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && forecast && (
          <div className="panel">
            <div className="panel-hd">
              <div className="panel-title">7-day forecast</div>
              <span className="panel-sub">{forecast.model} · MAE {forecast.mae} · RMSE {forecast.rmse}</span>
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
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 8, background: 'var(--surface3)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                {forecast.points[forecast.points.length - 1].score > pred.score
                  ? `Your workload is projected to increase by ${formatNumber(forecast.points[forecast.points.length - 1].score - pred.score)} points over 7 days. Consider reducing active task count or negotiating deadlines.`
                  : `Your workload is projected to decrease by ${formatNumber(pred.score - forecast.points[forecast.points.length - 1].score)} points. Current trajectory is improving.`}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="panel">
            <div className="panel-hd">
              <div className="panel-title">My alerts</div>
              {myAlerts.length > 0 && <span className="nav-badge nb-red" style={{ margin: 0 }}>{myAlerts.length}</span>}
            </div>
            <div className="panel-body">
              <div className="alert-list">
                {myAlerts.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 24 }}>No alerts for you right now</div>
                )}
                {myAlerts.map(a => (
                  <div key={a.id} className="alert-card" style={{ background: alertBg(a.severity), borderColor: alertColor(a.severity) }}>
                    <div className="alert-indicator" style={{ background: alertColor(a.severity) }}/>
                    <div className="alert-body-wrap">
                      <div className="alert-card-title">{a.title}</div>
                      <div className="alert-card-desc">{a.body}</div>
                      <div className="alert-actions">
                        {a.recommendedActions.map((act, i) => (
                          <span key={i} className="alert-tag" style={{ background: alertColor(a.severity) + '18', color: alertColor(a.severity), border: `1px solid ${alertBd(a.severity)}` }}>{act}</span>
                        ))}
                      </div>
                    </div>
                    <div className="alert-time">{fmtTimeAgo(a.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
