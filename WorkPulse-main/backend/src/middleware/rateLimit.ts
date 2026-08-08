import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getRedis, isRedisUp } from '../db/redis';

// ── In-memory store (fallback when Redis is down) ─────────────────────────────
class MemoryStore {
  private hits = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + 900_000 });
      return { totalHits: 1, resetTime: new Date(now + 900_000) };
    }
    entry.count += 1;
    return { totalHits: entry.count, resetTime: new Date(entry.resetAt) };
  }

  async decrement(key: string): Promise<void> {
    const entry = this.hits.get(key);
    if (entry) entry.count = Math.max(0, entry.count - 1);
  }

  async resetKey(key: string): Promise<void> { this.hits.delete(key); }
}

// ── Redis store wrapper for express-rate-limit ────────────────────────────────
class RedisRateLimitStore {
  private prefix: string;
  private windowMs: number;

  constructor(opts: { prefix: string; windowMs: number }) {
    this.prefix = opts.prefix;
    this.windowMs = opts.windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redis = getRedis();
    if (!redis || !isRedisUp()) throw new Error('Redis unavailable');

    const redisKey = `${this.prefix}:${key}`;
    const multi = redis.multi();
    multi.incr(redisKey);
    multi.pttl(redisKey);
    const results = await multi.exec();

    const count = (results?.[0]?.[1] as number) ?? 1;
    const ttl   = (results?.[1]?.[1] as number) ?? -1;

    if (ttl < 0) await redis.pexpire(redisKey, this.windowMs);
    const resetTime = new Date(Date.now() + (ttl < 0 ? this.windowMs : ttl));

    return { totalHits: count, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisUp()) await redis.decr(`${this.prefix}:${key}`);
  }

  async resetKey(key: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisUp()) await redis.del(`${this.prefix}:${key}`);
  }
}

// ── Store selector — Redis if available, memory otherwise ────────────────────
function makeStore(prefix: string, windowMs: number) {
  const redisStore  = new RedisRateLimitStore({ prefix, windowMs });
  const memoryStore = new MemoryStore();

  // Wrap so that if Redis throws, we fall back to memory
  return {
    async increment(key: string) {
      if (isRedisUp()) {
        try { return await redisStore.increment(key); } catch {}
      }
      return memoryStore.increment(key);
    },
    async decrement(key: string) {
      if (isRedisUp()) {
        try { return await redisStore.decrement(key); } catch {}
      }
      return memoryStore.decrement(key);
    },
    async resetKey(key: string) {
      if (isRedisUp()) {
        try { return await redisStore.resetKey(key); } catch {}
      }
      return memoryStore.resetKey(key);
    },
  };
}

// ── Public limiter: 100 req / 15 min ─────────────────────────────────────────
export const publicLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_PUBLIC     || '100'),
  standardHeaders: true,
  legacyHeaders:   false,
  store: makeStore('rl:public', 900_000),
  message: { success: false, error: 'Too many requests. Limit: 100/15 min.', retryAfter: '15 minutes' },
  keyGenerator: (req: Request) => req.ip ?? 'unknown',
  validate: false,
});

// ── Authenticated limiter: 500 req / 15 min ───────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS   || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_AUTHENTICATED || '500'),
  standardHeaders: true,
  legacyHeaders:   false,
  store: makeStore('rl:auth', 900_000),
  message: { success: false, error: 'Authenticated rate limit exceeded.', retryAfter: '15 minutes' },
  keyGenerator: (req: Request) => (req as any).user?.id ?? req.ip ?? 'unknown',
  validate: false,
});

// ── Prediction limiter: 20 req / 15 min (expensive AI calls) ─────────────────
export const predictLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_PREDICT   || '20'),
  standardHeaders: true,
  legacyHeaders:   false,
  store: makeStore('rl:predict', 900_000),
  message: { success: false, error: 'Prediction rate limit exceeded. Limit: 20/15 min.', retryAfter: '15 minutes' },
  keyGenerator: (req: Request) => (req as any).user?.id ?? req.ip ?? 'unknown',
  validate: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error:   'Prediction rate limit exceeded',
      limit:   20,
      retryAfterMs: 900_000,
      hint:    'Use /predict/:id for single members to stay within limits',
    });
  },
});

// ── Global tight limiter: 1000 req / 15 min hard cap ─────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 900_000,
  max:      1000,
  standardHeaders: true,
  legacyHeaders:   false,
  store: makeStore('rl:global', 900_000),
  message: { success: false, error: 'Global rate limit exceeded.', retryAfter: '15 minutes' },
});

// ── Response headers helper ───────────────────────────────────────────────────
export function rateLimitHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-RateLimit-Backend', isRedisUp() ? 'redis' : 'memory');
  next();
}
