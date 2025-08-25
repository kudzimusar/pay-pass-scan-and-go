import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { normalizePhoneNumber, signToken } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { z } from "zod"
import { rateLimit } from "../../../_lib/redis"

const insertAdminSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
  pin: z.string().min(4),
  role: z.enum(["super_admin", "platform_admin", "support_admin"]),
  permissions: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const data = insertAdminSchema.parse(raw)
    const phone = normalizePhoneNumber(data.phone)
    const rl = await rateLimit(`register:admin:${phone}`, 10, 60)
    if (!rl.allowed) return NextResponse.json({ error: "Too many attempts, try later." }, { status: 429 })

    const exists = await storage.getAdminByPhone(phone)
    if (exists) return NextResponse.json({ error: "Admin with this phone already exists" }, { status: 400 })
    
    const hashedPin = await bcrypt.hash(data.pin, 10)
    const admin = await storage.createAdmin({ 
      fullName: data.fullName, 
      phone, 
      pin: hashedPin, 
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      isActive: true
    })
    
    const token = signToken({ type: "admin", adminId: admin.id, phone: admin.phone })
    const { pin: _p, ...safe } = admin
    return NextResponse.json({ admin: safe, token })
  } catch {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 })
  }
}