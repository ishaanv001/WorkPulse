// ── ENUMS ────────────────────────────────────────────────────────────────────
export type WorkloadLevel = 'Normal' | 'Busy' | 'Overloaded' | 'Burnout Risk';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type FusionStrategy = 'weighted_average' | 'contextual_switch' | 'ensemble' | 'adaptive';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type Trend = 'improving' | 'stable' | 'worsening';
export type ViewId = 'dashboard' | 'fuzzy' | 'ml' | 'members' | 'collaboration' | 'forecast' | 'alerts' | 'rbac' | 'checkpoints' | 'audit' | 'settings';
export type RoleId = 'member' | 'team_lead' | 'manager' | 'admin' | 'hr' | 'executive';

// ── INPUTS ───────────────────────────────────────────────────────────────────
export interface IndividualMetrics {
  activeTasks: number; weightedEffort: number; deadlinePressure: number; taskComplexity: number;
  contextSwitches: number; interruptionRate: number; dailyWorkHours: number; overtimeFrequency: number;
  breakCompliance: number; skillTaskMatch: number; learningCurve: number; communicationLoad: number; dependencyBlocks: number;
}
export interface TeamDynamics {
  teamSize: number; collaborationIndex: number; teamCohesion: number; knowledgeSilos: number;
  onboardingLoad: number; conflictLevel: number; sharedTaskRatio: number; busFactor: number;
}
export interface HistoricalMetrics {
  sevenDayTrend: number; thirtyDayAverage: number; velocityVariance: number; sprintBurndown: number;
  seasonalPattern: number; upcomingLeave: number; projectDeadlines: number;
}
export interface EnvironmentalFactors {
  workLocation: number; timeZoneSpread: number; toolProficiency: number; processMaturity: number;
  managementStyle: number; resourceAvailability: number;
}
export interface WellbeingMetrics {
  selfReportedStress: number; sleepQuality: number; exerciseFrequency: number;
  focusTimeBlocks: number; taskSatisfaction: number; careerGrowth: number;
}
export interface InputVector {
  individual: IndividualMetrics; team: TeamDynamics; historical: HistoricalMetrics;
  environmental: EnvironmentalFactors; wellbeing: WellbeingMetrics;
}

// ── PREDICTIONS ──────────────────────────────────────────────────────────────
export interface MembershipDegree { veryLow:number; low:number; medium:number; high:number; veryHigh:number; }
export interface FiredRule { id:string; rule:string; strength:number; impact:number; consequent:string; category:string; }
export interface MamdaniResult { score:number; membership:MembershipDegree; firedRules:FiredRule[]; ruleCount:number; aggregationMethod:string; }
export interface SugenoResult { score:number; coefficients:number[]; outputFunction:string; firingStrengths:number[]; ruleOutputs:number[]; }
export interface ShapValue { featureName:string; value:number; direction:'increasing'|'decreasing'; category:string; }
export interface NeuralNetworkResult { score:number; layerActivations:number[][]; confidenceCalibration:number; }
export interface EnsembleResult { finalScore:number; fuzzyScore:number; nnScore:number; agreementScore:number; weightedConfidence:number; }
export interface ActionItem { id:string; priority:'low'|'medium'|'high'|'critical'; category:string; title:string; description:string; expectedImpact:number; effort:'low'|'medium'|'high'; }
export interface FusionConfig { mamdaniWeight:number; sugenoWeight:number; nnWeight:number; strategy:FusionStrategy; mlRefinement:boolean; adaptiveLearning:boolean; }
export interface WorkloadPrediction {
  memberId:string; score:number; level:WorkloadLevel;
  confidence:number; confidenceLevel:ConfidenceLevel;
  riskLevel:RiskLevel; predictedTrend:Trend;
  mamdani:MamdaniResult; sugeno:SugenoResult;
  neuralNet:NeuralNetworkResult; ensemble:EnsembleResult;
  shapValues:ShapValue[]; recommendations:string[];
  actionItems:ActionItem[]; timestamp:string; fusionConfig:FusionConfig;
}

// ── TEAM ─────────────────────────────────────────────────────────────────────
export interface TeamMember {
  id:string; name:string; email:string; role:string;
  avatar:string; color:string; team:string;
  inputs:InputVector; history:number[];
  collaborators:string[]; skills:string[]; joinedAt:string;
}

// ── COLLABORATION ────────────────────────────────────────────────────────────
export interface Collaboration {
  fromUserId:string; toUserId:string;
  intensity:number; sharedTasks:number;
  coordinationOverhead:number; synergyFactor:number; knowledgeTransferScore:number;
}
export interface CollaborationImpact {
  coordinationOverhead:number; knowledgeTransferBenefit:number;
  synergyFactor:number; conflictPenalty:number; netImpact:number; brookesLawPaths:number;
}

// ── FORECAST ─────────────────────────────────────────────────────────────────
export interface ForecastPoint {
  date:string; score:number; confidence:number; lower:number; upper:number;
  modelContributions?:{ lstm:number; arima:number; ensemble:number };
}
export interface ForecastResult {
  memberId:string; points:ForecastPoint[]; horizon:number; model:string; mae:number; rmse:number;
}

// ── ALERTS ───────────────────────────────────────────────────────────────────
export interface Alert {
  id:string; severity:AlertSeverity; type:string;
  title:string; body:string; memberId?:string; teamId?:string;
  triggeredBy:string; threshold:number; currentValue:number;
  timestamp:string; dismissed:boolean; acknowledged:boolean;
  recommendedActions:string[];
}
export interface EscalationRule {
  id:string; name:string; condition:string; severity:AlertSeverity;
  threshold:number; cooldownMinutes:number; actions:string[]; active:boolean;
}

// ── RBAC ─────────────────────────────────────────────────────────────────────
export type Permission = string;
export interface Role {
  id:RoleId; name:string; description:string;
  permissions:Permission[]; inheritsFrom?:RoleId[]; color:string;
}
export interface User {
  id:string; name:string; email:string;
  roles:RoleId[]; teamIds:string[]; avatar:string;
}

// ── CHECKPOINT ───────────────────────────────────────────────────────────────
export interface CheckpointSummary {
  id:string; label:string; description?:string;
  timestamp:string; type:'manual'|'auto'|'incremental'; createdBy:string;
  size:number; memberCount:number;
}

// ── AUDIT ────────────────────────────────────────────────────────────────────
export interface AuditEvent {
  id:string; timestamp:string; userId:string; userName:string;
  action:string; resourceType:string; resourceId?:string;
  details:Record<string,any>; ipAddress?:string;
  level:'info'|'warning'|'critical';
}

// ── RATE LIMIT ───────────────────────────────────────────────────────────────
export interface RateLimitTier {
  tier:string; limit:number; used:number; windowMs:number; resetAt:string;
}

// ── METRICS ──────────────────────────────────────────────────────────────────
export interface TeamMetrics {
  avgScore:number; burnoutCount:number; overloadedCount:number;
  teamSize:number; avgConfidence:number;
  totalRulesFired:number; ruleBaseSize:number; timestamp:string;
}
