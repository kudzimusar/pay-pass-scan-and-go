import { type NextRequest, NextResponse } from "next/server"
import { db, normalizePhoneNumber } from "../../../_lib/db"
import { hashPin, signToken } from "../../../_lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone = normalizePhoneNumber(body.phone || "")
    if (!body.companyName || !body.pin) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    if (db.getOperatorByPhone(phone)) {
      return NextResponse.json({ error: "Operator with this phone number already exists" }, { status: 400 })
    }
    const pinHash = await hashPin(body.pin)
    const operator = db.createOperator({
      companyName: body.companyName,
      phone,
      email: body.email,
      pinHash,
    })
    const token = signToken({ type: "operator", operatorId: operator.id, phone: operator.phone })
    const { pinHash: _drop, ...safeOperator } = operator
    return NextResponse.json({ operator: safeOperator, token })
  } catch (e) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 })
  }
}
