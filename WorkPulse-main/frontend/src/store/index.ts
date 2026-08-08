import { create } from 'zustand';
import { api } from '../lib/api';
import {
  TeamMember, WorkloadPrediction, Alert, Collaboration, ForecastResult,
  CheckpointSummary, AuditEvent, RateLimitTier, Role, FusionConfig,
  TeamMetrics, ViewId, RoleId, InputVector, EscalationRule
} from '../types';

interface StoreState {
  // Data
  team: TeamMember[];
  predictions: Record<string, WorkloadPrediction>;
  forecasts: Record<string, ForecastResult>;
  collaborations: Collaboration[];
  alerts: Alert[];
  checkpoints: CheckpointSummary[];
  auditEvents: AuditEvent[];
  rateLimits: RateLimitTier[];
  roles: Role[];
  escalationRules: EscalationRule[];
  fusionConfig: FusionConfig;
  metrics: TeamMetrics | null;

  // UI
  selectedId: string;
  view: ViewId;
  currentRole: RoleId;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  init: (force?: boolean) => Promise<void>;
  selectMember: (id: string) => void;
  setView: (view: ViewId) => void;
  setRole: (role: RoleId) => void;
  updateInputs: (id: string, inputs: InputVector) => Promise<void>;
  runAll: () => Promise<void>;
  setFusion: (config: Partial<FusionConfig>) => Promise<void>;
  saveCheckpoint: (label: string, description?: string) => Promise<void>;
  restoreCheckpoint: (id: string) => Promise<void>;
  deleteCheckpoint: (id: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshAudit: () => Promise<void>;
}

// In-flight guard — shared promise so concurrent mount calls share one request
let _initPromise: Promise<void> | null = null;

export const useStore = create<StoreState>((set, get) => ({
  team: [],
  predictions: {},
  forecasts: {},
  collaborations: [],
  alerts: [],
  checkpoints: [],
  auditEvents: [],
  rateLimits: [],
  roles: [],
  escalationRules: [],
  fusionConfig: { mamdaniWeight:0.45, sugenoWeight:0.30, nnWeight:0.25, strategy:'weighted_average', mlRefinement:true, adaptiveLearning:true },
  metrics: null,

  selectedId: 'alex',
  view: 'dashboard',
  currentRole: 'manager',
  loading: true,
  initialized: false,
  error: null,

  init: async (force = false) => {
    // Already done — skip
    if (!force && get().initialized) return;
    // Already in-flight — share that promise
    if (!force && _initPromise) return _initPromise;

    _initPromise = (async () => {
      set({ loading: true, error: null });
      try {
        const [team, predictions, forecasts, collaborations, alerts, roles, fusionConfig, checkpoints, audit, rateLimits, metrics, escalationRules] = await Promise.all([
          api.getTeam(),
          api.predictAll(),
          api.getAllForecasts(),
          api.getCollaborations(),
          api.getAlerts(),
          api.getRoles(),
          api.getFusionConfig(),
          api.getCheckpoints(),
          api.getAuditLog(50),
          api.getRateLimits(),
          api.getTeamMetrics(),
          api.getEscalationRules(),
        ]);
        set({
          team, predictions, forecasts, collaborations, alerts, roles,
          fusionConfig, checkpoints, auditEvents: audit.events, rateLimits,
          metrics, escalationRules,
          loading: false,
          initialized: true,
        });
      } catch (err: any) {
        set({ loading: false, error: err?.message ?? 'Init failed' });
      } finally {
        _initPromise = null;
      }
    })();

    return _initPromise;
  },

  selectMember: (id) => set({ selectedId: id }),
  setView: (view) => set({ view }),
  setRole: (currentRole) => set({ currentRole }),

  updateInputs: async (id, inputs) => {
    try {
      const result = await api.updateInputs(id, inputs);
      const team = get().team.map(m => m.id === id ? result.member : m);
      const predictions = { ...get().predictions, [id]: result.prediction };
      const [forecast, alerts, metrics] = await Promise.all([
        api.getForecast(id),
        api.getAlerts(),
        api.getTeamMetrics(),
      ]);
      set({
        team, predictions,
        forecasts: { ...get().forecasts, [id]: forecast },
        alerts, metrics,
      });
    } catch (err: any) {
      set({ error: err?.message });
    }
  },

  runAll: async () => {
    const [predictions, forecasts, alerts, metrics] = await Promise.all([
      api.predictAll(), api.getAllForecasts(), api.getAlerts(), api.getTeamMetrics(),
    ]);
    set({ predictions, forecasts, alerts, metrics });
  },

  setFusion: async (config) => {
    const result = await api.updateFusionConfig(config);
    const [forecasts, alerts, metrics] = await Promise.all([
      api.getAllForecasts(), api.getAlerts(), api.getTeamMetrics(),
    ]);
    set({ fusionConfig: result.config, predictions: result.predictions, forecasts, alerts, metrics });
  },

  saveCheckpoint: async (label, description) => {
    await api.createCheckpoint(label, description);
    const [checkpoints, audit] = await Promise.all([api.getCheckpoints(), api.getAuditLog(50)]);
    set({ checkpoints, auditEvents: audit.events });
  },

  restoreCheckpoint: async (id) => {
    await api.restoreCheckpoint(id);
    await get().init();
  },

  deleteCheckpoint: async (id) => {
    await api.deleteCheckpoint(id);
    set({ checkpoints: get().checkpoints.filter(c => c.id !== id) });
  },

  refreshAlerts: async () => {
    const alerts = await api.getAlerts();
    set({ alerts });
  },

  refreshAudit: async () => {
    const audit = await api.getAuditLog(50);
    set({ auditEvents: audit.events });
  },
}));
