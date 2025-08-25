import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { normalizePhoneNumber, signToken } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { z } from "zod"
import { rateLimit } from "../../../_lib/redis"

const insertMerchantSchema = z.object({
  businessName: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
  pin: z.string().min(4),
  businessType: z.enum(["retailer", "utility", "service_provider"]),
  licenseNumber: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const data = insertMerchantSchema.parse(raw)
    const phone = normalizePhoneNumber(data.phone)
    const rl = await rateLimit(`register:merchant:${phone}`, 10, 60)
    if (!rl.allowed) return NextResponse.json({ error: "Too many attempts, try later." }, { status: 429 })

    const exists = await storage.getMerchantByPhone(phone)
    if (exists) return NextResponse.json({ error: "Merchant with this phone already exists" }, { status: 400 })
    
    const hashedPin = await bcrypt.hash(data.pin, 10)
    const merchant = await storage.createMerchant({ 
      businessName: data.businessName, 
      phone, 
      pin: hashedPin, 
      email: data.email,
      businessType: data.businessType,
      licenseNumber: data.licenseNumber,
      totalEarnings: 0,
      isActive: true
    })
    
    const token = signToken({ type: "merchant", merchantId: merchant.id, phone: merchant.phone })
    const { pin: _p, ...safe } = merchant
    return NextResponse.json({ merchant: safe, token })
  } catch {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 })
  }
}