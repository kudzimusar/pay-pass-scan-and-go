import { storage as memoryStorage } from "./storage/storage-memory"
import { NeonStorage } from "./storage/storage-neon"

// Clean storage implementation that works with Next.js API routes
const useNeon = !!process.env.DATABASE_URL
const neonStorage = useNeon ? new NeonStorage() : null
type AnyStorage = typeof memoryStorage

function pick<K extends keyof AnyStorage>(key: K) {
  const neonHas = useNeon && neonStorage && key in (neonStorage as any)
  if (neonHas) {
    const fn = (neonStorage as any)[key]
    if (typeof fn === "function") return fn.bind(neonStorage)
  }
  const fn = (memoryStorage as any)[key]
  return typeof fn === "function" ? fn.bind(memoryStorage) : fn
}

export const storage = {
  ensureSeeded: pick("ensureSeeded"),

  // User operations
  getUserByPhone: pick("getUserByPhone"),
  createUser: pick("createUser"),

  // Operator operations
  getOperatorByPhone: pick("getOperatorByPhone"),
  createOperator: pick("createOperator"),

  // Merchant operations
  getMerchantByPhone: pick("getMerchantByPhone"),
  createMerchant: pick("createMerchant"),

  // Admin operations
  getAdminByPhone: pick("getAdminByPhone"),
  createAdmin: pick("createAdmin"),

  // Partner operations
  getPartnerByPhone: pick("getPartnerByPhone"),
  createPartner: pick("createPartner"),
}

export type Storage = typeof storage
