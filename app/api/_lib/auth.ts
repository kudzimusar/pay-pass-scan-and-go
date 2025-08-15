// Server-only auth utilities. Using jsonwebtoken and Zimbabwe phone normalization.
import jwt from "jsonwebtoken"

const DEV_SECRET = "paypass-dev-secret"
const JWT_SECRET = process.env.JWT_SECRET || DEV_SECRET

export type UserAuthPayload = { type: "user"; userId: string; phone: string }
export type OperatorAuthPayload = { type: "operator"; operatorId: string; phone: string }
export type MerchantAuthPayload = { type: "merchant"; merchantId: string; phone: string }
export type AdminAuthPayload = { type: "admin"; adminId: string; phone: string }
export type PartnerAuthPayload = { type: "partner"; partnerId: string; phone: string }
export type AuthPayload =
  | UserAuthPayload
  | OperatorAuthPayload
  | MerchantAuthPayload
  | AdminAuthPayload
  | PartnerAuthPayload

export function normalizePhoneNumber(phone: string): string {
  const clean = String(phone || "").trim()
  if (!clean) return ""
  if (clean.startsWith("+")) return clean
  const digits = clean.replace(/\D/g, "")
  if (digits.startsWith("263")) return "+" + digits
  if (digits.startsWith("0")) return "+263" + digits.slice(1)
  if (digits.length === 9) return "+263" + digits
  return digits ? "+" + digits : ""
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload
}

export function verifyAuthHeader(authHeader: string | null): AuthPayload | null {
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}
