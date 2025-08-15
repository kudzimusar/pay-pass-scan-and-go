import bcrypt from "bcryptjs"

// Records for roles
export type UserRecord = {
  id: string
  fullName: string
  phone: string
  email?: string
  biometricEnabled?: boolean
  pin: string // bcrypt hash
  createdAt: string
  updatedAt: string
}
export type OperatorRecord = {
  id: string
  companyName: string
  phone: string
  email?: string
  pin: string
  createdAt: string
  updatedAt: string
}
export type MerchantRecord = {
  id: string
  name: string
  phone: string
  email?: string
  pin: string
  createdAt: string
  updatedAt: string
}
export type AdminRecord = {
  id: string
  fullName: string
  phone: string
  email?: string
  pin: string
  createdAt: string
  updatedAt: string
}
export type PartnerRecord = {
  id: string
  companyName: string
  phone: string
  email?: string
  pin: string
  createdAt: string
  updatedAt: string
}

const users = new Map<string, UserRecord>() // by phone
const operators = new Map<string, OperatorRecord>() // by phone
const merchants = new Map<string, MerchantRecord>() // by phone
const admins = new Map<string, AdminRecord>() // by phone
const partners = new Map<string, PartnerRecord>() // by phone

function now() {
  return new Date().toISOString()
}
function rid(prefix: string) {
  if (typeof crypto?.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`
  return `${prefix}_${Math.random().toString(36).slice(2)}`
}

let seeded = false
async function seed() {
  if (seeded) return
  seeded = true
  const pinHash = await bcrypt.hash("1234", 10)

  // Demo stakeholders
  users.set("+263772222222", {
    id: rid("u"),
    fullName: "Demo User",
    phone: "+263772222222",
    email: "user.demo@paypass.local",
    biometricEnabled: false,
    pin: pinHash,
    createdAt: now(),
    updatedAt: now(),
  })
  operators.set("+263771111111", {
    id: rid("op"),
    companyName: "Demo Operator",
    phone: "+263771111111",
    email: "operator.demo@paypass.local",
    pin: pinHash,
    createdAt: now(),
    updatedAt: now(),
  })
  merchants.set("+263773333333", {
    id: rid("m"),
    name: "Demo Merchant",
    phone: "+263773333333",
    email: "merchant.demo@paypass.local",
    pin: pinHash,
    createdAt: now(),
    updatedAt: now(),
  })
  admins.set("+263774444444", {
    id: rid("adm"),
    fullName: "PayPass Admin",
    phone: "+263774444444",
    email: "admin.demo@paypass.local",
    pin: pinHash,
    createdAt: now(),
    updatedAt: now(),
  })
  partners.set("+263775555555", {
    id: rid("pp"),
    companyName: "Demo Mobile Money Partner",
    phone: "+263775555555",
    email: "partner.demo@paypass.local",
    pin: pinHash,
    createdAt: now(),
    updatedAt: now(),
  })
}

export const memoryStorage = {
  async ensureSeeded() {
    await seed()
  },

  // User
  async getUserByPhone(phone: string): Promise<UserRecord | null> {
    await seed()
    return users.get(phone) || null
  },
  async createUser(input: {
    fullName: string
    phone: string
    email?: string
    biometricEnabled?: boolean
    pinHash: string
  }): Promise<UserRecord> {
    await seed()
    const rec: UserRecord = {
      id: rid("u"),
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      biometricEnabled: !!input.biometricEnabled,
      pin: input.pinHash,
      createdAt: now(),
      updatedAt: now(),
    }
    users.set(rec.phone, rec)
    return rec
  },

  // Operator
  async getOperatorByPhone(phone: string): Promise<OperatorRecord | null> {
    await seed()
    return operators.get(phone) || null
  },
  async createOperator(input: { companyName: string; phone: string; email?: string; pinHash: string }) {
    await seed()
    const rec: OperatorRecord = {
      id: rid("op"),
      companyName: input.companyName,
      phone: input.phone,
      email: input.email,
      pin: input.pinHash,
      createdAt: now(),
      updatedAt: now(),
    }
    operators.set(rec.phone, rec)
    return rec
  },

  // Merchant
  async getMerchantByPhone(phone: string): Promise<MerchantRecord | null> {
    await seed()
    return merchants.get(phone) || null
  },
  async createMerchant(input: { name: string; phone: string; email?: string; pinHash: string }) {
    await seed()
    const rec: MerchantRecord = {
      id: rid("m"),
      name: input.name,
      phone: input.phone,
      email: input.email,
      pin: input.pinHash,
      createdAt: now(),
      updatedAt: now(),
    }
    merchants.set(rec.phone, rec)
    return rec
  },

  // Admin
  async getAdminByPhone(phone: string): Promise<AdminRecord | null> {
    await seed()
    return admins.get(phone) || null
  },
  async createAdmin(input: { fullName: string; phone: string; email?: string; pinHash: string }) {
    await seed()
    const rec: AdminRecord = {
      id: rid("adm"),
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      pin: input.pinHash,
      createdAt: now(),
      updatedAt: now(),
    }
    admins.set(rec.phone, rec)
    return rec
  },

  // Partner
  async getPartnerByPhone(phone: string): Promise<PartnerRecord | null> {
    await seed()
    return partners.get(phone) || null
  },
  async createPartner(input: { companyName: string; phone: string; email?: string; pinHash: string }) {
    await seed()
    const rec: PartnerRecord = {
      id: rid("pp"),
      companyName: input.companyName,
      phone: input.phone,
      email: input.email,
      pin: input.pinHash,
      createdAt: now(),
      updatedAt: now(),
    }
    partners.set(rec.phone, rec)
    return rec
  },
}
