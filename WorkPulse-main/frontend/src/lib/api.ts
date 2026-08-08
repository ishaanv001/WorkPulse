import {
  TeamMember, WorkloadPrediction, FusionConfig, InputVector,
  ForecastResult, Collaboration, Alert, CollaborationImpact,
  Role, User, CheckpointSummary, AuditEvent, RateLimitTier,
  TeamMetrics, EscalationRule, RoleId
} from '../types';

const BASE = '/api';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...opts,
  });
  if (!res.ok && res.status >= 500) throw new Error(`Server error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'API error');
  return json.data as T;
}

export const api = {
  // Health
  health: () => req<any>('/health'),

  // Team
  getTeam: () => req<TeamMember[]>('/team'),
  getMember: (id: string) => req<TeamMember>(`/team/${id}`),
  updateInputs: (id: string, inputs: InputVector) =>
    req<{member: TeamMember; prediction: WorkloadPrediction}>(`/team/${id}/inputs`, {
      method: 'PATCH', body: JSON.stringify({ inputs }),
    }),

  // Predictions
  predictMember: (id: string, fusionConfig?: FusionConfig) =>
    req<WorkloadPrediction>(`/predict/${id}`, { method: 'POST', body: JSON.stringify({ fusionConfig }) }),
  predictAll: () =>
    req<Record<string, WorkloadPrediction>>('/predict/all', { method: 'POST', body: '{}' }),
  predictCustom: (inputs: InputVector, fusionConfig?: FusionConfig, memberId?: string) =>
    req<WorkloadPrediction>('/predict/custom', {
      method: 'POST', body: JSON.stringify({ inputs, fusionConfig, memberId }),
    }),

  // Fusion
  getFusionConfig: () => req<FusionConfig>('/fusion/config'),
  updateFusionConfig: (config: Partial<FusionConfig>) =>
    req<{config: FusionConfig; predictions: Record<string, WorkloadPrediction>}>('/fusion/config', {
      method: 'PATCH', body: JSON.stringify(config),
    }),

  // Fuzzy
  getRules: () => req<{total:number; rules:any[]}>('/fuzzy/rules'),
  getRulesByCategory: (cat: string) => req<any[]>(`/fuzzy/rules/${cat}`),

  // Forecasts
  getAllForecasts: () => req<Record<string, ForecastResult>>('/forecasts'),
  getForecast: (id: string) => req<ForecastResult>(`/forecasts/${id}`),
  regenerateForecast: (id: string, horizon = 7) =>
    req<ForecastResult>(`/forecasts/${id}/regenerate`, {
      method: 'POST', body: JSON.stringify({ horizon }),
    }),

  // Collaboration
  getCollaborations: () => req<Collaboration[]>('/collaborations'),
  getCollabImpact: (memberId: string) => req<CollaborationImpact>(`/collaborations/${memberId}/impact`),
  getKnowledgeSilos: () => req<Array<{memberId:string; risk:number; reason:string}>>('/collaborations/silos'),

  // Alerts
  getAlerts: () => req<Alert[]>('/alerts'),
  getEscalationRules: () => req<EscalationRule[]>('/alerts/rules'),

  // RBAC
  getRoles: () => req<Role[]>('/rbac/roles'),
  getUsers: () => req<User[]>('/rbac/users'),
  getRolePermissions: (roleId: RoleId) => req<{roleId:RoleId; permissions:string[]}>(`/rbac/permissions/${roleId}`),

  // Checkpoints
  getCheckpoints: () => req<CheckpointSummary[]>('/checkpoints'),
  createCheckpoint: (label: string, description?: string, type: 'manual'|'auto' = 'manual') =>
    req<{id:string; label:string; timestamp:string; size:number}>('/checkpoints', {
      method: 'POST', body: JSON.stringify({ label, description, type }),
    }),
  restoreCheckpoint: (id: string) =>
    req<{restored:boolean}>(`/checkpoints/${id}/restore`, { method: 'POST', body: '{}' }),
  deleteCheckpoint: (id: string) =>
    req<{deleted:boolean}>(`/checkpoints/${id}`, { method: 'DELETE' }),

  // Audit
  getAuditLog: (limit = 50) => req<{events:AuditEvent[]; total:number}>(`/audit?limit=${limit}`),

  // Rate limits
  getRateLimits: () => req<RateLimitTier[]>('/rate-limits'),

  // Metrics
  getTeamMetrics: () => req<TeamMetrics>('/metrics/team'),
};
