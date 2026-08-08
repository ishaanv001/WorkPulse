// ── WORKLOAD CLASSIFICATIONS ──────────────────────────────────────────────────
export type WorkloadLevel = 'Normal' | 'Busy' | 'Overloaded' | 'Burnout Risk';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FusionStrategy = 'weighted_average' | 'contextual_switch' | 'ensemble' | 'adaptive';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type Trend = 'improving' | 'stable' | 'worsening';

// ── INDIVIDUAL METRICS (13 params) ───────────────────────────────────────────
export interface IndividualMetrics {
  activeTasks: number; weightedEffort: number; deadlinePressure: number;
  taskComplexity: number; contextSwitches: number; interruptionRate: number;
  dailyWorkHours: number; overtimeFrequency: number; breakCompliance: number;
  skillTaskMatch: number; learningCurve: number; communicationLoad: number;
  dependencyBlocks: number;
}

// ── TEAM DYNAMICS (8 params) ─────────────────────────────────────────────────
export interface TeamDynamics {
  teamSize: number; collaborationIndex: number; teamCohesion: number;
  knowledgeSilos: number; onboardingLoad: number; conflictLevel: number;
  sharedTaskRatio: number; busFactor: number;
}

// ── HISTORICAL (7 params) ────────────────────────────────────────────────────
export interface HistoricalMetrics {
  sevenDayTrend: number; thirtyDayAverage: number; velocityVariance: number;
  sprintBurndown: number; seasonalPattern: number; upcomingLeave: number;
  projectDeadlines: number;
}

// ── ENVIRONMENTAL (6 params) ─────────────────────────────────────────────────
export interface EnvironmentalFactors {
  workLocation: number; timeZoneSpread: number; toolProficiency: number;
  processMaturity: number; managementStyle: number; resourceAvailability: number;
}

// ── WELLBEING (6 params) ─────────────────────────────────────────────────────
export interface WellbeingMetrics {
  selfReportedStress: number; sleepQuality: number; exerciseFrequency: number;
  focusTimeBlocks: number; taskSatisfaction: number; careerGrowth: number;
}

export interface InputVector {
  individual: IndividualMetrics;
  team: TeamDynamics;
  historical: HistoricalMetrics;
  environmental: EnvironmentalFactors;
  wellbeing: WellbeingMetrics;
}

// ── FUZZY RESULTS ────────────────────────────────────────────────────────────
export interface MembershipDegree {
  veryLow: number; low: number; medium: number; high: number; veryHigh: number;
}
export interface FiredRule {
  id: string; rule: string; strength: number; impact: number; consequent: string;
  category: string;
}
export interface MamdaniResult {
  score: number; membership: MembershipDegree; firedRules: FiredRule[];
  ruleCount: number; aggregationMethod: string;
}
export interface SugenoResult {
  score: number; coefficients: number[]; outputFunction: string;
  firingStrengths: number[]; ruleOutputs: number[];
}

// ── ML ───────────────────────────────────────────────────────────────────────
export interface ShapValue {
  featureName: string; value: number; direction: 'increasing' | 'decreasing'; category: string;
}
export interface NeuralNetworkResult {
  score: number; layerActivations: number[][]; confidenceCalibration: number;
}
export interface EnsembleResult {
  finalScore: number; fuzzyScore: number; nnScore: number;
  agreementScore: number; weightedConfidence: number;
}

export interface WorkloadPrediction {
  memberId: string; score: number; level: WorkloadLevel;
  confidence: number; confidenceLevel: ConfidenceLevel;
  riskLevel: RiskLevel; predictedTrend: Trend;
  mamdani: MamdaniResult; sugeno: SugenoResult;
  neuralNet: NeuralNetworkResult; ensemble: EnsembleResult;
  shapValues: ShapValue[]; recommendations: string[];
  actionItems: ActionItem[]; timestamp: string;
  fusionConfig: FusionConfig;
}

export interface ActionItem {
  id: string; priority: 'low' | 'medium' | 'high' | 'critical';
  category: string; title: string; description: string;
  expectedImpact: number; effort: 'low' | 'medium' | 'high';
}

export interface FusionConfig {
  mamdaniWeight: number; sugenoWeight: number; nnWeight: number;
  strategy: FusionStrategy; mlRefinement: boolean; adaptiveLearning: boolean;
}

// ── TEAM ─────────────────────────────────────────────────────────────────────
export interface TeamMember {
  id: string; name: string; email: string; role: string;
  avatar: string; color: string; team: string;
  inputs: InputVector; history: number[];
  collaborators: string[]; skills: string[]; joinedAt: string;
}

// ── COLLABORATION ────────────────────────────────────────────────────────────
export interface Collaboration {
  fromUserId: string; toUserId: string;
  intensity: number; sharedTasks: number;
  coordinationOverhead: number; synergyFactor: number;
  knowledgeTransferScore: number;
}
export interface CollaborationImpact {
  coordinationOverhead: number; knowledgeTransferBenefit: number;
  synergyFactor: number; conflictPenalty: number; netImpact: number;
  brookesLawPaths: number;
}

// ── FORECAST ─────────────────────────────────────────────────────────────────
export interface ForecastPoint {
  date: string; score: number; confidence: number; lower: number; upper: number;
  modelContributions?: { lstm: number; arima: number; ensemble: number };
}
export interface ForecastResult {
  memberId: string; points: ForecastPoint[];
  horizon: number; model: string; mae: number; rmse: number;
}

// ── ALERTS ───────────────────────────────────────────────────────────────────
export interface Alert {
  id: string; severity: AlertSeverity; type: string;
  title: string; body: string; memberId?: string; teamId?: string;
  triggeredBy: string; threshold: number; currentValue: number;
  timestamp: string; dismissed: boolean; acknowledged: boolean;
  recommendedActions: string[];
}
export interface EscalationRule {
  id: string; name: string; condition: string; severity: AlertSeverity;
  threshold: number; cooldownMinutes: number; actions: string[];
  active: boolean;
}

// ── RBAC ─────────────────────────────────────────────────────────────────────
export type Permission =
  | 'workload:view:own' | 'workload:view:team' | 'workload:view:all' | 'workload:export'
  | 'workload:edit:own' | 'workload:edit:team' | 'workload:edit:all'
  | 'task:create' | 'task:edit:own' | 'task:edit:team' | 'task:delete' | 'task:assign'
  | 'team:view:members' | 'team:manage' | 'team:remove:member' | 'team:invite'
  | 'analytics:view:basic' | 'analytics:view:advanced' | 'analytics:view:predictive'
  | 'fuzzy:configure' | 'ml:retrain' | 'ml:export'
  | 'admin:users:manage' | 'admin:system:configure' | 'admin:audit:view' | 'admin:rbac:manage'
  | 'checkpoint:create' | 'checkpoint:restore' | 'checkpoint:delete';

export type RoleId = 'member' | 'team_lead' | 'manager' | 'admin' | 'hr' | 'executive';

export interface Role {
  id: RoleId; name: string; description: string;
  permissions: Permission[]; inheritsFrom?: RoleId[]; color: string;
}
export interface User {
  id: string; name: string; email: string;
  roles: RoleId[]; teamIds: string[]; avatar: string;
}

// ── CHECKPOINTS ──────────────────────────────────────────────────────────────
export interface Checkpoint {
  id: string; label: string; description?: string;
  timestamp: string; createdBy: string;
  snapshot: { team: TeamMember[]; predictions: Record<string, WorkloadPrediction> };
  size: number; type: 'manual' | 'auto' | 'incremental';
}

// ── AUDIT ────────────────────────────────────────────────────────────────────
export interface AuditEvent {
  id: string; timestamp: string; userId: string; userName: string;
  action: string; resourceType: string; resourceId?: string;
  details: Record<string, any>; ipAddress?: string;
  level: 'info' | 'warning' | 'critical';
}

// ── RATE LIMIT ───────────────────────────────────────────────────────────────
export interface RateLimitTier {
  tier: string; limit: number; used: number;
  windowMs: number; resetAt: string;
}
