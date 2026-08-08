export interface ParamDef {
  key:string; label:string; min:number; max:number; unit:string;
  category:string; path:string; step:number;
}

export const PARAMS: ParamDef[] = [
  { key:'activeTasks',       label:'Active Tasks',         min:0,   max:20,  unit:'tasks', category:'individual',    path:'individual.activeTasks',         step:1 },
  { key:'weightedEffort',    label:'Weighted Effort',      min:0,   max:200, unit:'hrs',   category:'individual',    path:'individual.weightedEffort',      step:5 },
  { key:'deadlinePressure',  label:'Deadline Pressure',    min:0,   max:30,  unit:'days',  category:'individual',    path:'individual.deadlinePressure',    step:1 },
  { key:'taskComplexity',    label:'Task Complexity',      min:1,   max:10,  unit:'/10',   category:'individual',    path:'individual.taskComplexity',      step:0.5 },
  { key:'contextSwitches',   label:'Context Switches',     min:0,   max:15,  unit:'/day',  category:'individual',    path:'individual.contextSwitches',     step:1 },
  { key:'interruptionRate',  label:'Interruption Rate',    min:0,   max:10,  unit:'/hr',   category:'individual',    path:'individual.interruptionRate',    step:0.5 },
  { key:'dailyWorkHours',    label:'Daily Work Hours',     min:4,   max:16,  unit:'hrs',   category:'individual',    path:'individual.dailyWorkHours',      step:0.5 },
  { key:'overtimeFrequency', label:'Overtime Frequency',   min:0,   max:7,   unit:'days',  category:'individual',    path:'individual.overtimeFrequency',   step:1 },
  { key:'breakCompliance',   label:'Break Compliance',     min:0,   max:100, unit:'%',     category:'individual',    path:'individual.breakCompliance',     step:5 },
  { key:'skillTaskMatch',    label:'Skill-Task Match',     min:0,   max:100, unit:'%',     category:'individual',    path:'individual.skillTaskMatch',      step:5 },
  { key:'learningCurve',     label:'Learning Curve',       min:0,   max:100, unit:'%',     category:'individual',    path:'individual.learningCurve',       step:5 },
  { key:'communicationLoad', label:'Communication Load',   min:0,   max:50,  unit:'/day',  category:'individual',    path:'individual.communicationLoad',   step:1 },
  { key:'dependencyBlocks',  label:'Dependency Blocks',    min:0,   max:10,  unit:'tasks', category:'individual',    path:'individual.dependencyBlocks',    step:1 },
  { key:'teamSize',          label:'Team Size',            min:1,   max:20,  unit:'ppl',   category:'team',          path:'team.teamSize',                  step:1 },
  { key:'collaborationIdx',  label:'Collaboration Index',  min:0,   max:100, unit:'%',     category:'team',          path:'team.collaborationIndex',        step:5 },
  { key:'teamCohesion',      label:'Team Cohesion',        min:0,   max:100, unit:'/100',  category:'team',          path:'team.teamCohesion',              step:5 },
  { key:'knowledgeSilos',    label:'Knowledge Silos',      min:0,   max:100, unit:'%',     category:'team',          path:'team.knowledgeSilos',            step:5 },
  { key:'onboardingLoad',    label:'Onboarding Load',      min:0,   max:5,   unit:'new',   category:'team',          path:'team.onboardingLoad',            step:1 },
  { key:'conflictLevel',     label:'Conflict Level',       min:0,   max:10,  unit:'/wk',   category:'team',          path:'team.conflictLevel',             step:0.5 },
  { key:'sharedTaskRatio',   label:'Shared Task Ratio',    min:0,   max:100, unit:'%',     category:'team',          path:'team.sharedTaskRatio',           step:5 },
  { key:'busFactor',         label:'Bus Factor',           min:1,   max:10,  unit:'ppl',   category:'team',          path:'team.busFactor',                 step:1 },
  { key:'sevenDayTrend',     label:'7-Day Trend',          min:-50, max:50,  unit:'pts',   category:'historical',    path:'historical.sevenDayTrend',       step:1 },
  { key:'thirtyDayAvg',      label:'30-Day Average',       min:0,   max:100, unit:'/100',  category:'historical',    path:'historical.thirtyDayAverage',    step:1 },
  { key:'velocityVariance',  label:'Velocity Variance',    min:0,   max:100, unit:'%',     category:'historical',    path:'historical.velocityVariance',    step:5 },
  { key:'sprintBurndown',    label:'Sprint Burndown',      min:-20, max:20,  unit:'pts',   category:'historical',    path:'historical.sprintBurndown',      step:1 },
  { key:'upcomingLeave',     label:'Upcoming Leave',       min:0,   max:30,  unit:'days',  category:'historical',    path:'historical.upcomingLeave',       step:1 },
  { key:'projectDeadlines',  label:'Project Deadlines',    min:0,   max:90,  unit:'days',  category:'historical',    path:'historical.projectDeadlines',    step:1 },
  { key:'workLocation',      label:'Work Location',        min:0,   max:100, unit:'%rem',  category:'environmental', path:'environmental.workLocation',     step:5 },
  { key:'timeZoneSpread',    label:'Timezone Spread',      min:0,   max:12,  unit:'hrs',   category:'environmental', path:'environmental.timeZoneSpread',   step:1 },
  { key:'toolProficiency',   label:'Tool Proficiency',     min:0,   max:100, unit:'%',     category:'environmental', path:'environmental.toolProficiency',  step:5 },
  { key:'processMaturity',   label:'Process Maturity',     min:0,   max:100, unit:'/100',  category:'environmental', path:'environmental.processMaturity',  step:5 },
  { key:'managementStyle',   label:'Management Style',     min:0,   max:100, unit:'/100',  category:'environmental', path:'environmental.managementStyle',  step:5 },
  { key:'resourceAvail',     label:'Resource Availability',min:0,   max:100, unit:'%',     category:'environmental', path:'environmental.resourceAvailability',step:5 },
  { key:'selfReportStress',  label:'Self-Report Stress',   min:1,   max:10,  unit:'/10',   category:'wellbeing',     path:'wellbeing.selfReportedStress',   step:0.5 },
  { key:'sleepQuality',      label:'Sleep Quality',        min:1,   max:10,  unit:'/10',   category:'wellbeing',     path:'wellbeing.sleepQuality',         step:0.5 },
  { key:'exerciseFreq',      label:'Exercise Frequency',   min:0,   max:7,   unit:'days',  category:'wellbeing',     path:'wellbeing.exerciseFrequency',    step:1 },
  { key:'focusTime',         label:'Focus Time',           min:0,   max:8,   unit:'hrs',   category:'wellbeing',     path:'wellbeing.focusTimeBlocks',      step:0.5 },
  { key:'taskSatisfaction',  label:'Task Satisfaction',    min:0,   max:100, unit:'%',     category:'wellbeing',     path:'wellbeing.taskSatisfaction',     step:5 },
  { key:'careerGrowth',      label:'Career Growth',        min:0,   max:100, unit:'%',     category:'wellbeing',     path:'wellbeing.careerGrowth',         step:5 },
];

export const CATEGORIES = [
  { key:'individual',    label:'Individual',  count:13 },
  { key:'team',          label:'Team',        count:8 },
  { key:'historical',    label:'Historical',  count:7 },
  { key:'environmental', label:'Environment', count:6 },
  { key:'wellbeing',     label:'Wellbeing',   count:6 },
] as const;

export function getVal(obj: any, path: string): number {
  return path.split('.').reduce((o, k) => o?.[k], obj) ?? 0;
}
export function setVal<T extends Record<string, any>>(obj: T, path: string, value: number): T {
  const result = JSON.parse(JSON.stringify(obj));
  const parts = path.split('.');
  let cur: any = result;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
  return result;
}
