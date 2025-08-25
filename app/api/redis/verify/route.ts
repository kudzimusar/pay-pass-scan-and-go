import { NextResponse } from "next/server"
import { redis } from "../../_lib/redis"

export async function GET() {
  const ok = await redis.ping()
  return NextResponse.json({ ok, enabled: redis.enabled })
}
