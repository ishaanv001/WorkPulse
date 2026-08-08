import { InputVector, SugenoResult } from '../../types';

const norm = (v: number, mn: number, mx: number) => Math.max(0, Math.min(1, (v - mn) / (mx - mn)));
const gauss = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2);

const FEATURE_NAMES = [
  'activeTasks','weightedEffort','deadlinePressure','taskComplexity','contextSwitches',
  'interruptionRate','dailyWorkHours','overtimeFrequency','breakComplianceInv','skillMismatch',
  'learningCurve','communicationLoad','dependencyBlocks',
  'teamSize','collaborationIndex','cohesionLack','knowledgeSilos','conflictLevel','onboardingLoad',
  'sevenDayTrend','velocityVariance',
  'stress','sleepDeficit','exerciseLack','focusDeficit','satisfactionLack',
  'timezoneSpread','toolGap','processGap','resourceGap'
];

function extractFeatures(i: InputVector): number[] {
  return [
    norm(i.individual.activeTasks, 0, 20),
    norm(i.individual.weightedEffort, 0, 200),
    norm(i.individual.deadlinePressure, 0, 30),
    norm(i.individual.taskComplexity, 1, 10),
    norm(i.individual.contextSwitches, 0, 15),
    norm(i.individual.interruptionRate, 0, 10),
    norm(i.individual.dailyWorkHours, 4, 16),
    norm(i.individual.overtimeFrequency, 0, 7),
    norm(100 - i.individual.breakCompliance, 0, 100),
    norm(100 - i.individual.skillTaskMatch, 0, 100),
    norm(i.individual.learningCurve, 0, 100),
    norm(i.individual.communicationLoad, 0, 50),
    norm(i.individual.dependencyBlocks, 0, 10),
    norm(i.team.teamSize, 1, 20),
    norm(i.team.collaborationIndex, 0, 100),
    norm(100 - i.team.teamCohesion, 0, 100),
    norm(i.team.knowledgeSilos, 0, 100),
    norm(i.team.conflictLevel, 0, 10),
    norm(i.team.onboardingLoad, 0, 5),
    norm(i.historical.sevenDayTrend + 50, 0, 100),
    norm(i.historical.velocityVariance, 0, 100),
    norm(i.wellbeing.selfReportedStress, 1, 10),
    norm(10 - i.wellbeing.sleepQuality, 1, 10),
    norm(7 - i.wellbeing.exerciseFrequency, 0, 7),
    norm(8 - i.wellbeing.focusTimeBlocks, 0, 8),
    norm(100 - i.wellbeing.taskSatisfaction, 0, 100),
    norm(i.environmental.timeZoneSpread, 0, 12),
    norm(100 - i.environmental.toolProficiency, 0, 100),
    norm(100 - i.environmental.processMaturity, 0, 100),
    norm(100 - i.environmental.resourceAvailability, 0, 100),
  ];
}

interface SRule {
  id: string;
  ants: Array<{ idx: number; mean: number; sigma: number }>;
  coeffs: number[];
  bias: number;
  desc: string;
}

const SRULES: SRule[] = [
  { id:'SR1',
    ants: [{idx:0,mean:0.85,sigma:0.15},{idx:1,mean:0.88,sigma:0.12}],
    coeffs:[18,16,5,10,9,6,5,7,8,9,4,5,5,3,3,7,4,5,3,6,5,13,11,5,9,7,3,6,5,4],
    bias:38, desc:'High task + effort load',
  },
  { id:'SR2',
    ants: [{idx:21,mean:0.85,sigma:0.15},{idx:22,mean:0.85,sigma:0.15}],
    coeffs:[10,9,6,8,7,6,4,5,6,7,5,4,4,2,3,6,4,5,3,5,5,18,15,6,11,9,3,5,5,5],
    bias:33, desc:'High stress + poor sleep burnout',
  },
  { id:'SR3',
    ants: [{idx:0,mean:0.42,sigma:0.20},{idx:21,mean:0.45,sigma:0.20}],
    coeffs:[12,10,5,8,6,4,5,4,5,6,4,4,3,2,3,4,3,3,2,5,4,10,8,3,7,5,2,4,4,3],
    bias:24, desc:'Medium load medium stress',
  },
  { id:'SR4',
    ants: [{idx:0,mean:0.08,sigma:0.12},{idx:21,mean:0.10,sigma:0.12},{idx:22,mean:0.08,sigma:0.12}],
    coeffs:[4,3,2,2,2,2,2,1,1,2,1,2,1,1,1,2,1,1,1,2,1,3,2,1,2,2,1,2,1,1],
    bias:4, desc:'Low load relaxed',
  },
  { id:'SR5',
    ants: [{idx:4,mean:0.85,sigma:0.15},{idx:5,mean:0.85,sigma:0.15}],
    coeffs:[14,12,6,11,15,12,5,5,6,8,4,6,5,2,3,5,4,4,3,6,5,11,9,4,8,6,3,5,5,4],
    bias:35, desc:'High context switches + interruptions',
  },
  { id:'SR6',
    ants: [{idx:9,mean:0.85,sigma:0.15},{idx:3,mean:0.85,sigma:0.15}],
    coeffs:[11,10,5,16,8,6,4,5,5,17,6,4,4,2,3,5,4,4,3,5,5,11,9,4,7,7,3,5,5,4],
    bias:30, desc:'High skill mismatch + complexity',
  },
];

export function sugenoInference(inputs: InputVector): SugenoResult {
  const feats = extractFeatures(inputs);
  let wSum = 0, wOut = 0;
  const firingStrengths: number[] = [];
  const ruleOutputs: number[] = [];

  for (const rule of SRULES) {
    const strength = rule.ants.reduce((p, a) => p * gauss(feats[a.idx] ?? 0, a.mean, a.sigma), 1);
    firingStrengths.push(strength);
    const linOut = rule.coeffs.reduce((s, c, i) => s + c * (feats[i] ?? 0), rule.bias);
    const clamped = Math.max(0, Math.min(100, linOut));
    ruleOutputs.push(clamped);
    if (strength < 0.001) continue;
    wOut += strength * clamped;
    wSum += strength;
  }

  const score = wSum === 0 ? 50 : Math.max(0, Math.min(100, wOut / wSum));

  const effCoeffs = new Array(8).fill(0).map((_, i) =>
    SRULES.reduce((s, r, ri) => s + (firingStrengths[ri] ?? 0) * (r.coeffs[i] ?? 0), 0) / Math.max(wSum, 0.001)
  );

  return {
    score,
    coefficients: effCoeffs,
    outputFunction: `f(x) = ${effCoeffs.slice(0,3).map((c,i) => `${c.toFixed(2)}·${FEATURE_NAMES[i]}`).join(' + ')} + ... + b`,
    firingStrengths,
    ruleOutputs,
  };
}
