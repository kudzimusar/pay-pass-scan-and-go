import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { normalizePhoneNumber, signToken } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { rateLimit } from "../../_lib/redis"

const schema = z.object({
  phone: z.string(),
  pin: z.string().min(4),
  role: z.enum(["user", "operator", "merchant", "admin", "partner"]).optional(),
})

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]?.trim()
  return req.headers.get("x-real-ip") || "unknown"
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { phone, pin, role } = parsed.data
  const normalized = normalizePhoneNumber(phone)
  const ip = getClientIp(req)

  // Rate limit by phone and IP
  const rl1 = await rateLimit(`login:${normalized}`, 5, 60)
  const rl2 = await rateLimit(`login:ip:${ip}`, 30, 60)
  if (!rl1.allowed || !rl2.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  try {
    await storage.ensureSeeded()

    // Determine which role/account to look up.
    const rolesToTry = role ? [role] : (["user", "operator", "merchant", "admin", "partner"] as const)

    let found: { role: string; account: any } | null = null

    for (const r of rolesToTry) {
      let account: any = null
      if (r === "user") account = await storage.getUserByPhone(normalized)
      if (r === "operator") account = await storage.getOperatorByPhone(normalized)
      if (r === "merchant") account = await storage.getMerchantByPhone(normalized)
      if (r === "admin") account = await storage.getAdminByPhone(normalized)
      if (r === "partner") account = await storage.getPartnerByPhone(normalized)
      if (account) {
        found = { role: r, account }
        break
      }
    }

    if (!found) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(pin, found.account.pin)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create role-specific token payload
    const { role: foundRole, account } = found
    let token: string
    if (foundRole === "user") token = signToken({ type: "user", userId: account.id, phone: account.phone })
    else if (foundRole === "operator")
      token = signToken({ type: "operator", operatorId: account.id, phone: account.phone })
    else if (foundRole === "merchant")
      token = signToken({ type: "merchant", merchantId: account.id, phone: account.phone })
    else if (foundRole === "admin") token = signToken({ type: "admin", adminId: account.id, phone: account.phone })
    else token = signToken({ type: "partner", partnerId: account.id, phone: account.phone })

    // Build safe account response
    const safe =
      foundRole === "user"
        ? {
            id: account.id,
            fullName: account.fullName,
            phone: account.phone,
            email: account.email,
            biometricEnabled: !!account.biometricEnabled,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          }
        : foundRole === "operator"
          ? {
              id: account.id,
              companyName: account.companyName,
              phone: account.phone,
              email: account.email,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            }
          : foundRole === "merchant"
            ? {
                id: account.id,
                name: account.name,
                phone: account.phone,
                email: account.email,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
              }
            : foundRole === "admin"
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

    const res = NextResponse.json({
      success: true,
      role: foundRole,
      account: safe,
      token,
    })

    // Set a secure, httpOnly cookie for session convenience
    const isProd = process.env.NODE_ENV === "production"
    res.cookies.set("pp_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (e) {
    console.error("Login error:", e)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
