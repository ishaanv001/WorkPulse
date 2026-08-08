import Redis from 'ioredis';

let redis: Redis | null = null;
let redisAvailable = false;

export function getRedis(): Redis | null {
  return redis;
}

export function isRedisUp(): boolean {
  return redisAvailable;
}

export async function connectRedis(): Promise<void> {
  try {
    const url = process.env.REDIS_URL;
    redis = url
      ? new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 })
      : new Redis({
          host:     process.env.REDIS_HOST     || 'localhost',
          port:     parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });

    redis.on('error', (err: Error) => {
      if (redisAvailable) {
        console.warn('[Redis] Connection error — falling back to in-memory:', err.message);
        redisAvailable = false;
      }
    });

    redis.on('ready', () => {
      redisAvailable = true;
      console.log('[Redis] Connected');
    });

    await redis.connect();
  } catch (err: any) {
    console.warn('[Redis] Not available — rate limiting will use in-memory store:', err.message);
    redisAvailable = false;
    redis = null;
  }
}

// ── Cache helpers with automatic fallback ────────────────────────────────────

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export async function cacheGet(key: string): Promise<string | null> {
  if (redis && redisAvailable) {
    try { return await redis.get(key); } catch { /* fall through */ }
  }
  const hit = memoryCache.get(key);
  if (!hit || hit.expiresAt < Date.now()) { memoryCache.delete(key); return null; }
  return hit.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  if (redis && redisAvailable) {
    try { await redis.setex(key, ttlSeconds, value); return; } catch { /* fall through */ }
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  if (redis && redisAvailable) {
    try { await redis.del(key); } catch { /* ignore */ }
  }
  memoryCache.delete(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (redis && redisAvailable) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
      return;
    } catch { /* fall through */ }
  }
  const prefix = pattern.replace('*', '');
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) { await redis.quit(); redis = null; }
}
