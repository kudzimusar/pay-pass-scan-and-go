import { neon } from "@neondatabase/serverless"
import type { UserRecord, OperatorRecord, MerchantRecord, AdminRecord, PartnerRecord } from "./storage-memory"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export const neonStorage = {
  async ensureSeeded() {
    // Optional: seed via scripts/sql/*.sql in CI/CD
  },

  // Users
  async getUserByPhone(phone: string): Promise<UserRecord | null> {
    const sql = getSql()
    const rows = await sql<UserRecord[]>`
      select id, full_name as "fullName", phone, email, biometric_enabled as "biometricEnabled",
             pin_hash as pin, created_at as "createdAt", updated_at as "updatedAt"
      from users where phone = ${phone} limit 1
    `
    return rows[0] || null
  },
  async createUser(input: {
    fullName: string
    phone: string
    email?: string
    biometricEnabled?: boolean
    pinHash: string
  }): Promise<UserRecord> {
    const sql = getSql()
    const rows = await sql<UserRecord[]>`
      insert into users (full_name, phone, email, biometric_enabled, pin_hash)
      values (${input.fullName}, ${input.phone}, ${input.email || null}, ${!!input.biometricEnabled}, ${input.pinHash})
      returning id, full_name as "fullName", phone, email, biometric_enabled as "biometricEnabled",
                pin_hash as pin, created_at as "createdAt", updated_at as "updatedAt"
    `
    return rows[0]
  },

  // Operators
  async getOperatorByPhone(phone: string): Promise<OperatorRecord | null> {
    const sql = getSql()
    const rows = await sql<OperatorRecord[]>`
      select id, company_name as "companyName", phone, email, pin_hash as pin,
             created_at as "createdAt", updated_at as "updatedAt"
      from operators where phone = ${phone} limit 1
    `
    return rows[0] || null
  },
  async createOperator(input: {
    companyName: string
    phone: string
    email?: string
    pinHash: string
  }): Promise<OperatorRecord> {
    const sql = getSql()
    const rows = await sql<OperatorRecord[]>`
      insert into operators (company_name, phone, email, pin_hash)
      values (${input.companyName}, ${input.phone}, ${input.email || null}, ${input.pinHash})
      returning id, company_name as "companyName", phone, email, pin_hash as pin,
                created_at as "createdAt", updated_at as "updatedAt"
    `
    return rows[0]
  },

  // Note: Neon tables for merchants/admins/partners can be added later.
} satisfies Partial<{
  ensureSeeded: () => Promise<void>
  getUserByPhone: (p: string) => Promise<UserRecord | null>
  createUser: (i: any) => Promise<UserRecord>
  getOperatorByPhone: (p: string) => Promise<OperatorRecord | null>
  createOperator: (i: any) => Promise<OperatorRecord>
  getMerchantByPhone: (p: string) => Promise<MerchantRecord | null>
  createMerchant: (i: any) => Promise<MerchantRecord>
  getAdminByPhone: (p: string) => Promise<AdminRecord | null>
  createAdmin: (i: any) => Promise<AdminRecord>
  getPartnerByPhone: (p: string) => Promise<PartnerRecord | null>
  createPartner: (i: any) => Promise<PartnerRecord>
}>
