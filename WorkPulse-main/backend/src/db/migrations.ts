import { query } from './postgres';

const MIGRATIONS = [
  {
    id: 1,
    name: 'initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Team members with JSONB inputs for flexibility
      CREATE TABLE IF NOT EXISTS team_members (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        role        TEXT NOT NULL,
        avatar      TEXT NOT NULL DEFAULT '',
        color       TEXT NOT NULL DEFAULT '#00d4f5',
        team_name   TEXT NOT NULL DEFAULT 'Engineering',
        inputs      JSONB NOT NULL DEFAULT '{}',
        history     JSONB NOT NULL DEFAULT '[]',
        skills      JSONB NOT NULL DEFAULT '[]',
        collaborators JSONB NOT NULL DEFAULT '[]',
        joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Latest prediction per member (upsert on predict)
      CREATE TABLE IF NOT EXISTS predictions (
        member_id   TEXT PRIMARY KEY REFERENCES team_members(id) ON DELETE CASCADE,
        data        JSONB NOT NULL,
        computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Forecast cache per member
      CREATE TABLE IF NOT EXISTS forecasts (
        member_id   TEXT PRIMARY KEY REFERENCES team_members(id) ON DELETE CASCADE,
        data        JSONB NOT NULL,
        computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Fusion engine configuration
      CREATE TABLE IF NOT EXISTS fusion_config (
        id              SERIAL PRIMARY KEY,
        mamdani_weight  NUMERIC NOT NULL DEFAULT 0.45,
        sugeno_weight   NUMERIC NOT NULL DEFAULT 0.30,
        nn_weight       NUMERIC NOT NULL DEFAULT 0.25,
        strategy        TEXT NOT NULL DEFAULT 'weighted_average',
        ml_refinement   BOOLEAN NOT NULL DEFAULT TRUE,
        adaptive        BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Full-state checkpoints
      CREATE TABLE IF NOT EXISTS checkpoints (
        id          TEXT PRIMARY KEY,
        label       TEXT NOT NULL,
        description TEXT,
        type        TEXT NOT NULL DEFAULT 'manual',
        snapshot    JSONB NOT NULL,
        size_bytes  INTEGER NOT NULL DEFAULT 0,
        created_by  TEXT NOT NULL DEFAULT 'system',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Immutable SOC2 audit log
      CREATE TABLE IF NOT EXISTS audit_events (
        id            TEXT PRIMARY KEY,
        timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id       TEXT NOT NULL,
        user_name     TEXT NOT NULL,
        action        TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id   TEXT,
        details       JSONB NOT NULL DEFAULT '{}',
        ip_address    TEXT,
        level         TEXT NOT NULL DEFAULT 'info'
      );

      -- Alerts (ephemeral, cleared on re-predict)
      CREATE TABLE IF NOT EXISTS alerts (
        id           TEXT PRIMARY KEY,
        severity     TEXT NOT NULL,
        type         TEXT NOT NULL,
        title        TEXT NOT NULL,
        body         TEXT NOT NULL,
        member_id    TEXT REFERENCES team_members(id) ON DELETE CASCADE,
        triggered_by TEXT NOT NULL,
        threshold    NUMERIC,
        current_val  NUMERIC,
        timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
        acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
        actions      JSONB NOT NULL DEFAULT '[]'
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
      CREATE INDEX IF NOT EXISTS idx_alerts_member ON alerts(member_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_checkpoints_created ON checkpoints(created_at DESC);

      -- Seed default fusion config if not present
      INSERT INTO fusion_config (mamdani_weight, sugeno_weight, nn_weight, strategy)
        SELECT 0.45, 0.30, 0.25, 'weighted_average'
        WHERE NOT EXISTS (SELECT 1 FROM fusion_config);
    `,
  },
];

export async function runMigrations(): Promise<void> {
  console.log('[DB] Running migrations...');

  // Ensure migrations table exists first
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const m of MIGRATIONS) {
    const applied = await query(
      'SELECT id FROM schema_migrations WHERE name = $1',
      [m.name]
    );
    if (applied.length > 0) continue;

    console.log(`[DB] Applying migration: ${m.name}`);
    await query(m.sql);
    await query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [m.name]
    );
    console.log(`[DB] Migration applied: ${m.name}`);
  }

  console.log('[DB] All migrations up to date');
}
