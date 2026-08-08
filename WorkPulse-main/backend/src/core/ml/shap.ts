import { InputVector, ShapValue, ActionItem } from '../../types';

const FEATURES = [
  { name:'Active Tasks',         get:(i:InputVector)=>i.individual.activeTasks,         mn:0,mx:20,  cat:'individual', weight:0.18 },
  { name:'Weighted Effort',      get:(i:InputVector)=>i.individual.weightedEffort,       mn:0,mx:200, cat:'individual', weight:0.15 },
  { name:'Deadline Pressure',    get:(i:InputVector)=>i.individual.deadlinePressure,     mn:0,mx:30,  cat:'individual', weight:0.12, inv:true },
  { name:'Task Complexity',      get:(i:InputVector)=>i.individual.taskComplexity,       mn:1,mx:10,  cat:'individual', weight:0.10 },
  { name:'Context Switches',     get:(i:InputVector)=>i.individual.contextSwitches,      mn:0,mx:15,  cat:'individual', weight:0.09 },
  { name:'Self-Reported Stress', get:(i:InputVector)=>i.wellbeing.selfReportedStress,    mn:1,mx:10,  cat:'wellbeing',  weight:0.09 },
  { name:'Sleep Quality',        get:(i:InputVector)=>i.wellbeing.sleepQuality,          mn:1,mx:10,  cat:'wellbeing',  weight:0.08, inv:true },
  { name:'Skill-Task Match',     get:(i:InputVector)=>i.individual.skillTaskMatch,       mn:0,mx:100, cat:'individual', weight:0.07, inv:true },
  { name:'Focus Time Blocks',    get:(i:InputVector)=>i.wellbeing.focusTimeBlocks,       mn:0,mx:8,   cat:'wellbeing',  weight:0.06, inv:true },
  { name:'Interruption Rate',    get:(i:InputVector)=>i.individual.interruptionRate,     mn:0,mx:10,  cat:'individual', weight:0.05 },
  { name:'Team Cohesion',        get:(i:InputVector)=>i.team.teamCohesion,               mn:0,mx:100, cat:'team',       weight:0.04, inv:true },
  { name:'Knowledge Silos',      get:(i:InputVector)=>i.team.knowledgeSilos,             mn:0,mx:100, cat:'team',       weight:0.04 },
  { name:'Break Compliance',     get:(i:InputVector)=>i.individual.breakCompliance,      mn:0,mx:100, cat:'individual', weight:0.03, inv:true },
  { name:'Velocity Variance',    get:(i:InputVector)=>i.historical.velocityVariance,     mn:0,mx:100, cat:'historical', weight:0.03 },
  { name:'Task Satisfaction',    get:(i:InputVector)=>i.wellbeing.taskSatisfaction,      mn:0,mx:100, cat:'wellbeing',  weight:0.02, inv:true },
  { name:'Bus Factor',           get:(i:InputVector)=>i.team.busFactor,                  mn:1,mx:10,  cat:'team',       weight:0.02, inv:true },
  { name:'Daily Work Hours',     get:(i:InputVector)=>i.individual.dailyWorkHours,       mn:4,mx:16,  cat:'individual', weight:0.02 },
];

export function computeSHAP(inputs: InputVector, score: number): ShapValue[] {
  const baseline = 50;
  return FEATURES.map(f => {
    const val = f.get(inputs);
    const n = (val - f.mn) / (f.mx - f.mn);
    const dev = f.inv ? (0.5 - n) : (n - 0.5);
    const shapVal = parseFloat((dev * f.weight * (score - baseline) * 2.4).toFixed(3));
    return {
      featureName: f.name,
      value: shapVal,
      direction: (shapVal >= 0 ? 'increasing' : 'decreasing') as 'increasing' | 'decreasing',
      category: f.cat,
    };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function generateRecommendations(inputs: InputVector, score: number): string[] {
  const recs: string[] = [];

  if (inputs.individual.activeTasks > 12)
    recs.push('🔴 Immediate task delegation required — active task count exceeds sustainable threshold.');
  if (inputs.wellbeing.selfReportedStress > 7)
    recs.push('🟠 Schedule urgent 1-on-1 — stress level requires direct management intervention.');
  if (inputs.wellbeing.sleepQuality < 4)
    recs.push('🔴 Enable async-first communication — sleep deprivation impairs decision-making by ~40%.');
  if (inputs.individual.contextSwitches > 10)
    recs.push('🟠 Block 3-hour deep-work windows daily — fragmented attention adds significant load.');
  if (inputs.individual.skillTaskMatch < 40)
    recs.push('🟡 Reassign mismatched tasks — skill gap adds unnecessary cognitive overhead.');
  if (inputs.team.teamCohesion < 50)
    recs.push('🟡 Schedule team retrospective — cohesion below threshold amplifies individual load.');
  if (inputs.individual.breakCompliance < 40)
    recs.push('🟢 Enforce Pomodoro schedule — break non-compliance accelerates fatigue accumulation.');
  if (inputs.team.busFactor < 2)
    recs.push('🚨 Bus factor critical — initiate knowledge transfer protocol immediately.');
  if (inputs.team.knowledgeSilos > 70)
    recs.push('🟠 Pairing sessions required — high knowledge concentration is a continuity risk.');
  if (inputs.individual.dailyWorkHours > 11)
    recs.push('🟠 Enforce work hour caps — sustained overwork degrades long-term productivity.');
  if (score > 85)
    recs.push('🚨 CRITICAL: Immediate workload redistribution required — burnout risk imminent.');

  if (recs.length === 0) {
    recs.push('✅ Workload is within sustainable range — maintain current pacing.');
    recs.push('🟢 Consider mentoring responsibilities to share knowledge across team.');
  }

  return recs.slice(0, 5);
}

export function generateActionItems(inputs: InputVector, score: number): ActionItem[] {
  const items: ActionItem[] = [];
  let id = 1;

  if (inputs.individual.activeTasks > 12) items.push({
    id: `ai_${id++}`, priority: 'critical', category: 'workload',
    title: 'Delegate 2-3 active tasks',
    description: 'Identify lowest-priority items and reassign to team members with capacity',
    expectedImpact: -12, effort: 'medium',
  });
  if (inputs.wellbeing.sleepQuality < 4) items.push({
    id: `ai_${id++}`, priority: 'high', category: 'wellbeing',
    title: 'Mandate 48-hour rest period',
    description: 'Sleep deprivation at this level requires immediate recovery time',
    expectedImpact: -8, effort: 'low',
  });
  if (inputs.individual.contextSwitches > 10) items.push({
    id: `ai_${id++}`, priority: 'high', category: 'process',
    title: 'Implement focus blocks',
    description: 'Schedule 3-hour uninterrupted blocks daily, route notifications via async channels',
    expectedImpact: -7, effort: 'low',
  });
  if (inputs.team.busFactor < 2) items.push({
    id: `ai_${id++}`, priority: 'critical', category: 'risk',
    title: 'Knowledge transfer sessions',
    description: 'Pair this member with at least 2 others on critical systems within 5 days',
    expectedImpact: -5, effort: 'high',
  });
  if (inputs.individual.skillTaskMatch < 50) items.push({
    id: `ai_${id++}`, priority: 'medium', category: 'allocation',
    title: 'Skill-based task reallocation',
    description: 'Review task assignments against skill matrix; rebalance with team lead',
    expectedImpact: -6, effort: 'medium',
  });

  return items;
}
