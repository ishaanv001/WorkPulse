import { TeamMember, WorkloadPrediction, FusionConfig, InputVector } from '../types';
import { TEAM, COLLABORATIONS } from './team';
import { hybridInference, DEFAULT_FUSION } from '../core/fuzzy/hybrid';
import { generateForecast } from '../core/forecast/lstm';
import { evaluateAlerts } from '../core/alerts/escalation';
import {
  dbGetTeam, dbGetMember, dbUpsertMember,
  dbGetPrediction, dbGetAllPredictions, dbSavePrediction,
  dbGetForecast, dbSaveForecast,
  dbGetFusionConfig, dbSaveFusionConfig,
  dbGetCheckpoints, dbSaveCheckpoint, dbDeleteCheckpoint,
  dbAppendAudit, dbGetAuditEvents,
} from '../db/repository';
import { testConnection } from '../db/postgres';

let useDB = false;

// ── In-memory fallback ────────────────────────────────────────────────────────
let memTeam: TeamMember[] = [];
let memPredictions: Record<string, WorkloadPrediction> = {};
let memForecasts: Record<string, ReturnType<typeof generateForecast>> = {};
let memFusion: FusionConfig = DEFAULT_FUSION;
let memCheckpoints: any[] = [];
let memAuditEvents: any[] = [];

class StateManager {
  private collaborations = COLLABORATIONS;

  async initialize(): Promise<void> {
    useDB = await testConnection();

    if (useDB) {
      console.log('[State] PostgreSQL connected — loading from DB');
      const existing = await dbGetTeam();
      if (existing.length === 0) {
        console.log('[State] Seeding team members to DB');
        for (const m of TEAM) await dbUpsertMember(m);
      }
      const team = await dbGetTeam();
      const preds = await dbGetAllPredictions();
      // Run predictions for any member without one
      for (const m of team) {
        if (!preds[m.id]) {
          const pred = hybridInference(m.inputs, DEFAULT_FUSION, m.id);
          await dbSavePrediction(m.id, pred);
          const fc = generateForecast(m.id, m.inputs, pred.score);
          await dbSaveForecast(m.id, fc);
        }
      }
    } else {
      console.log('[State] DB unavailable — using in-memory state');
      memTeam = JSON.parse(JSON.stringify(TEAM));
      this._runAllMem();
    }
  }

  private _runAllMem() {
    for (const m of memTeam) {
      memPredictions[m.id] = hybridInference(m.inputs, memFusion, m.id);
      memForecasts[m.id]   = generateForecast(m.id, m.inputs, memPredictions[m.id].score);
    }
  }

  async getTeam(): Promise<TeamMember[]> {
    return useDB ? dbGetTeam() : memTeam;
  }

  async getMember(id: string): Promise<TeamMember | null> {
    if (useDB) return dbGetMember(id);
    return memTeam.find(m => m.id === id) ?? null;
  }

  getCollaborations() { return this.collaborations; }

  async getPredictions(): Promise<Record<string, WorkloadPrediction>> {
    return useDB ? dbGetAllPredictions() : memPredictions;
  }

  async getPrediction(id: string): Promise<WorkloadPrediction | null> {
    return useDB ? dbGetPrediction(id) : (memPredictions[id] ?? null);
  }

  async getForecasts(): Promise<Record<string, any>> {
    if (useDB) {
      const team = await dbGetTeam();
      const result: Record<string, any> = {};
      for (const m of team) { result[m.id] = await dbGetForecast(m.id); }
      return result;
    }
    return memForecasts;
  }

  async getForecast(id: string): Promise<any | null> {
    return useDB ? dbGetForecast(id) : (memForecasts[id] ?? null);
  }

  async getFusionConfig(): Promise<FusionConfig> {
    return useDB ? dbGetFusionConfig() : memFusion;
  }

  async updateMemberInputs(id: string, inputs: InputVector): Promise<TeamMember | null> {
    if (useDB) {
      const m = await dbGetMember(id);
      if (!m) return null;
      const updated = { ...m, inputs };
      await dbUpsertMember(updated);
      return this.runPrediction(id).then(() => updated);
    }
    const idx = memTeam.findIndex(m => m.id === id);
    if (idx === -1) return null;
    memTeam[idx] = { ...memTeam[idx], inputs };
    await this.runPrediction(id);
    return memTeam[idx];
  }

  async setFusionConfig(config: Partial<FusionConfig>): Promise<void> {
    if (useDB) {
      await dbSaveFusionConfig(config);
      await this.runAllPredictions();
    } else {
      memFusion = { ...memFusion, ...config };
      this._runAllMem();
    }
  }

  async runPrediction(memberId: string): Promise<void> {
    const member = await this.getMember(memberId);
    if (!member) return;
    const fusion = await this.getFusionConfig();
    const pred   = hybridInference(member.inputs, fusion, memberId);
    const fc     = generateForecast(memberId, member.inputs, pred.score);
    if (useDB) {
      await dbSavePrediction(memberId, pred);
      await dbSaveForecast(memberId, fc);
    } else {
      memPredictions[memberId] = pred;
      memForecasts[memberId]   = fc;
    }
  }

  async runAllPredictions(): Promise<void> {
    const team   = await this.getTeam();
    const fusion = await this.getFusionConfig();
    for (const m of team) {
      const pred = hybridInference(m.inputs, fusion, m.id);
      const fc   = generateForecast(m.id, m.inputs, pred.score);
      if (useDB) {
        await dbSavePrediction(m.id, pred);
        await dbSaveForecast(m.id, fc);
      } else {
        memPredictions[m.id] = pred;
        memForecasts[m.id]   = fc;
      }
    }
  }

  async getActiveAlerts() {
    const [team, preds] = await Promise.all([this.getTeam(), this.getPredictions()]);
    return evaluateAlerts(team, preds);
  }

  async restoreSnapshot(team: TeamMember[], predictions: Record<string, WorkloadPrediction>): Promise<void> {
    if (useDB) {
      for (const m of team) { await dbUpsertMember(m); }
      for (const [id, pred] of Object.entries(predictions)) {
        await dbSavePrediction(id, pred);
        const fc = generateForecast(id, team.find(m => m.id === id)!.inputs, pred.score);
        await dbSaveForecast(id, fc);
      }
    } else {
      memTeam = team;
      memPredictions = predictions;
      for (const m of memTeam) {
        memForecasts[m.id] = generateForecast(m.id, m.inputs, predictions[m.id]?.score ?? 50);
      }
    }
  }

  // Checkpoints — DB if available, else in-memory
  async getCheckpoints(): Promise<any[]> {
    if (useDB) return dbGetCheckpoints();
    return memCheckpoints;
  }
  async saveCheckpoint(cp: any): Promise<any> {
    if (useDB) return dbSaveCheckpoint(cp);
    const { v4: uuid } = await import('uuid');
    const saved = { ...cp, id: uuid(), timestamp: new Date().toISOString(), size: JSON.stringify(cp.snapshot).length };
    memCheckpoints.unshift(saved);
    if (memCheckpoints.length > 50) memCheckpoints = memCheckpoints.slice(0, 50);
    return saved;
  }
  async deleteCheckpoint(id: string): Promise<boolean> {
    if (useDB) return dbDeleteCheckpoint(id);
    const before = memCheckpoints.length;
    memCheckpoints = memCheckpoints.filter(c => c.id !== id);
    return memCheckpoints.length < before;
  }

  // Audit log — DB if available, else in-memory ring buffer
  appendAudit(ev: any): Promise<void> {
    if (useDB) return dbAppendAudit(ev);
    const event = { ...ev, id: Math.random().toString(36).slice(2), timestamp: new Date().toISOString() };
    memAuditEvents.unshift(event);
    if (memAuditEvents.length > 500) memAuditEvents = memAuditEvents.slice(0, 500);
    return Promise.resolve();
  }
  getAuditEvents(limit = 100): Promise<any[]> {
    if (useDB) return dbGetAuditEvents(limit);
    return Promise.resolve(memAuditEvents.slice(0, limit));
  }

  getRateLimits() {
    return [
      { tier: 'Public API',     limit: 100,  used: 0,  windowMs: 900000 },
      { tier: 'Authenticated',  limit: 500,  used: 0,  windowMs: 900000 },
      { tier: 'AI Predictions', limit: 20,   used: 0,  windowMs: 900000 },
    ];
  }
}

export const state = new StateManager();
