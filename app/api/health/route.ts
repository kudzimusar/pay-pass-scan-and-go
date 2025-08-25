import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { redis } from "../_lib/redis"

export async function GET() {
  const status: any = { ok: true, framework: "Next.js" }
  try {
    const url = process.env.DATABASE_URL
    if (url) {
      const sql = neon(url)
      const res = await sql`select 1 as one`
      status.neon = true
      status.db = res[0]
    } else {
      status.neon = false
    }
  } catch (e: any) {
    status.neon = true
    status.dbError = e?.message || String(e)
    status.ok = false
  }

  try {
    if (redis.enabled) {
      await redis.ping()
      status.redis = true
    } else {
      status.redis = false
    }
  } catch (e: any) {
    status.redis = true
    status.redisError = e?.message || String(e)
    status.ok = false
  }

  return NextResponse.json(status, { status: status.ok ? 200 : 500 })
}
