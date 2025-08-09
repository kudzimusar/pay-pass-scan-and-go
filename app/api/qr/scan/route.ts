import { type NextRequest, NextResponse } from "next/server"
import { db } from "../../_lib/db"
import { verifyToken } from "../../_lib/auth"

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const payload = verifyToken<{ type: "user"; userId: string }>(auth)
    if ((payload as any).type !== "user") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { qrCode } = await req.json()
    const route = db.getRouteByQr(qrCode)
    if (!route) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
    }

    const operator = db.getOperator(route.operatorId)
    return NextResponse.json({
      route,
      operator: operator ? { id: operator.id, companyName: operator.companyName } : null,
    })
  } catch (e) {
    return NextResponse.json({ error: "Scan failed" }, { status: 500 })
  }
}
