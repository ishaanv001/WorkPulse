import { v4 as uuid } from 'uuid';
import { query, queryOne, withTransaction } from './postgres';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from './redis';
import { TeamMember, WorkloadPrediction, FusionConfig, Checkpoint, AuditEvent, Alert } from '../types';

// ── CACHE KEYS ───────────────────────────────────────────────────────────────
const CK = {
  team:        ()          => 'wp:team:all',
  member:      (id: string) => `wp:member:${id}`,
  prediction:  (id: string) => `wp:pred:${id}`,
  predictions: ()           => 'wp:pred:all',
  forecast:    (id: string) => `wp:forecast:${id}`,
  fusion:      ()           => 'wp:fusion',
};

// ── TEAM MEMBERS ─────────────────────────────────────────────────────────────

export async function dbGetTeam(): Promise<TeamMember[]> {
  const cached = await cacheGet(CK.team());
  if (cached) return JSON.parse(cached);

  const rows = await query<any>(`
    SELECT id, name, email, role, avatar, color, team_name,
           inputs, history, skills, collaborators, joined_at
    FROM team_members ORDER BY name
  `);
  const team = rows.map(rowToMember);
  await cacheSet(CK.team(), JSON.stringify(team), 60);
  return team;
}

export async function dbGetMember(id: string): Promise<TeamMember | null> {
  const cached = await cacheGet(CK.member(id));
  if (cached) return JSON.parse(cached);

  const row = await queryOne<any>(
    `SELECT id, name, email, role, avatar, color, team_name,
            inputs, history, skills, collaborators, joined_at
     FROM team_members WHERE id = $1`,
    [id]
  );
  if (!row) return null;
  const member = rowToMember(row);
  await cacheSet(CK.member(id), JSON.stringify(member), 60);
  return member;
}

export async function dbUpsertMember(member: TeamMember): Promise<void> {
  await query(
    `INSERT INTO team_members (id, name, email, role, avatar, color, team_name, inputs, history, skills, collaborators)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET
       name=$2, email=$3, role=$4, avatar=$5, color=$6, team_name=$7,
       inputs=$8, history=$9, skills=$10, collaborators=$11,
       updated_at=NOW()`,
    [
      member.id, member.name, member.email, member.role, member.avatar,
      member.color, member.team, JSON.stringify(member.inputs),
      JSON.stringify(member.history), JSON.stringify(member.skills),
      JSON.stringify(member.collaborators),
    ]
  );
  await cacheDel(CK.member(member.id));
  await cacheDel(CK.team());
}

function rowToMember(row: any): TeamMember {
  return {
    id:            row.id,
    name:          row.name,
    email:         row.email,
    role:          row.role,
    avatar:        row.avatar,
    color:         row.color,
    team:          row.team_name,
    inputs:        typeof row.inputs === 'string' ? JSON.parse(row.inputs) : row.inputs,
    history:       typeof row.history === 'string' ? JSON.parse(row.history) : row.history,
    skills:        typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills,
    collaborators: typeof row.collaborators === 'string' ? JSON.parse(row.collaborators) : row.collaborators,
    joinedAt:      row.joined_at,
  };
}

// ── PREDICTIONS ──────────────────────────────────────────────────────────────

export async function dbGetPrediction(memberId: string): Promise<WorkloadPrediction | null> {
  const cached = await cacheGet(CK.prediction(memberId));
  if (cached) return JSON.parse(cached);

  const row = await queryOne<any>(
    'SELECT data FROM predictions WHERE member_id = $1',
    [memberId]
  );
  if (!row) return null;
  const pred = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  await cacheSet(CK.prediction(memberId), JSON.stringify(pred), 300);
  return pred;
}

export async function dbGetAllPredictions(): Promise<Record<string, WorkloadPrediction>> {
  const cached = await cacheGet(CK.predictions());
  if (cached) return JSON.parse(cached);

  const rows = await query<any>('SELECT member_id, data FROM predictions');
  const result: Record<string, WorkloadPrediction> = {};
  for (const row of rows) {
    result[row.member_id] = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  }
  await cacheSet(CK.predictions(), JSON.stringify(result), 300);
  return result;
}

export async function dbSavePrediction(memberId: string, pred: WorkloadPrediction): Promise<void> {
  await query(
    `INSERT INTO predictions (member_id, data) VALUES ($1, $2)
     ON CONFLICT (member_id) DO UPDATE SET data=$2, computed_at=NOW()`,
    [memberId, JSON.stringify(pred)]
  );
  await cacheDel(CK.prediction(memberId));
  await cacheDel(CK.predictions());
}

// ── FORECASTS ────────────────────────────────────────────────────────────────

export async function dbGetForecast(memberId: string): Promise<any | null> {
  const cached = await cacheGet(CK.forecast(memberId));
  if (cached) return JSON.parse(cached);

  const row = await queryOne<any>('SELECT data FROM forecasts WHERE member_id = $1', [memberId]);
  if (!row) return null;
  const forecast = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  await cacheSet(CK.forecast(memberId), JSON.stringify(forecast), 600);
  return forecast;
}

export async function dbSaveForecast(memberId: string, forecast: any): Promise<void> {
  await query(
    `INSERT INTO forecasts (member_id, data) VALUES ($1, $2)
     ON CONFLICT (member_id) DO UPDATE SET data=$2, computed_at=NOW()`,
    [memberId, JSON.stringify(forecast)]
  );
  await cacheDel(CK.forecast(memberId));
}

// ── FUSION CONFIG ─────────────────────────────────────────────────────────────

export async function dbGetFusionConfig(): Promise<FusionConfig> {
  const cached = await cacheGet(CK.fusion());
  if (cached) return JSON.parse(cached);

  const row = await queryOne<any>(
    'SELECT * FROM fusion_config ORDER BY id DESC LIMIT 1'
  );
  const config: FusionConfig = row
    ? {
        mamdaniWeight:   parseFloat(row.mamdani_weight),
        sugenoWeight:    parseFloat(row.sugeno_weight),
        nnWeight:        parseFloat(row.nn_weight),
        strategy:        row.strategy,
        mlRefinement:    row.ml_refinement,
        adaptiveLearning: row.adaptive,
      }
    : { mamdaniWeight:0.45, sugenoWeight:0.30, nnWeight:0.25,
        strategy:'weighted_average', mlRefinement:true, adaptiveLearning:false };

  await cacheSet(CK.fusion(), JSON.stringify(config), 3600);
  return config;
}

export async function dbSaveFusionConfig(config: Partial<FusionConfig>): Promise<void> {
  await query(
    `UPDATE fusion_config SET
       mamdani_weight  = COALESCE($1, mamdani_weight),
       sugeno_weight   = COALESCE($2, sugeno_weight),
       nn_weight       = COALESCE($3, nn_weight),
       strategy        = COALESCE($4, strategy),
       ml_refinement   = COALESCE($5, ml_refinement),
       updated_at      = NOW()
     WHERE id = (SELECT id FROM fusion_config ORDER BY id DESC LIMIT 1)`,
    [
      config.mamdaniWeight ?? null,
      config.sugenoWeight  ?? null,
      config.nnWeight      ?? null,
      config.strategy      ?? null,
      config.mlRefinement  ?? null,
    ]
  );
  await cacheDel(CK.fusion());
}

// ── CHECKPOINTS ──────────────────────────────────────────────────────────────

export async function dbGetCheckpoints(): Promise<Checkpoint[]> {
  const rows = await query<any>(
    `SELECT id, label, description, type, snapshot, size_bytes, created_by, created_at
     FROM checkpoints ORDER BY created_at DESC`
  );
  return rows.map(r => ({
    id: r.id, label: r.label, description: r.description, type: r.type,
    snapshot: typeof r.snapshot === 'string' ? JSON.parse(r.snapshot) : r.snapshot,
    size: r.size_bytes, createdBy: r.created_by, timestamp: r.created_at,
  })) as any[];
}

export async function dbSaveCheckpoint(cp: Omit<Checkpoint, 'id'>): Promise<Checkpoint> {
  const id = uuid();
  const snapshotStr = JSON.stringify(cp.snapshot);
  await query(
    `INSERT INTO checkpoints (id, label, description, type, snapshot, size_bytes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, cp.label, cp.description ?? null, (cp as any).type ?? 'manual', snapshotStr, snapshotStr.length, (cp as any).createdBy ?? 'user']
  );

  // Rotate: keep only 50 manual, 10 auto
  await query(`
    DELETE FROM checkpoints
    WHERE type = 'manual'
      AND id NOT IN (
        SELECT id FROM checkpoints WHERE type='manual' ORDER BY created_at DESC LIMIT 50
      )
  `);
  await query(`
    DELETE FROM checkpoints
    WHERE type = 'auto'
      AND id NOT IN (
        SELECT id FROM checkpoints WHERE type='auto' ORDER BY created_at DESC LIMIT 10
      )
  `);

  return { ...cp, id } as any;
}

export async function dbDeleteCheckpoint(id: string): Promise<boolean> {
  const rows = await query('DELETE FROM checkpoints WHERE id=$1 RETURNING id', [id]);
  return rows.length > 0;
}

// ── AUDIT LOG ────────────────────────────────────────────────────────────────

export async function dbAppendAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
  const id = uuid();
  await query(
    `INSERT INTO audit_events (id, user_id, user_name, action, resource_type, resource_id, details, ip_address, level)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id, event.userId, event.userName, event.action,
      event.resourceType, event.resourceId ?? null,
      JSON.stringify(event.details), event.ipAddress ?? null, event.level,
    ]
  );
}

export async function dbGetAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const rows = await query<any>(
    'SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT $1',
    [limit]
  );
  return rows.map(r => ({
    id: r.id, timestamp: r.timestamp, userId: r.user_id, userName: r.user_name,
    action: r.action, resourceType: r.resource_type, resourceId: r.resource_id,
    details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
    ipAddress: r.ip_address, level: r.level,
  }));
}
