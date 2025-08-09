import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import type { User } from "../_lib/db"

const DEV_SECRET = "pp-dev-secret-change-me"

function getJwtSecret() {
  const sec = process.env.JWT_SECRET || DEV_SECRET
  if (sec === DEV_SECRET) {
    console.warn("JWT_SECRET not set. Using a development secret. Do NOT use in production.")
  }
  return sec
}

export type JwtPayload =
  | { type: "user"; userId: string; phone: string }
  | { type: "operator"; operatorId: string; phone: string }

export async function hashPin(pin: string) {
  if (typeof pin !== "string" || pin.length < 4) {
    throw new Error("Invalid PIN")
  }
  const saltRounds = 10
  return bcrypt.hash(pin, saltRounds)
}

export async function comparePin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash)
}

export function signToken<T extends object>(payload: T) {
  const secret = getJwtSecret()
  return jwt.sign(payload as any, secret, { expiresIn: "7d" })
}

export function verifyToken<T extends object = any>(authHeader?: string | null): T {
  if (!authHeader) throw new Error("Missing Authorization header")
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const secret = getJwtSecret()
  const result = jwt.verify(token, secret)
  return result as T
}

// Optional persistence helpers (no-ops if DATABASE_URL is not set)
export async function persistUserToNeon(user: User) {
  const url = process.env.DATABASE_URL
  if (!url) return
  try {
    const sql = neon(url)
    // Insert user
    await sql`
      insert into users (id, full_name, phone, email, pin_hash, biometric_enabled, created_at, updated_at)
      values (${user.id}::uuid, ${user.fullName}, ${user.phone}, ${user.email || null}, ${user.pinHash}, ${user.biometricEnabled ?? false}, ${user.createdAt}::timestamptz, ${user.updatedAt}::timestamptz)
      on conflict (phone) do nothing
    `
    // Ensure wallet
    await sql`
      insert into wallets (user_id, usd_balance, zwl_balance)
      values (${user.id}::uuid, 5.00, 50.00)
      on conflict (user_id) do nothing
    `
  } catch (e) {
    console.warn("persistUserToNeon failed (non-fatal):", (e as any)?.message || e)
  }
}
