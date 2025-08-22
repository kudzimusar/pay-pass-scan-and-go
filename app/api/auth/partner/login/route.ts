import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { cookieOptions, normalizePhoneNumber, signToken } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { rateLimit } from "../../../_lib/redis"

const schema = z.object({
  phone: z.string().min(5, "Phone is required"),
  pin: z.string().min(4, "PIN is required"),
})

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]?.trim()
  return req.headers.get("x-real-ip") || "unknown"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { phone, pin } = parsed.data
    const normalized = normalizePhoneNumber(phone)

    const ip = getClientIp(req)
    const rl1 = await rateLimit(`partnerlogin:phone:${normalized}`, 5, 60)
    const rl2 = await rateLimit(`partnerlogin:ip:${ip}`, 20, 60)
    if (!rl1.allowed || !rl2.allowed) {
      return NextResponse.json({ error: "Too many attempts, try again later." }, { status: 429 })
    }

    const partner = await storage.getPartnerByPhone(normalized)
    if (!partner) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const ok = await bcrypt.compare(pin, partner.pin)
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const token = await signToken({ type: "partner", partnerId: partner.id, phone: partner.phone })

    const res = NextResponse.json({
      partner: {
        id: partner.id,
        companyName: partner.companyName,
        phone: partner.phone,
        email: partner.email,
        partnerType: partner.partnerType,
        integrationKey: partner.integrationKey,
        totalTransactions: partner.totalTransactions,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      },
      token,
    })
    const cookie = cookieOptions()
    res.cookies.set(cookie.name, token, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    })
    return res
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}