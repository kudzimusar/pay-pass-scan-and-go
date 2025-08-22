// Server-only Upstash Redis helper using REST API via fetch.
// Reads URL/TOKEN strictly from environment variables; never hardcodes.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ""
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ""

const isConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

type UpstashResponse<T = unknown> = { result?: T; error?: string }

async function call<T = unknown>(command: (string | number)[]): Promise<UpstashResponse<T>> {
  if (!isConfigured) return { result: undefined as any }
  try {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
      // No caching of auth-bound calls
      cache: "no-store",
    })
    const json = (await res.json()) as UpstashResponse<T>
    return json
  } catch (e: any) {
    return { error: e?.message || "redis_call_failed" }
  }
}

export const redis = {
  enabled: isConfigured,
  async ping(): Promise<boolean> {
    if (!isConfigured) return false
    const { result } = await call<string>(["PING"])
    return result === "PONG"
  },
  async get(key: string): Promise<string | null> {
    if (!isConfigured) return null
    const { result } = await call<string>(["GET", key])
    return result ?? null
  },
  async set(key: string, value: string, ttlSeconds?: number) {
    if (!isConfigured) return "OK"
    const cmd: (string | number)[] = ["SET", key, value]
    if (ttlSeconds && ttlSeconds > 0) {
      cmd.push("EX", ttlSeconds)
    }
    const { result, error } = await call<string>(cmd)
    if (error) throw new Error(error)
    return result
  },
  async del(key: string) {
    if (!isConfigured) return 0
    const { result } = await call<number>(["DEL", key])
    return result ?? 0
  },
  async incr(key: string) {
    if (!isConfigured) return 0
    const { result, error } = await call<number>(["INCR", key])
    if (error) throw new Error(error)
    return result ?? 0
  },
  async expire(key: string, seconds: number) {
    if (!isConfigured) return 0
    const { result } = await call<number>(["EXPIRE", key, seconds])
    return result ?? 0
  },
}

// Simple fixed-window rate limit: limit attempts per window in seconds.
// Uses INCR and sets EXPIRE only when counter is created.
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{
  allowed: boolean
  remaining: number
  resetIn: number
  enabled: boolean
}> {
  if (!redis.enabled) {
    // If Redis not configured, do not block dev/testing.
    return { allowed: true, remaining: limit, resetIn: windowSeconds, enabled: false }
  }
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSeconds)
  }
  const remaining = Math.max(0, limit - count)
  const allowed = count <= limit
  // Best-effort reset calculation (exact TTL would require TTL command)
  return { allowed, remaining, resetIn: remaining > 0 ? windowSeconds : windowSeconds, enabled: true }
}
