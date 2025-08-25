import jwt from "jsonwebtoken"
import { normalizePhoneNumber as normalizeFromDb } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface AuthPayload {
  userId?: string
  operatorId?: string
  merchantId?: string
  adminId?: string
  partnerId?: string
  type: "user" | "operator" | "admin" | "merchant" | "partner"
  phone: string
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

export function verifyAuthHeader(authHeader: string | null): AuthPayload | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export function getAuthFromRequest(request: Request): AuthPayload | null {
  const authHeader = request.headers.get("Authorization")
  return verifyAuthHeader(authHeader)
}

export function normalizePhoneNumber(phone: string): string {
  return normalizeFromDb(phone)
}

export function cookieOptions() {
  return {
    name: "auth_token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  }
}

export function sessionCookieOptions() {
  return {
    name: "auth_token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 24 * 60 * 60, // 1 day
  }
}
