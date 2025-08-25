import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { redis } from "../../_lib/redis"

export async function POST(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { qrCode } = await req.json()
    const cacheKey = qrCode ? `route:qr:${qrCode}` : ""
    if (redis.enabled && cacheKey) {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached)
    }
    const route = await storage.getRouteByQrCode(String(qrCode || ""))
    if (!route) return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
    const operator = await storage.getOperator(route.operatorId)
    const payload = {
      route,
      operator: operator
        ? { id: operator.id, companyName: operator.companyName, phone: operator.phone, email: operator.email }
        : null,
    }
    if (redis.enabled && cacheKey) {
      await redis.set(cacheKey, JSON.stringify(payload), 300)
    }
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "Failed to process QR code" }, { status: 500 })
  }
}
