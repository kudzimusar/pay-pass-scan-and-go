import { type NextRequest, NextResponse } from "next/server"
import { db } from "../../_lib/db"
import { verifyToken } from "../../_lib/auth"

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const payload = verifyToken<{ type: "operator"; operatorId: string }>(auth)
    if ((payload as any).type !== "operator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const routes = db.getRoutesByOperatorId((payload as any).operatorId)
    return NextResponse.json(routes)
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const payload = verifyToken<{ type: "operator"; operatorId: string }>(auth)
    if ((payload as any).type !== "operator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { name, description, fareUsd, fareZwl, qrCode } = await req.json()
    if (!name || !fareUsd || !fareZwl || !qrCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const route = db.createRoute({
      operatorId: (payload as any).operatorId,
      name,
      description,
      fareUsd: String(fareUsd),
      fareZwl: String(fareZwl),
      qrCode,
    })

    return NextResponse.json(route)
  } catch (e) {
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 })
  }
}
