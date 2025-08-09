import { randomUUID } from "crypto";

export type User = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  pinHash: string;
  biometricEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Operator = {
  id: string;
  companyName: string;
  phone: string;
  email?: string;
  pinHash: string;
  createdAt: string;
  updatedAt: string;
};

export type Wallet = {
  id: string;
  userId: string;
  usdBalance: string;
  zwlBalance: string;
  createdAt: string;
  updatedAt: string;
};

export type Route = {
  id: string;
  operatorId: string;
  name: string;
  description?: string;
  fareUsd: string;
  fareZwl: string;
  qrCode: string;
  isActive: boolean;
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId?: string;
  operatorId?: string;
  routeId?: string;
  type: "payment" | "topup" | "send" | "receive";
  category: "bus" | "shop" | "utility" | "transfer";
  amount: string;
  currency: "USD" | "ZWL";
  description: string;
  status: "pending" | "completed" | "failed";
  paymentMethod?: string;
  reference?: string;
  createdAt: string;
};

const nowISO = () => new Date().toISOString()

export class InMemoryDB {
  users: User[] = []
  operators: Operator[] = []
  wallets: Wallet[] = []
  routes: Route[] = []
  transactions: Transaction[] = []

  constructor() {
    // Seed operator and routes
    const opId = randomUUID()
    const operator: Operator = {
      id: opId,
      companyName: "Demo Bus Co.",
      phone: "+263771111111",
      email: "operator@demo.com",
      pinHash: "$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W", // 1234
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    this.operators.push(operator)

    const routeA: Route = {
      id: randomUUID(),
      operatorId: opId,
      name: "Route A - CBD to Avondale",
      description: "Express commuter bus",
      fareUsd: "1.00",
      fareZwl: "15.00",
      qrCode: "PP_DEMO_ROUTE_A",
      isActive: true,
      createdAt: nowISO(),
    }
    const routeB: Route = {
      id: randomUUID(),
      operatorId: opId,
      name: "Route B - CBD to Borrowdale",
      description: "Regular service",
      fareUsd: "1.50",
      fareZwl: "22.50",
      qrCode: "PP_DEMO_ROUTE_B",
      isActive: true,
      createdAt: nowISO(),
    }
    this.routes.push(routeA, routeB)

    // Seed users
    const u1 = this.createUser({
      fullName: "Tendai Moyo",
      phone: "+263772222222",
      email: "tendai@example.com",
      pinHash: "$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W", // 1234
      biometricEnabled: false,
    })
    const u2 = this.createUser({
      fullName: "Rudo Chikafu",
      phone: "+263773333333",
      email: "rudo@example.com",
      pinHash: "$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W", // 1234
      biometricEnabled: true,
    })

    // Seed transactions
    this.createTransaction({
      userId: u1.id,
      operatorId: opId,
      routeId: routeA.id,
      type: "payment",
      category: "bus",
      amount: "1.00",
      currency: "USD",
      description: `Bus fare - ${routeA.name}`,
      status: "completed",
      paymentMethod: "wallet",
    })
    this.createTransaction({
      userId: u1.id,
      type: "topup",
      category: "transfer",
      amount: "10.00",
      currency: "USD",
      description: "Top-up via EcoCash",
      status: "completed",
      paymentMethod: "EcoCash",
    })
    this.updateWalletBalance(u1.id, "USD", "9.00") // 5 + 10 - 1 = 14; this adds +9 to reflect seed ordering

    this.createTransaction({
      userId: u2.id,
      operatorId: opId,
      routeId: routeB.id,
      type: "payment",
      category: "bus",
      amount: "1.50",
      currency: "USD",
      description: `Bus fare - ${routeB.name}`,
      status: "completed",
      paymentMethod: "wallet",
    })
    this.updateWalletBalance(u2.id, "USD", "-1.50")
  }

  createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const u: User = { id: randomUUID(), ...user, createdAt: nowISO(), updatedAt: nowISO() }
    this.users.push(u)
    const wallet: Wallet = {
      id: randomUUID(),
      userId: u.id,
      usdBalance: "5.00",
      zwlBalance: "50.00",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    this.wallets.push(wallet)
    return u
  }

  getUserByPhone(phone: string) {
    return this.users.find((u) => u.phone === phone)
  }
  getUser(id: string) {
    return this.users.find((u) => u.id === id)
  }

  createOperator(operator: Omit<Operator, "id" | "createdAt" | "updatedAt">) {
    const o: Operator = { id: randomUUID(), ...operator, createdAt: nowISO(), updatedAt: nowISO() }
    this.operators.push(o)
    return o
  }
  getOperatorByPhone(phone: string) {
    return this.operators.find((o) => o.phone === phone)
  }
  getOperator(id: string) {
    return this.operators.find((o) => o.id === id)
  }

  getWalletByUserId(userId: string) {
    return this.wallets.find((w) => w.userId === userId)
  }
  updateWalletBalance(userId: string, currency: "USD" | "ZWL", deltaStr: string) {
    const w = this.getWalletByUserId(userId)
    if (!w) return undefined
    const current = currency === "USD" ? parseFloat(w.usdBalance) : parseFloat(w.zwlBalance)
    const delta = parseFloat(deltaStr)
    const next = (current + delta).toFixed(2)
    if (currency === "USD") w.usdBalance = next
    else w.zwlBalance = next
    w.updatedAt = nowISO()
    return w
  }

  createTransaction(tx: Omit<Transaction, "id" | "createdAt">) {
    const t: Transaction = { id: randomUUID(), createdAt: nowISO(), ...tx }
    this.transactions.unshift(t)
    return t
  }

  getTransactionsByUserId(userId: string, limit = 50) {
    return this.transactions.filter((t) => t.userId === userId).slice(0, limit)
  }
  getTransactionsByOperatorId(operatorId: string, limit = 50) {
    return this.transactions.filter((t) => t.operatorId === operatorId).slice(0, limit)
  }

  getRouteByQr(qr: string) {
    return this.routes.find((r) => r.qrCode === qr)
  }
  getRoute(id: string) {
    return this.routes.find((r) => r.id === id)
  }
  getRoutesByOperatorId(operatorId: string) {
    return this.routes.filter((r) => r.operatorId === operatorId)
  }
  createRoute(route: Omit<Route, "id" | "createdAt" | "isActive">) {
    const r: Route = { id: randomUUID(), ...route, isActive: true, createdAt: nowISO() }
    this.routes.push(r)
    return r
  }
}

export const db = new InMemoryDB()

export function normalizePhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, "")
  if (clean.startsWith("263")) return `+${clean}`
  if (clean.startsWith("0")) return `+263${clean.slice(1)}`
  if (clean.length === 9) return `+263${clean}`
  return `+263${clean}`
}
