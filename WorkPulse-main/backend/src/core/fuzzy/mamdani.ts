import { InputVector, MamdaniResult, MembershipDegree, FiredRule } from '../../types';

// ── MEMBERSHIP FUNCTIONS ──────────────────────────────────────────────────────
const trap = (a: number, b: number, c: number, d: number) => (x: number): number => {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
};
const tri = (a: number, b: number, c: number) => (x: number): number => {
  if (x <= a || x >= c) return 0;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
};

// ── FUZZY SETS for all parameters ────────────────────────────────────────────
type SetMap = Record<string, (x: number) => number>;
export const SETS: Record<string, SetMap> = {
  activeTasks:        { vL: trap(0,0,1,3),    L: tri(2,4,6),    M: tri(4,8,11),   H: tri(9,13,16),  vH: trap(14,17,20,20) },
  weightedEffort:     { vL: trap(0,0,20,45),  L: tri(30,60,90), M: tri(75,105,135),H: tri(120,155,180),vH: trap(160,185,200,200) },
  deadlinePressure:   { vL: trap(0,0,2,5),    L: tri(3,8,13),   M: tri(9,15,21),  H: tri(17,23,28), vH: trap(25,28,30,30) },
  taskComplexity:     { vL: trap(1,1,2,3),    L: tri(2,4,5),    M: tri(4,5.5,7),  H: tri(6,7.5,9),  vH: trap(8,9,10,10) },
  contextSwitches:    { vL: trap(0,0,1,3),    L: tri(1,3,6),    M: tri(4,7,10),   H: tri(8,11,13),  vH: trap(11,13,15,15) },
  interruptionRate:   { vL: trap(0,0,1,2),    L: tri(1,3,5),    M: tri(3,5,7),    H: tri(5,7,9),    vH: trap(8,9,10,10) },
  dailyWorkHours:     { vL: trap(4,4,5,6),    L: tri(5,7,8),    M: tri(7,8.5,10), H: tri(9,11,13),  vH: trap(12,14,16,16) },
  selfReportedStress: { vL: trap(1,1,2,3),    L: tri(2,3.5,5),  M: tri(4,5.5,7),  H: tri(6,7.5,9),  vH: trap(8,9,10,10) },
  sleepQuality:       { vL: trap(1,1,2,3),    L: tri(2,3.5,5),  M: tri(4,5.5,7),  H: tri(6,7.5,9),  vH: trap(8,9,10,10) },
  skillTaskMatch:     { vL: trap(0,0,10,25),  L: tri(15,35,50), M: tri(40,55,70), H: tri(60,75,88), vH: trap(80,90,100,100) },
  teamCohesion:       { vL: trap(0,0,10,25),  L: tri(15,35,50), M: tri(40,58,72), H: tri(65,80,90), vH: trap(85,93,100,100) },
  knowledgeSilos:     { vL: trap(0,0,15,30),  L: tri(20,40,55), M: tri(45,60,75), H: tri(65,80,90), vH: trap(85,93,100,100) },
  busFactor:          { vL: trap(1,1,1.5,2),  L: tri(2,2.5,3),  M: tri(3,4,5),    H: tri(5,6,7),    vH: trap(7,8,10,10) },
  output:             { vL: trap(0,0,8,18),   L: tri(12,25,38), M: tri(30,50,65), H: tri(58,72,85), vH: trap(78,90,100,100) },
};

// ── COMPREHENSIVE RULE BASE (50+ rules) ──────────────────────────────────────
interface Rule {
  id: string;
  category: string;
  conds: Array<{ param: string; set: string }>;
  out: string;
  w: number;
  desc: string;
}

export const RULE_BASE: Rule[] = [
  // CRITICAL BURNOUT RULES (10)
  { id:'R001', category:'burnout', conds:[{param:'activeTasks',set:'vH'},{param:'selfReportedStress',set:'vH'}], out:'vH', w:1.0, desc:'Tasks VERY HIGH ∧ Stress VERY HIGH → Burnout Risk' },
  { id:'R002', category:'burnout', conds:[{param:'activeTasks',set:'vH'},{param:'deadlinePressure',set:'vL'}], out:'vH', w:1.0, desc:'Tasks VERY HIGH ∧ Deadline CRITICAL → Burnout Risk' },
  { id:'R003', category:'burnout', conds:[{param:'weightedEffort',set:'vH'},{param:'sleepQuality',set:'vL'}], out:'vH', w:0.95, desc:'Effort EXTREME ∧ Sleep POOR → Burnout Risk' },
  { id:'R004', category:'burnout', conds:[{param:'taskComplexity',set:'vH'},{param:'contextSwitches',set:'vH'}], out:'vH', w:0.90, desc:'Complexity EXTREME ∧ Switches EXTREME → Burnout Risk' },
  { id:'R005', category:'burnout', conds:[{param:'selfReportedStress',set:'vH'},{param:'sleepQuality',set:'vL'},{param:'activeTasks',set:'H'}], out:'vH', w:0.95, desc:'Stress EXTREME ∧ Sleep POOR ∧ Tasks HIGH → Burnout' },
  { id:'R006', category:'burnout', conds:[{param:'dailyWorkHours',set:'vH'},{param:'sleepQuality',set:'vL'}], out:'vH', w:0.93, desc:'Work Hours EXTREME ∧ Sleep POOR → Burnout' },
  { id:'R007', category:'burnout', conds:[{param:'busFactor',set:'vL'},{param:'activeTasks',set:'vH'}], out:'vH', w:0.92, desc:'Bus Factor CRITICAL ∧ Tasks VERY HIGH → Burnout' },
  { id:'R008', category:'burnout', conds:[{param:'weightedEffort',set:'vH'},{param:'skillTaskMatch',set:'vL'}], out:'vH', w:0.92, desc:'Effort EXTREME ∧ Skill Match POOR → Burnout' },
  { id:'R009', category:'burnout', conds:[{param:'interruptionRate',set:'vH'},{param:'taskComplexity',set:'vH'}], out:'vH', w:0.90, desc:'Interruptions EXTREME ∧ Complexity HIGH → Burnout' },
  { id:'R010', category:'burnout', conds:[{param:'selfReportedStress',set:'vH'},{param:'teamCohesion',set:'vL'}], out:'vH', w:0.88, desc:'Stress EXTREME ∧ Cohesion POOR → Burnout' },

  // OVERLOADED RULES (12)
  { id:'R011', category:'overload', conds:[{param:'activeTasks',set:'H'},{param:'weightedEffort',set:'H'}], out:'H', w:0.85, desc:'Tasks HIGH ∧ Effort HIGH → Overloaded' },
  { id:'R012', category:'overload', conds:[{param:'contextSwitches',set:'H'},{param:'selfReportedStress',set:'H'}], out:'H', w:0.82, desc:'Switches HIGH ∧ Stress HIGH → Overloaded' },
  { id:'R013', category:'overload', conds:[{param:'deadlinePressure',set:'vL'},{param:'taskComplexity',set:'H'}], out:'H', w:0.88, desc:'Deadline CRITICAL ∧ Complexity HIGH → Overloaded' },
  { id:'R014', category:'overload', conds:[{param:'activeTasks',set:'H'},{param:'contextSwitches',set:'H'}], out:'H', w:0.80, desc:'Tasks HIGH ∧ Switches HIGH → Overloaded' },
  { id:'R015', category:'overload', conds:[{param:'dailyWorkHours',set:'H'},{param:'breakCompliance' as any,set:'L'}], out:'H', w:0.78, desc:'Work Hours HIGH ∧ Breaks LOW → Overloaded' },
  { id:'R016', category:'overload', conds:[{param:'knowledgeSilos',set:'vH'},{param:'activeTasks',set:'H'}], out:'H', w:0.85, desc:'Silos HIGH ∧ Tasks HIGH → Overloaded' },
  { id:'R017', category:'overload', conds:[{param:'interruptionRate',set:'H'},{param:'taskComplexity',set:'H'}], out:'H', w:0.82, desc:'Interruptions HIGH ∧ Complexity HIGH → Overloaded' },
  { id:'R018', category:'overload', conds:[{param:'busFactor',set:'L'},{param:'weightedEffort',set:'H'}], out:'H', w:0.80, desc:'Bus Factor LOW ∧ Effort HIGH → Overloaded' },
  { id:'R019', category:'overload', conds:[{param:'sleepQuality',set:'L'},{param:'taskComplexity',set:'H'}], out:'H', w:0.78, desc:'Sleep LOW ∧ Complexity HIGH → Overloaded' },
  { id:'R020', category:'overload', conds:[{param:'skillTaskMatch',set:'L'},{param:'deadlinePressure',set:'L'}], out:'H', w:0.75, desc:'Skill LOW ∧ Deadline TIGHT → Overloaded' },
  { id:'R021', category:'overload', conds:[{param:'weightedEffort',set:'H'},{param:'teamCohesion',set:'L'}], out:'H', w:0.76, desc:'Effort HIGH ∧ Cohesion LOW → Overloaded' },
  { id:'R022', category:'overload', conds:[{param:'activeTasks',set:'H'},{param:'sleepQuality',set:'L'}], out:'H', w:0.83, desc:'Tasks HIGH ∧ Sleep LOW → Overloaded' },

  // BUSY/MEDIUM RULES (10)
  { id:'R023', category:'busy', conds:[{param:'activeTasks',set:'M'},{param:'weightedEffort',set:'M'}], out:'M', w:0.78, desc:'Tasks MEDIUM ∧ Effort MEDIUM → Busy' },
  { id:'R024', category:'busy', conds:[{param:'selfReportedStress',set:'M'},{param:'taskComplexity',set:'M'}], out:'M', w:0.72, desc:'Stress MEDIUM ∧ Complexity MEDIUM → Busy' },
  { id:'R025', category:'busy', conds:[{param:'contextSwitches',set:'M'},{param:'interruptionRate',set:'M'}], out:'M', w:0.70, desc:'Switches MED ∧ Interruptions MED → Busy' },
  { id:'R026', category:'busy', conds:[{param:'dailyWorkHours',set:'M'},{param:'activeTasks',set:'M'}], out:'M', w:0.74, desc:'Hours MED ∧ Tasks MED → Busy' },
  { id:'R027', category:'busy', conds:[{param:'taskComplexity',set:'M'},{param:'skillTaskMatch',set:'M'}], out:'M', w:0.68, desc:'Complexity MED ∧ Skill MED → Busy' },
  { id:'R028', category:'busy', conds:[{param:'activeTasks',set:'M'},{param:'teamCohesion',set:'M'}], out:'M', w:0.66, desc:'Tasks MED ∧ Cohesion MED → Busy' },
  { id:'R029', category:'busy', conds:[{param:'weightedEffort',set:'M'},{param:'deadlinePressure',set:'M'}], out:'M', w:0.72, desc:'Effort MED ∧ Deadline MED → Busy' },
  { id:'R030', category:'busy', conds:[{param:'selfReportedStress',set:'M'},{param:'sleepQuality',set:'M'}], out:'M', w:0.65, desc:'Stress MED ∧ Sleep MED → Busy' },
  { id:'R031', category:'busy', conds:[{param:'contextSwitches',set:'M'},{param:'skillTaskMatch',set:'H'}], out:'L', w:0.75, desc:'Switches MED ∧ Skill HIGH → Manageable' },
  { id:'R032', category:'busy', conds:[{param:'activeTasks',set:'M'},{param:'sleepQuality',set:'H'}], out:'L', w:0.72, desc:'Tasks MED ∧ Sleep GOOD → Manageable' },

  // RELIEF/LOW RULES (10)
  { id:'R033', category:'normal', conds:[{param:'activeTasks',set:'L'},{param:'selfReportedStress',set:'L'}], out:'L', w:0.88, desc:'Tasks LOW ∧ Stress LOW → Normal' },
  { id:'R034', category:'normal', conds:[{param:'skillTaskMatch',set:'vH'},{param:'sleepQuality',set:'H'}], out:'vL', w:0.80, desc:'Skill EXCELLENT ∧ Sleep GOOD → Very Normal' },
  { id:'R035', category:'normal', conds:[{param:'activeTasks',set:'vL'},{param:'weightedEffort',set:'vL'}], out:'vL', w:0.90, desc:'Tasks VERY LOW ∧ Effort VERY LOW → Normal' },
  { id:'R036', category:'normal', conds:[{param:'teamCohesion',set:'vH'},{param:'contextSwitches',set:'L'}], out:'L', w:0.72, desc:'Cohesion HIGH ∧ Switches LOW → Reduced' },
  { id:'R037', category:'normal', conds:[{param:'sleepQuality',set:'vH'},{param:'selfReportedStress',set:'L'}], out:'vL', w:0.85, desc:'Sleep EXCELLENT ∧ Stress LOW → Very Normal' },
  { id:'R038', category:'normal', conds:[{param:'busFactor',set:'vH'},{param:'knowledgeSilos',set:'L'}], out:'L', w:0.78, desc:'Bus Factor HIGH ∧ Silos LOW → Manageable' },
  { id:'R039', category:'normal', conds:[{param:'taskComplexity',set:'L'},{param:'skillTaskMatch',set:'H'}], out:'vL', w:0.82, desc:'Complexity LOW ∧ Skill HIGH → Very Normal' },
  { id:'R040', category:'normal', conds:[{param:'interruptionRate',set:'L'},{param:'contextSwitches',set:'L'}], out:'L', w:0.75, desc:'Interruptions LOW ∧ Switches LOW → Manageable' },
  { id:'R041', category:'normal', conds:[{param:'dailyWorkHours',set:'L'},{param:'activeTasks',set:'L'}], out:'vL', w:0.88, desc:'Hours LOW ∧ Tasks LOW → Very Normal' },
  { id:'R042', category:'normal', conds:[{param:'weightedEffort',set:'L'},{param:'selfReportedStress',set:'vL'}], out:'vL', w:0.86, desc:'Effort LOW ∧ Stress VERY LOW → Very Normal' },

  // SINGLE-CONDITION SAFETY RULES (8)
  { id:'R043', category:'safety', conds:[{param:'activeTasks',set:'vH'}], out:'H', w:0.75, desc:'Tasks VERY HIGH → Overloaded' },
  { id:'R044', category:'safety', conds:[{param:'selfReportedStress',set:'vH'}], out:'H', w:0.70, desc:'Stress VERY HIGH → Overloaded' },
  { id:'R045', category:'safety', conds:[{param:'sleepQuality',set:'vL'}], out:'M', w:0.65, desc:'Sleep VERY POOR → Elevated' },
  { id:'R046', category:'safety', conds:[{param:'taskComplexity',set:'vH'}], out:'H', w:0.68, desc:'Complexity EXTREME → Overloaded' },
  { id:'R047', category:'safety', conds:[{param:'skillTaskMatch',set:'vL'}], out:'H', w:0.72, desc:'Skill Match POOR → Overloaded' },
  { id:'R048', category:'safety', conds:[{param:'busFactor',set:'vL'}], out:'M', w:0.70, desc:'Bus Factor CRITICAL → Elevated' },
  { id:'R049', category:'safety', conds:[{param:'dailyWorkHours',set:'vH'}], out:'H', w:0.74, desc:'Work Hours EXTREME → Overloaded' },
  { id:'R050', category:'safety', conds:[{param:'knowledgeSilos',set:'vH'}], out:'M', w:0.65, desc:'Silos EXTREME → Elevated' },

  // COMPOUND TRIPLE-CONDITION RULES (5)
  { id:'R051', category:'critical', conds:[{param:'activeTasks',set:'H'},{param:'deadlinePressure',set:'vL'},{param:'skillTaskMatch',set:'L'}], out:'vH', w:0.93, desc:'Tasks HIGH ∧ Deadline URGENT ∧ Skill POOR → Critical' },
  { id:'R052', category:'critical', conds:[{param:'weightedEffort',set:'H'},{param:'sleepQuality',set:'L'},{param:'contextSwitches',set:'H'}], out:'vH', w:0.90, desc:'Effort HIGH ∧ Sleep LOW ∧ Switches HIGH → Critical' },
  { id:'R053', category:'critical', conds:[{param:'selfReportedStress',set:'H'},{param:'teamCohesion',set:'L'},{param:'busFactor',set:'L'}], out:'vH', w:0.88, desc:'Stress HIGH ∧ Cohesion LOW ∧ Bus LOW → Critical' },
  { id:'R054', category:'critical', conds:[{param:'taskComplexity',set:'vH'},{param:'skillTaskMatch',set:'L'},{param:'interruptionRate',set:'H'}], out:'vH', w:0.91, desc:'Complexity EXTREME ∧ Skill LOW ∧ Interruptions HIGH → Critical' },
  { id:'R055', category:'critical', conds:[{param:'activeTasks',set:'H'},{param:'sleepQuality',set:'L'},{param:'dailyWorkHours',set:'H'}], out:'vH', w:0.89, desc:'Tasks HIGH ∧ Sleep LOW ∧ Hours HIGH → Critical' },
];

// ── INPUT EXTRACTION ─────────────────────────────────────────────────────────
function getVal(inputs: InputVector, param: string): number {
  const map: Record<string, number> = {
    activeTasks: inputs.individual.activeTasks,
    weightedEffort: inputs.individual.weightedEffort,
    deadlinePressure: inputs.individual.deadlinePressure,
    taskComplexity: inputs.individual.taskComplexity,
    contextSwitches: inputs.individual.contextSwitches,
    interruptionRate: inputs.individual.interruptionRate,
    dailyWorkHours: inputs.individual.dailyWorkHours,
    breakCompliance: inputs.individual.breakCompliance,
    skillTaskMatch: inputs.individual.skillTaskMatch,
    selfReportedStress: inputs.wellbeing.selfReportedStress,
    sleepQuality: inputs.wellbeing.sleepQuality,
    teamCohesion: inputs.team.teamCohesion,
    knowledgeSilos: inputs.team.knowledgeSilos,
    busFactor: inputs.team.busFactor,
  };
  return map[param] ?? 0;
}

// ── DEFUZZIFICATION (centroid method) ────────────────────────────────────────
function defuzzify(agg: Array<{ set: string; strength: number }>): number {
  const out = SETS.output;
  let num = 0, den = 0;
  for (let i = 0; i <= 200; i++) {
    const x = i / 2;
    let mu = 0;
    for (const { set, strength } of agg) {
      const fn = out[set];
      if (fn) mu = Math.max(mu, Math.min(strength, fn(x)));
    }
    num += x * mu;
    den += mu;
  }
  return den === 0 ? 50 : num / den;
}

// ── MAMDANI INFERENCE ────────────────────────────────────────────────────────
export function mamdaniInference(inputs: InputVector): MamdaniResult {
  const agg: Array<{ set: string; strength: number }> = [];
  const fired: FiredRule[] = [];

  for (const rule of RULE_BASE) {
    const strengths = rule.conds.map(c => {
      const sets = SETS[c.param];
      return sets ? (sets[c.set]?.(getVal(inputs, c.param)) ?? 0) : 0;
    });
    const strength = Math.min(...strengths) * rule.w;
    if (strength > 0.02) {
      agg.push({ set: rule.out, strength });
      const impact = strength * (
        rule.out === 'vH' ? 22 :
        rule.out === 'H' ? 14 :
        rule.out === 'M' ? 2 :
        rule.out === 'L' ? -10 : -16
      );
      fired.push({
        id: rule.id, rule: rule.desc, strength,
        impact, consequent: rule.out, category: rule.category,
      });
    }
  }

  fired.sort((a, b) => b.strength - a.strength);
  const score = defuzzify(agg);
  const out = SETS.output;

  const membership: MembershipDegree = {
    veryLow: out.vL(score),
    low: out.L(score),
    medium: out.M(score),
    high: out.H(score),
    veryHigh: out.vH(score),
  };

  return {
    score,
    membership,
    firedRules: fired.slice(0, 15),
    ruleCount: RULE_BASE.length,
    aggregationMethod: 'MIN-MAX with Centroid Defuzzification',
  };
}
