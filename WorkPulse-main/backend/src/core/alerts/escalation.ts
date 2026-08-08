import { Alert, AlertSeverity, EscalationRule, TeamMember, WorkloadPrediction } from '../../types';
import { v4 as uuid } from 'uuid';

export const ESCALATION_RULES: EscalationRule[] = [
  { id:'ER1', name:'Critical Burnout',         condition:'workloadScore > 85',                    severity:'emergency', threshold:85, cooldownMinutes:60,  actions:['Immediate workload redistribution','Notify executive team','Mandatory rest period'], active:true },
  { id:'ER2', name:'Critical Bus Factor',      condition:'busFactor < 2 AND upcomingLeave < 14',  severity:'emergency', threshold:2,  cooldownMinutes:120, actions:['Knowledge transfer protocol','Pair programming sessions','Documentation sprint'],     active:true },
  { id:'ER3', name:'Knowledge Silo',           condition:'knowledgeSilos > 75%',                  severity:'critical',  threshold:75, cooldownMinutes:240, actions:['Mandate pairing sessions within 48h','Cross-train on critical systems'],          active:true },
  { id:'ER4', name:'Burnout Risk',             condition:'workloadScore > 76',                    severity:'critical',  threshold:76, cooldownMinutes:60,  actions:['Schedule 1-on-1 with manager','Reduce active task count','Check wellbeing'],     active:true },
  { id:'ER5', name:'Sprint Overcommitment',    condition:'projectedCapacity > 120%',              severity:'critical',  threshold:120,cooldownMinutes:240, actions:['Sprint scope review','Reprioritize backlog','Notify stakeholders'],               active:true },
  { id:'ER6', name:'Workload Trend Alert',     condition:'sevenDayTrend > +20',                   severity:'warning',   threshold:20, cooldownMinutes:120, actions:['Proactive intervention window','Pulse check survey'],                              active:true },
  { id:'ER7', name:'Sleep Quality Degradation',condition:'sleepQuality < 4',                      severity:'warning',   threshold:4,  cooldownMinutes:240, actions:['Encourage rest','Limit late-night communication','Schedule wellness check'],     active:true },
  { id:'ER8', name:'Stress Level Critical',    condition:'selfReportedStress > 8',                severity:'critical',  threshold:8,  cooldownMinutes:60,  actions:['Mental health resources','Manager intervention','Workload review'],                active:true },
  { id:'ER9', name:'Sprint Burndown Negative', condition:'sprintBurndown < -10',                  severity:'warning',   threshold:-10,cooldownMinutes:240, actions:['Sprint scope review','Daily standup focus shift'],                                 active:true },
  { id:'ER10', name:'Velocity Variance High',  condition:'velocityVariance > 75%',                severity:'info',      threshold:75, cooldownMinutes:480, actions:['Process review','Investigate blockers'],                                            active:true },
];

/**
 * Evaluates all rules against current team state and generates active alerts.
 */
export function evaluateAlerts(team: TeamMember[], predictions: Record<string, WorkloadPrediction>): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const member of team) {
    const pred = predictions[member.id];
    if (!pred) continue;

    if (pred.score > 85) {
      alerts.push({
        id: uuid(), severity: 'emergency', type: 'critical_burnout',
        title: `🚨 CRITICAL Burnout: ${member.name}`,
        body: `Score ${pred.score.toFixed(1)} · ${pred.level} · ${pred.predictedTrend} trend · Immediate intervention required`,
        memberId: member.id, triggeredBy: 'ER1', threshold: 85, currentValue: pred.score,
        timestamp: now, dismissed: false, acknowledged: false,
        recommendedActions: ['Immediate workload redistribution','Schedule mandatory rest','Notify HR and executive'],
      });
    } else if (pred.score > 76) {
      alerts.push({
        id: uuid(), severity: 'critical', type: 'burnout_risk',
        title: `🔴 Burnout Risk: ${member.name}`,
        body: `Score ${pred.score.toFixed(1)} · ${pred.level} · ${member.inputs.individual.activeTasks} active tasks · Bus factor ${member.inputs.team.busFactor}`,
        memberId: member.id, triggeredBy: 'ER4', threshold: 76, currentValue: pred.score,
        timestamp: now, dismissed: false, acknowledged: false,
        recommendedActions: pred.recommendations.slice(0, 3),
      });
    }

    if (member.inputs.team.busFactor < 2 && member.inputs.historical.upcomingLeave < 14) {
      alerts.push({
        id: uuid(), severity: 'emergency', type: 'critical_bus_factor',
        title: `🚨 Critical Bus Factor: ${member.name}`,
        body: `Bus factor ${member.inputs.team.busFactor} with leave in ${member.inputs.historical.upcomingLeave} days · Knowledge transfer urgent`,
        memberId: member.id, triggeredBy: 'ER2', threshold: 2, currentValue: member.inputs.team.busFactor,
        timestamp: now, dismissed: false, acknowledged: false,
        recommendedActions: ['Initiate knowledge transfer','Pair programming sessions','Documentation sprint'],
      });
    }

    if (member.inputs.team.knowledgeSilos > 75) {
      alerts.push({
        id: uuid(), severity: 'critical', type: 'knowledge_silo',
        title: `🟠 Knowledge Silo: ${member.name}`,
        body: `${member.inputs.team.knowledgeSilos}% knowledge concentration · Schedule pairing sessions within 48h`,
        memberId: member.id, triggeredBy: 'ER3', threshold: 75, currentValue: member.inputs.team.knowledgeSilos,
        timestamp: now, dismissed: false, acknowledged: false,
        recommendedActions: ['Mandate pairing sessions','Cross-train on critical systems','Documentation sprint'],
      });
    }

    if (member.inputs.historical.sevenDayTrend > 20) {
      alerts.push({
        id: uuid(), severity: 'warning', type: 'trend_alert',
        title: `🟡 Upward Trend: ${member.name}`,
        body: `7-day trend +${member.inputs.historical.sevenDayTrend.toFixed(0)} points · Proactive intervention window`,
        memberId: member.id, triggeredBy: 'ER6', threshold: 20, currentValue: member.inputs.historical.sevenDayTrend,
        timestamp: now, dismissed: false, acknowledged: false,
        recommendedActions: ['Proactive 1-on-1','Pulse check survey'],
      });
    }
  }

  // Team-level alerts
  const avgScore = team.reduce((s, m) => s + (predictions[m.id]?.score ?? 0), 0) / team.length;
  if (avgScore > 70) {
    alerts.push({
      id: uuid(), severity: 'critical', type: 'sprint_overcommitment',
      title: '🟠 Sprint Overcommitment Forecast',
      body: `Team avg score ${avgScore.toFixed(1)} · Projected ${Math.round((avgScore - 50) * 2)}% over capacity for next sprint`,
      triggeredBy: 'ER5', threshold: 70, currentValue: avgScore,
      timestamp: now, dismissed: false, acknowledged: false,
      recommendedActions: ['Sprint scope review','Reprioritize backlog','Notify stakeholders'],
    });
  }

  return alerts;
}
