import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookieOptions, normalizePhoneNumber, signToken } from "../../_lib/auth"
import { storage } from "../../_lib/storage"

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email().optional(),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(12, "PIN too long"),
  biometricEnabled: z.boolean().optional(),
})

function toSafeUser(u: UserRecord) {
  const { pin, ...safe } = u
  return safe
}

export async function POST(req: Request) {
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
      email,
      biometricEnabled,
      pinHash,
    })

    const token = await signToken({ type: "user", userId: user.id, phone: user.phone })

    const res = NextResponse.json({ user: toSafeUser(user), token })
    const cookie = cookieOptions()
    res.cookies.set(cookie.name, token, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
