import { memoryStorage } from "./storage-memory"
import { neonStorage } from "./storage-neon"

// If DATABASE_URL is present, use Neon for the methods it implements;
// fallback to in-memory for the rest.
const useNeon = !!process.env.DATABASE_URL
type AnyStorage = typeof memoryStorage

function pick<K extends keyof AnyStorage>(key: K) {
  const neonHas = useNeon && key in (neonStorage as any)
  if (neonHas) {
    const fn = (neonStorage as any)[key]
    if (typeof fn === "function") return fn.bind(neonStorage)
  }
  const fn = (memoryStorage as any)[key]
  return typeof fn === "function" ? fn.bind(memoryStorage) : fn
}

export const storage = {
  ensureSeeded: pick("ensureSeeded"),

  // User
  getUserByPhone: pick("getUserByPhone"),
  createUser: pick("createUser"),

  // Operator
  getOperatorByPhone: pick("getOperatorByPhone"),
  createOperator: pick("createOperator"),

  // Merchant
  getMerchantByPhone: pick("getMerchantByPhone"),
  createMerchant: pick("createMerchant"),

  // Admin
  getAdminByPhone: pick("getAdminByPhone"),
  createAdmin: pick("createAdmin"),

  // Partner
  getPartnerByPhone: pick("getPartnerByPhone"),
  createPartner: pick("createPartner"),
}
export type Storage = typeof storage
