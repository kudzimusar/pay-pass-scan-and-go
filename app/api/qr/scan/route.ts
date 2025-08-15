import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { getRedis } from "../../_lib/redis"

export async function POST(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { qrCode } = await req.json()
    const redis = getRedis()
    const cacheKey = qrCode ? `route:qr:${qrCode}` : ""
    if (redis && cacheKey) {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached)
    }
    const route = await storage.getRouteByQrCode(String(qrCode || ""))
    if (!route) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
    const operator = await storage.getOperator(route.operatorId)
    const payload = {
      route,
      operator: operator
        ? { id: operator.id, name: operator.name, phone: operator.phone, email: operator.email }
        : null,
    }
    if (redis && cacheKey) {
      await redis.set(cacheKey, payload, { ex: 300 })
    }
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "Failed to process QR code" }, { status: 500 })
  }
}
