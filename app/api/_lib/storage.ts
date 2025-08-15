import bcrypt from "bcryptjs"
import { storage } from "./storage/index"
import type { Storage } from "./storage/index"

export type User = {
  id: string
  phone: string
  name: string
  pin: string // hashed
  email?: string
  biometricEnabled?: boolean
  createdAt: string
}

export type Operator = {
  id: string
  phone: string
  name: string
  pin: string // hashed
  email?: string
  createdAt: string
}

export type Wallet = {
  userId: string
  usdBalance: number
  zwlBalance: number
  updatedAt: string
}

export type Route = {
  id: string
  operatorId: string
  name: string
  description?: string
  fareUSD: number
  fareZWL: number
  qrCode: string
  createdAt: string
}

export type Transaction = {
  id: string
  userId?: string
  operatorId?: string
  routeId?: string
  type: "payment" | "topup"
  category: "bus" | "transfer"
  amount: number
  currency: "USD" | "ZWL"
  description: string
  status: "completed" | "failed" | "pending"
  paymentMethod?: string
  createdAt: string
}

function rid() {
  return crypto.randomUUID()
}
function now() {
  return new Date().toISOString()
}

// In-memory stores
const users = new Map<string, User>()
const operators = new Map<string, Operator>()
const wallets = new Map<string, Wallet>()
const routes = new Map<string, Route>()
const txns = new Map<string, Transaction>()
const phoneToUserId = new Map<string, string>()
const phoneToOperatorId = new Map<string, string>()
const qrToRouteId = new Map<string, string>()

let seeded = false
async function seed() {
  if (seeded) return
  seeded = true

  // Demo user: +263772222222 / 1234
  const user: User = {
    id: rid(),
    phone: "+263772222222",
    name: "Demo User",
    pin: await bcrypt.hash("1234", 10),
    createdAt: now(),
  }
  users.set(user.id, user)
  phoneToUserId.set(user.phone, user.id)
  wallets.set(user.id, {
    userId: user.id,
    usdBalance: 10,
    zwlBalance: 100,
    updatedAt: now(),
  })

  // Demo operator: +263771111111 / 1234
  const op: Operator = {
    id: rid(),
    phone: "+263771111111",
    name: "Demo Operator",
    pin: await bcrypt.hash("1234", 10),
    createdAt: now(),
  }
  operators.set(op.id, op)
  phoneToOperatorId.set(op.phone, op.id)

  const r1: Route = {
    id: rid(),
    operatorId: op.id,
    name: "City ↔ Avondale",
    fareUSD: 1.0,
    fareZWL: 10.0,
    qrCode: "PP_DEMO_ROUTE_A",
    createdAt: now(),
  }
  const r2: Route = {
    id: rid(),
    operatorId: op.id,
    name: "CBD ↔ Borrowdale",
    fareUSD: 1.5,
    fareZWL: 15.0,
    qrCode: "PP_DEMO_ROUTE_B",
    createdAt: now(),
  }
  routes.set(r1.id, r1)
  routes.set(r2.id, r2)
  qrToRouteId.set(r1.qrCode, r1.id)
  qrToRouteId.set(r2.qrCode, r2.id)

  const t1: Transaction = {
    id: rid(),
    userId: user.id,
    operatorId: op.id,
    routeId: r1.id,
    type: "payment",
    category: "bus",
    amount: 1,
    currency: "USD",
    description: "Bus fare - City ↔ Avondale",
    status: "completed",
    createdAt: now(),
  }
  txns.set(t1.id, t1)
}

// Exporting storage for use in other modules
export { storage }
export type { Storage }
