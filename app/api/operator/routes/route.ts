import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { operatorRouteSchema } from "../../_lib/schema"

export async function GET(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "operator" || !auth.operatorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const list = await storage.getOperatorRoutes(auth.operatorId)
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "operator" || !auth.operatorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const raw = await req.json()
    const data = operatorRouteSchema.parse(raw)
    const qrCode = `PP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const route = await storage.createRoute({
      operatorId: auth.operatorId,
      name: data.name,
      startLocation: "Route Start",
      endLocation: "Route End",
      fare: data.fareUSD,
      distance: 0,
      estimatedDuration: 0,
      isActive: true,
    })
    return NextResponse.json(route)
  } catch {
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 })
  }
}
