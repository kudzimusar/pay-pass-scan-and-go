import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { storage } from "../../_lib/storage"
import { generateToken, normalizePhoneNumber } from "../../_lib/auth"
import type { User } from "../../_lib/storage"

function toSafeUser(u: User) {
  const { pin, ...safe } = u
  return safe
}

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  pin: z.string().length(4, "PIN must be 4 digits"),
  biometricEnabled: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const { fullName, phone, email, pin, biometricEnabled } = parsed.data
    const normalized = normalizePhoneNumber(phone)

    const existing = await storage.getUserByPhone(normalized)
    if (existing) {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 })
    }

    const pinHash = await bcrypt.hash(pin, 12)
    const user = await storage.createUser({
      fullName,
      phone: normalized,
      email: email || "",
      biometricEnabled: biometricEnabled || false,
      pin: pinHash,
      walletBalance: 0,
      joinedDate: new Date(),
      paypassUsername: `@${fullName.toLowerCase().replace(/\s+/g, '_')}`,
    })

    const token = await generateToken({ type: "user", userId: user.id, phone: user.phone })

    return NextResponse.json({ 
      success: true,
      user: toSafeUser(user), 
      token 
    })
  } catch (e) {
    console.error("Registration error:", e)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}