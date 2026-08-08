import { TeamMember, Collaboration, InputVector } from '../types';

function makeInputs(p: Partial<{ [K in keyof InputVector]: Partial<InputVector[K]> }> = {}): InputVector {
  const base: InputVector = {
    individual: { activeTasks:6, weightedEffort:80, deadlinePressure:14, taskComplexity:5, contextSwitches:4, interruptionRate:3, dailyWorkHours:8, overtimeFrequency:1, breakCompliance:70, skillTaskMatch:75, learningCurve:20, communicationLoad:15, dependencyBlocks:1 },
    team: { teamSize:8, collaborationIndex:60, teamCohesion:70, knowledgeSilos:30, onboardingLoad:0, conflictLevel:2, sharedTaskRatio:40, busFactor:3 },
    historical: { sevenDayTrend:0, thirtyDayAverage:50, velocityVariance:20, sprintBurndown:0, seasonalPattern:50, upcomingLeave:14, projectDeadlines:30 },
    environmental: { workLocation:50, timeZoneSpread:3, toolProficiency:75, processMaturity:65, managementStyle:60, resourceAvailability:80 },
    wellbeing: { selfReportedStress:4, sleepQuality:7, exerciseFrequency:3, focusTimeBlocks:4, taskSatisfaction:70, careerGrowth:65 },
  };
  const out = JSON.parse(JSON.stringify(base)) as InputVector;
  for (const k of Object.keys(p) as (keyof InputVector)[]) {
    if (p[k]) Object.assign(out[k], p[k]);
  }
  return out;
}

export const TEAM: TeamMember[] = [
  {
    id: 'alex', name: 'Alex Chen', email: 'alex.chen@workloadiq.com',
    role: 'Lead Engineer', avatar: 'AC', color: '#ef4444', team: 't1',
    skills: ['Python','Distributed Systems','ML Ops','Architecture'],
    joinedAt: '2021-03-15',
    inputs: makeInputs({
      individual: { activeTasks:14, weightedEffort:160, deadlinePressure:3, taskComplexity:9, contextSwitches:11, interruptionRate:7, dailyWorkHours:13, overtimeFrequency:5, breakCompliance:20, skillTaskMatch:55, learningCurve:70, communicationLoad:38, dependencyBlocks:6 },
      team: { teamSize:8, collaborationIndex:80, teamCohesion:55, knowledgeSilos:78, onboardingLoad:2, conflictLevel:5, sharedTaskRatio:70, busFactor:1 },
      historical: { sevenDayTrend:22, thirtyDayAverage:78, velocityVariance:55, sprintBurndown:-12, seasonalPattern:80, upcomingLeave:3, projectDeadlines:5 },
      environmental: { workLocation:20, timeZoneSpread:8, toolProficiency:85, processMaturity:40, managementStyle:25, resourceAvailability:55 },
      wellbeing: { selfReportedStress:8, sleepQuality:4, exerciseFrequency:1, focusTimeBlocks:1, taskSatisfaction:30, careerGrowth:20 },
    }),
    history: [55,60,65,70,75,78,81,83,85,86,87,88,89,89],
    collaborators: ['maya','raj','priya'],
  },
  {
    id: 'maya', name: 'Maya Park', email: 'maya.park@workloadiq.com',
    role: 'Senior Frontend Dev', avatar: 'MP', color: '#f97316', team: 't1',
    skills: ['React','TypeScript','Design Systems','Accessibility'],
    joinedAt: '2022-01-10',
    inputs: makeInputs({
      individual: { activeTasks:10, weightedEffort:120, deadlinePressure:6, taskComplexity:7, contextSwitches:8, interruptionRate:5, dailyWorkHours:10, overtimeFrequency:3, breakCompliance:45, skillTaskMatch:68, learningCurve:40, communicationLoad:25, dependencyBlocks:3 },
      team: { teamSize:8, collaborationIndex:65, teamCohesion:62, knowledgeSilos:50, onboardingLoad:1, conflictLevel:3, sharedTaskRatio:55, busFactor:2 },
      historical: { sevenDayTrend:12, thirtyDayAverage:68, velocityVariance:35, sprintBurndown:-6, seasonalPattern:65, upcomingLeave:7, projectDeadlines:12 },
      environmental: { workLocation:60, timeZoneSpread:5, toolProficiency:78, processMaturity:60, managementStyle:55, resourceAvailability:70 },
      wellbeing: { selfReportedStress:6, sleepQuality:6, exerciseFrequency:2, focusTimeBlocks:2, taskSatisfaction:50, careerGrowth:55 },
    }),
    history: [50,52,55,58,60,62,65,67,68,70,71,72,73,74],
    collaborators: ['alex','sara','priya'],
  },
  {
    id: 'raj', name: 'Raj Joshi', email: 'raj.joshi@workloadiq.com',
    role: 'ML Engineer', avatar: 'RJ', color: '#f59e0b', team: 't1',
    skills: ['PyTorch','Reinforcement Learning','Data Pipelines','MLflow'],
    joinedAt: '2021-09-20',
    inputs: makeInputs({
      individual: { activeTasks:8, weightedEffort:90, deadlinePressure:12, taskComplexity:8, contextSwitches:5, interruptionRate:3, dailyWorkHours:8, overtimeFrequency:1, breakCompliance:65, skillTaskMatch:88, learningCurve:30, communicationLoad:18, dependencyBlocks:2 },
      team: { teamSize:8, collaborationIndex:55, teamCohesion:75, knowledgeSilos:35, busFactor:4 },
      historical: { sevenDayTrend:5, thirtyDayAverage:60, velocityVariance:25, sprintBurndown:2, upcomingLeave:21 },
      wellbeing: { selfReportedStress:5, sleepQuality:7, exerciseFrequency:3, focusTimeBlocks:4, taskSatisfaction:72, careerGrowth:70 },
    }),
    history: [45,46,48,50,52,54,56,58,60,61,62,62,62,62],
    collaborators: ['alex','luis','priya'],
  },
  {
    id: 'sara', name: 'Sara Kim', email: 'sara.kim@workloadiq.com',
    role: 'Frontend Dev', avatar: 'SK', color: '#10b981', team: 't1',
    skills: ['React','CSS','Animation','Performance'],
    joinedAt: '2023-02-15',
    inputs: makeInputs({
      individual: { activeTasks:5, weightedEffort:60, deadlinePressure:18, taskComplexity:4, contextSwitches:3, interruptionRate:2, dailyWorkHours:7, overtimeFrequency:0, breakCompliance:85, skillTaskMatch:90, learningCurve:15, communicationLoad:12, dependencyBlocks:1 },
      team: { teamSize:8, collaborationIndex:60, teamCohesion:78, knowledgeSilos:25, busFactor:5 },
      historical: { sevenDayTrend:-5, thirtyDayAverage:38, velocityVariance:15 },
      wellbeing: { selfReportedStress:3, sleepQuality:8, exerciseFrequency:4, focusTimeBlocks:5, taskSatisfaction:85, careerGrowth:78 },
    }),
    history: [40,39,38,37,36,37,37,38,38,38,38,38,38,38],
    collaborators: ['maya','luis'],
  },
  {
    id: 'luis', name: 'Luis Torres', email: 'luis.torres@workloadiq.com',
    role: 'DevOps Engineer', avatar: 'LT', color: '#06b6d4', team: 't1',
    skills: ['Kubernetes','Terraform','AWS','CI/CD'],
    joinedAt: '2022-06-01',
    inputs: makeInputs({
      individual: { activeTasks:4, weightedEffort:45, deadlinePressure:22, taskComplexity:5, contextSwitches:3, interruptionRate:2, dailyWorkHours:7, overtimeFrequency:0, breakCompliance:90, skillTaskMatch:92, learningCurve:10, communicationLoad:10, dependencyBlocks:0 },
      team: { teamSize:8, collaborationIndex:50, teamCohesion:80, knowledgeSilos:20, busFactor:6 },
      historical: { sevenDayTrend:-8, thirtyDayAverage:25 },
      wellbeing: { selfReportedStress:2, sleepQuality:9, exerciseFrequency:5, focusTimeBlocks:6, taskSatisfaction:88, careerGrowth:80 },
    }),
    history: [32,30,28,26,25,24,24,25,25,25,25,25,25,25],
    collaborators: ['raj','sara'],
  },
  {
    id: 'priya', name: 'Priya Sharma', email: 'priya.sharma@workloadiq.com',
    role: 'Backend Engineer', avatar: 'PS', color: '#a855f7', team: 't1',
    skills: ['Go','PostgreSQL','Redis','GraphQL'],
    joinedAt: '2022-09-12',
    inputs: makeInputs({
      individual: { activeTasks:11, weightedEffort:130, deadlinePressure:8, taskComplexity:8, contextSwitches:6, interruptionRate:4, dailyWorkHours:9, overtimeFrequency:2, breakCompliance:55, skillTaskMatch:78, learningCurve:35, communicationLoad:22, dependencyBlocks:4 },
      team: { teamSize:8, collaborationIndex:75, teamCohesion:68, knowledgeSilos:55, busFactor:2 },
      historical: { sevenDayTrend:8, thirtyDayAverage:62, velocityVariance:28, sprintBurndown:-3 },
      wellbeing: { selfReportedStress:6, sleepQuality:6, exerciseFrequency:2, focusTimeBlocks:3, taskSatisfaction:62, careerGrowth:60 },
    }),
    history: [55,56,58,60,62,63,64,65,66,66,67,67,68,68],
    collaborators: ['alex','maya','raj'],
  },
  {
    id: 'tom', name: 'Tom Bennett', email: 'tom.bennett@workloadiq.com',
    role: 'QA Engineer', avatar: 'TB', color: '#84cc16', team: 't1',
    skills: ['Cypress','Playwright','Test Strategy','Automation'],
    joinedAt: '2023-04-03',
    inputs: makeInputs({
      individual: { activeTasks:6, weightedEffort:70, deadlinePressure:15, taskComplexity:6, contextSwitches:4, interruptionRate:3, dailyWorkHours:8, overtimeFrequency:1, breakCompliance:75, skillTaskMatch:82, learningCurve:25, communicationLoad:18, dependencyBlocks:2 },
      team: { teamSize:8, collaborationIndex:62, teamCohesion:72, knowledgeSilos:30, busFactor:4 },
      historical: { sevenDayTrend:2, thirtyDayAverage:48, velocityVariance:22 },
      wellbeing: { selfReportedStress:4, sleepQuality:7, exerciseFrequency:3, focusTimeBlocks:5, taskSatisfaction:75, careerGrowth:68 },
    }),
    history: [42,43,44,45,46,47,47,48,48,48,49,49,49,49],
    collaborators: ['maya','sara','priya'],
  },
  {
    id: 'nina', name: 'Nina Volkov', email: 'nina.volkov@workloadiq.com',
    role: 'Product Designer', avatar: 'NV', color: '#ec4899', team: 't1',
    skills: ['Figma','Prototyping','User Research','Design Systems'],
    joinedAt: '2022-11-08',
    inputs: makeInputs({
      individual: { activeTasks:7, weightedEffort:85, deadlinePressure:10, taskComplexity:5, contextSwitches:5, interruptionRate:4, dailyWorkHours:8, overtimeFrequency:1, breakCompliance:70, skillTaskMatch:85, learningCurve:18, communicationLoad:30, dependencyBlocks:2 },
      team: { teamSize:8, collaborationIndex:78, teamCohesion:75, knowledgeSilos:35, busFactor:3 },
      historical: { sevenDayTrend:0, thirtyDayAverage:52 },
      wellbeing: { selfReportedStress:4, sleepQuality:7, exerciseFrequency:4, focusTimeBlocks:4, taskSatisfaction:78, careerGrowth:72 },
    }),
    history: [48,49,50,51,52,52,53,53,53,53,54,54,54,54],
    collaborators: ['maya','sara','tom'],
  },
];

export const COLLABORATIONS: Collaboration[] = [
  { fromUserId:'alex',  toUserId:'maya',  intensity:72, sharedTasks:4, coordinationOverhead:18, synergyFactor:1.08, knowledgeTransferScore:8 },
  { fromUserId:'alex',  toUserId:'raj',   intensity:55, sharedTasks:2, coordinationOverhead:12, synergyFactor:1.05, knowledgeTransferScore:6 },
  { fromUserId:'alex',  toUserId:'priya', intensity:68, sharedTasks:3, coordinationOverhead:15, synergyFactor:1.10, knowledgeTransferScore:9 },
  { fromUserId:'maya',  toUserId:'sara',  intensity:81, sharedTasks:5, coordinationOverhead:20, synergyFactor:1.18, knowledgeTransferScore:7 },
  { fromUserId:'maya',  toUserId:'priya', intensity:58, sharedTasks:2, coordinationOverhead:11, synergyFactor:1.07, knowledgeTransferScore:5 },
  { fromUserId:'maya',  toUserId:'nina',  intensity:74, sharedTasks:4, coordinationOverhead:16, synergyFactor:1.15, knowledgeTransferScore:8 },
  { fromUserId:'raj',   toUserId:'luis',  intensity:48, sharedTasks:2, coordinationOverhead:10, synergyFactor:1.06, knowledgeTransferScore:6 },
  { fromUserId:'raj',   toUserId:'priya', intensity:62, sharedTasks:3, coordinationOverhead:14, synergyFactor:1.12, knowledgeTransferScore:8 },
  { fromUserId:'sara',  toUserId:'luis',  intensity:38, sharedTasks:1, coordinationOverhead:8,  synergyFactor:1.04, knowledgeTransferScore:4 },
  { fromUserId:'sara',  toUserId:'tom',   intensity:65, sharedTasks:3, coordinationOverhead:13, synergyFactor:1.10, knowledgeTransferScore:6 },
  { fromUserId:'tom',   toUserId:'priya', intensity:52, sharedTasks:2, coordinationOverhead:11, synergyFactor:1.06, knowledgeTransferScore:5 },
  { fromUserId:'nina',  toUserId:'sara',  intensity:70, sharedTasks:3, coordinationOverhead:14, synergyFactor:1.13, knowledgeTransferScore:7 },
  { fromUserId:'nina',  toUserId:'tom',   intensity:45, sharedTasks:2, coordinationOverhead:9,  synergyFactor:1.05, knowledgeTransferScore:5 },
];
