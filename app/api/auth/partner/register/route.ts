import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { normalizePhoneNumber, signToken } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { z } from "zod"
import { rateLimit } from "../../../_lib/redis"

const insertPartnerSchema = z.object({
  companyName: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
  pin: z.string().min(4),
  partnerType: z.enum(["mobile_money", "bank", "fintech"]),
  integrationKey: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const data = insertPartnerSchema.parse(raw)
    const phone = normalizePhoneNumber(data.phone)
    const rl = await rateLimit(`register:partner:${phone}`, 10, 60)
    if (!rl.allowed) return NextResponse.json({ error: "Too many attempts, try later." }, { status: 429 })

    const exists = await storage.getPartnerByPhone(phone)
    if (exists) return NextResponse.json({ error: "Partner with this phone already exists" }, { status: 400 })
    
    const hashedPin = await bcrypt.hash(data.pin, 10)
    const partner = await storage.createPartner({ 
      companyName: data.companyName, 
      phone, 
      pin: hashedPin, 
      email: data.email,
      partnerType: data.partnerType,
      integrationKey: data.integrationKey,
      totalTransactions: 0,
      isActive: true
    })
    
    const token = signToken({ type: "partner", partnerId: partner.id, phone: partner.phone })
    const { pin: _p, ...safe } = partner
    return NextResponse.json({ partner: safe, token })
  } catch {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 })
  }
}