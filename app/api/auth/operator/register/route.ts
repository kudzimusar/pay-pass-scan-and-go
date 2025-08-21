import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { normalizePhoneNumber, signToken } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { z } from "zod"
import { rateLimit } from "../../../_lib/redis"

const insertOperatorSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  pin: z.string().min(4),
})

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const data = insertOperatorSchema.parse(raw)
    const phone = normalizePhoneNumber(data.phone)
    const rl = await rateLimit(`register:operator:${phone}`, 10, 60)
    if (!rl.allowed) return NextResponse.json({ error: "Too many attempts, try later." }, { status: 429 })

    const exists = await storage.getOperatorByPhone(phone)
    if (exists) return NextResponse.json({ error: "Operator with this phone already exists" }, { status: 400 })
    const hashedPin = await bcrypt.hash(data.pin, 10)
    const op = await storage.createOperator({ name: data.name, phone, pin: hashedPin, email: data.email })
    const token = signToken({ type: "operator", operatorId: op.id, phone: op.phone })
    const { pin: _p, ...safe } = op
    return NextResponse.json({ operator: safe, token })
  } catch {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 })
  }
}
