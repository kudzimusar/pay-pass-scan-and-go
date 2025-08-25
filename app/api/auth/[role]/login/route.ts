import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { normalizePhoneNumber, sessionCookieOptions, signToken } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { rateLimit } from "../../../_lib/redis"

const schema = z.object({
  phone: z.string(),
  pin: z.string().min(4),
})

const roles = new Set(["user", "operator", "merchant", "admin", "partner"])

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]?.trim()
  return req.headers.get("x-real-ip") || "unknown"
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  const { role } = await params
  const roleStr = String(role || "").toLowerCase()
  if (!roles.has(roleStr)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { phone, pin } = parsed.data
  const normalized = normalizePhoneNumber(phone)
  const ip = getClientIp(req)

  // Rate limit by role+phone and IP
  const rl1 = await rateLimit(`login:${roleStr}:${normalized}`, 5, 60)
  const rl2 = await rateLimit(`login:${roleStr}:ip:${ip}`, 30, 60)
  if (!rl1.allowed || !rl2.allowed) {
    return NextResponse.json({ error: "Too many attempts, try later." }, { status: 429 })
  }

  try {
    await storage.ensureSeeded()

    let account: any = null
    if (roleStr === "user") account = await storage.getUserByPhone(normalized)
    if (roleStr === "operator") account = await storage.getOperatorByPhone(normalized)
    if (roleStr === "merchant") account = await storage.getMerchantByPhone(normalized)
    if (roleStr === "admin") account = await storage.getAdminByPhone(normalized)
    if (roleStr === "partner") account = await storage.getPartnerByPhone(normalized)

    if (!account) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(pin, account.pin)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Build token payload based on role
    let token: string
    if (roleStr === "user") token = signToken({ type: "user", userId: account.id, phone: account.phone })
    else if (roleStr === "operator") token = signToken({ type: "operator", operatorId: account.id, phone: account.phone })
    else if (roleStr === "merchant") token = signToken({ type: "merchant", merchantId: account.id, phone: account.phone })
    else if (roleStr === "admin") token = signToken({ type: "admin", adminId: account.id, phone: account.phone })
    else token = signToken({ type: "partner", partnerId: account.id, phone: account.phone })

    // Build a safe account object
    const safe =
      roleStr === "user"
        ? {
            id: account.id,
            fullName: account.fullName,
            phone: account.phone,
            email: account.email,
            biometricEnabled: !!account.biometricEnabled,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          }
        : roleStr === "operator"
          ? {
              id: account.id,
              companyName: account.companyName,
              phone: account.phone,
              email: account.email,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            }
          : roleStr === "merchant"
            ? {
                id: account.id,
                name: account.name,
                phone: account.phone,
                email: account.email,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
              }
            : roleStr === "admin"
              ? {
                  id: account.id,
                  fullName: account.fullName,
                  phone: account.phone,
                  email: account.email,
                  createdAt: account.createdAt,
                  updatedAt: account.updatedAt,
                }
              : {
                  id: account.id,
                  companyName: account.companyName,
                  phone: account.phone,
                  email: account.email,
                  createdAt: account.createdAt,
                  updatedAt: account.updatedAt,
                }

    const res = NextResponse.json({ role: roleStr, account: safe, token })
    const cookie = sessionCookieOptions()
    res.cookies.set(cookie.name, token, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
