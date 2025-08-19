import {
  users,
  operators,
  wallets,
  routes,
  transactions,
  type User,
  type InsertUser,
  type Operator,
  type InsertOperator,
  type Wallet,
  type InsertWallet,
  type Route,
  type InsertRoute,
  type Transaction,
  type InsertTransaction,
} from "@/shared/schema"
import { db } from "./db"
import { eq, desc, and, sql, or, ilike } from "drizzle-orm"

// New types for Request-to-Pay feature
export interface PaymentRequest {
  id: string
  senderId: string
  recipientId: string
  amount: string
  currency: "USD" | "ZWL"
  billType: string
  description: string
  status: "pending" | "accepted" | "declined" | "expired"
  transactionId?: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export interface InsertPaymentRequest {
  senderId: string
  recipientId: string
  amount: string
  currency: "USD" | "ZWL"
  billType: string
  description?: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}

export interface InsertNotification {
  userId: string
  type: string
  title: string
  message: string
  data?: any
}

export interface IStorage {
  // Existing user operations
  getUser(id: string): Promise<User | undefined>
  getUserByPhone(phone: string): Promise<User | undefined>
  createUser(user: InsertUser): Promise<User>

  // Existing operator operations
  getOperator(id: string): Promise<Operator | undefined>
  getOperatorByPhone(phone: string): Promise<Operator | undefined>
  createOperator(operator: InsertOperator): Promise<Operator>

  // Existing wallet operations
  getWalletByUserId(userId: string): Promise<Wallet | undefined>
  createWallet(wallet: InsertWallet): Promise<Wallet>
  updateWalletBalance(userId: string, currency: "USD" | "ZWL", amount: string): Promise<Wallet>

  // Existing route operations
  getRoute(id: string): Promise<Route | undefined>
  getRouteByQrCode(qrCode: string): Promise<Route | undefined>
  getRoutesByOperatorId(operatorId: string): Promise<Route[]>
  createRoute(route: InsertRoute): Promise<Route>

  // Existing transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>
  getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>
  getTransactionsByOperatorId(operatorId: string, limit?: number): Promise<Transaction[]>
  getTransactionsByRouteId(routeId: string): Promise<Transaction[]>

  // New Request-to-Pay operations
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>
  getPaymentRequestsBySender(senderId: string): Promise<PaymentRequest[]>
  getPaymentRequestsByRecipient(recipientId: string): Promise<PaymentRequest[]>
  updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest>
  updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest>

  // User search operations
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>
  getNotificationsByUserId(userId: string): Promise<Notification[]>
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>
}

export class DatabaseStorage implements IStorage {
  // Existing methods remain unchanged...
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user || undefined
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone))
    return user || undefined
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning()

    // Create wallet for new user
    await this.createWallet({ userId: user.id })

    return user
  }

  async getOperator(id: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(operators).where(eq(operators.id, id))
    return operator || undefined
  }

  async getOperatorByPhone(phone: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(operators).where(eq(operators.phone, phone))
    return operator || undefined
  }

  async createOperator(insertOperator: InsertOperator): Promise<Operator> {
    const [operator] = await db.insert(operators).values(insertOperator).returning()
    return operator
  }

  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId))
    return wallet || undefined
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db.insert(wallets).values(insertWallet).returning()
    return wallet
  }

  async updateWalletBalance(userId: string, currency: "USD" | "ZWL", amount: string): Promise<Wallet> {
    if (currency === "USD") {
      const [wallet] = await db
        .update(wallets)
        .set({
          usdBalance: sql`usd_balance + ${amount}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId))
        .returning()
      return wallet
    } else {
      const [wallet] = await db
        .update(wallets)
        .set({
          zwlBalance: sql`zwl_balance + ${amount}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId))
        .returning()
      return wallet
    }
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id))
    return route || undefined
  }

  async getRouteByQrCode(qrCode: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.qrCode, qrCode))
    return route || undefined
  }

  async getRoutesByOperatorId(operatorId: string): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.operatorId, operatorId))
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db.insert(routes).values(insertRoute).returning()
    return route
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning()
    return transaction
  }

  async getTransactionsByUserId(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
  }

  async getTransactionsByOperatorId(operatorId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.operatorId, operatorId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
  }

  async getTransactionsByRouteId(routeId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.routeId, routeId))
      .orderBy(desc(transactions.createdAt))
  }

  // New Request-to-Pay methods
  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [paymentRequest] = await db.execute(sql`
        INSERT INTO payment_requests (sender_id, recipient_id, amount, currency, bill_type, description)
        VALUES (${request.senderId}, ${request.recipientId}, ${request.amount}, ${request.currency}, ${request.billType}, ${request.description || ""})
        RETURNING *
      `)
    return paymentRequest as PaymentRequest
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.execute(sql`SELECT * FROM payment_requests WHERE id = ${id}`)
    return (request as PaymentRequest) || undefined
  }

  async getPaymentRequestsBySender(senderId: string): Promise<PaymentRequest[]> {
    const requests = await db.execute(sql`
        SELECT * FROM payment_requests 
        WHERE sender_id = ${senderId} 
        ORDER BY created_at DESC
      `)
    return requests as PaymentRequest[]
  }

  async getPaymentRequestsByRecipient(recipientId: string): Promise<PaymentRequest[]> {
    const requests = await db.execute(sql`
        SELECT * FROM payment_requests 
        WHERE recipient_id = ${recipientId} 
        ORDER BY created_at DESC
      `)
    return requests as PaymentRequest[]
  }

  async updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest> {
    const [request] = await db.execute(sql`
        UPDATE payment_requests 
        SET status = ${status}, updated_at = NOW() 
        WHERE id = ${id} 
        RETURNING *
      `)
    return request as PaymentRequest
  }

  async updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest> {
    const setClause = Object.entries(updates)
      .map(([key, value]) => `${key} = ${typeof value === "string" ? `'${value}'` : value}`)
      .join(", ")

    const [request] = await db.execute(sql`
        UPDATE payment_requests 
        SET ${sql.raw(setClause)}, updated_at = NOW() 
        WHERE id = ${id} 
        RETURNING *
      `)
    return request as PaymentRequest
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    let whereClause = or(
      ilike(users.fullName, `%${query}%`),
      ilike(users.phone, `%${query}%`),
      ilike(users.email, `%${query}%`),
    )

    if (excludeUserId) {
      whereClause = and(whereClause, sql`${users.id} != ${excludeUserId}`)
    }

    return await db.select().from(users).where(whereClause).limit(10)
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.execute(sql`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (${notification.userId}, ${notification.type}, ${notification.title}, ${notification.message}, ${JSON.stringify(notification.data || {})})
        RETURNING *
      `)
    return newNotification as Notification
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const notifications = await db.execute(sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT 50
      `)
    return notifications as Notification[]
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db.execute(sql`
        UPDATE notifications 
        SET read = TRUE 
        WHERE id = ${notificationId} AND user_id = ${userId}
      `)
  }
}

export const storage = new DatabaseStorage()
