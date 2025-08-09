import { type NextRequest, NextResponse } from "next/server"
import { db, normalizePhoneNumber } from "../../../_lib/db"
import { comparePin, signToken } from "../../../_lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone = normalizePhoneNumber(body.phone || "")
    const operator = db.getOperatorByPhone(phone)
    if (!operator) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    const ok = await comparePin(body.pin || "", operator.pinHash)
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    const token = signToken({ type: "operator", operatorId: operator.id, phone: operator.phone })
    const { pinHash: _drop, ...safeOperator } = operator
    return NextResponse.json({ operator: safeOperator, token })
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
