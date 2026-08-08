import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes/api';
import { RULE_BASE } from './core/fuzzy/mamdani';
import { connectRedis, isRedisUp } from './db/redis';
import { testConnection } from './db/postgres';
import { runMigrations } from './db/migrations';
import { state } from './data/state';
import { globalLimiter, rateLimitHeaders } from './middleware/rateLimit';

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000');
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map(o => o.trim());

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);
app.use(rateLimitHeaders);

app.get('/', (_req, res) => res.json({ name:'WorkPulse Backend', version:'2.0.0' }));
app.use('/api', apiRouter);
app.use((_req, res) => res.status(404).json({ success:false, error:'Route not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success:false, error:err.message });
});

async function boot() {
  console.log('WorkPulse Backend v2.0.0 — starting...');
  await connectRedis();
  const dbOk = await testConnection();
  if (dbOk) { await runMigrations(); } else { console.warn('[DB] Postgres not available — using in-memory fallback'); }
  await state.initialize();
  app.listen(PORT, () => {
    console.log(`Server:    http://localhost:${PORT}`);
    console.log(`Rules:     ${RULE_BASE.length} active`);
    console.log(`DB:        ${dbOk ? 'PostgreSQL' : 'in-memory'}`);
    console.log(`Cache:     ${isRedisUp() ? 'Redis' : 'in-memory'}`);
    console.log(`Rate limits: global 1000/15min, predict 20/15min`);
  });
}

boot().catch(err => { console.error('Boot failed:', err); process.exit(1); });
export default app;
