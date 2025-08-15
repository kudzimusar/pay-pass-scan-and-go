import { NextResponse } from "next/server"
import { verifyRedis } from "../../_lib/redis"

export async function GET() {
  const result = await verifyRedis()
  return NextResponse.json(result)
}
