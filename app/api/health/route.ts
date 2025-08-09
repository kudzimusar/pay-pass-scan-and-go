import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  const url = process.env.DATABASE_URL
  if (!url) {
    return NextResponse.json({ ok: true, neon: false, message: "No DATABASE_URL set" })
  }
  try {
    const sql = neon(url)
    const res = await sql`select 1 as one`
    return NextResponse.json({ ok: true, neon: true, result: res[0] })
  } catch (e) {
    return NextResponse.json({ ok: false, neon: true, error: (e as any)?.message || String(e) }, { status: 500 })
  }
}
