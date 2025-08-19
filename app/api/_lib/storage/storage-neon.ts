import { neon } from "@neondatabase/serverless"
import type { User, Operator, Transaction, Route, PaymentRequest, NotificationRecord, StorageInterface } from "./index"

const sql = neon(process.env.DATABASE_URL!)

export class NeonStorage implements StorageInterface {
  async ensureSeeded(): Promise<void> {
    // For Neon, we assume tables are already created via migrations
    // This is a no-op for production database
    console.log("Neon storage - tables assumed to exist via migrations")
  }

  // User methods
  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const result = await sql`
      INSERT INTO users (full_name, phone, email, pin, biometric_enabled, wallet_balance)
      VALUES (${userData.fullName}, ${userData.phone}, ${userData.email}, ${userData.pin}, ${userData.biometricEnabled}, ${userData.walletBalance})
      RETURNING *
    `
    return this.mapUserFromDb(result[0])
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`
    return result[0] ? this.mapUserFromDb(result[0]) : null
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE phone = ${phone}`
    return result[0] ? this.mapUserFromDb(result[0]) : null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const setClause = Object.keys(updates)
      .filter((key) => key !== "id" && key !== "createdAt")
      .map((key) => `${this.camelToSnake(key)} = $${key}`)
      .join(", ")

    if (!setClause) return null

    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] ? this.mapUserFromDb(result[0]) : null
  }

  async getUserWalletBalance(userId: string): Promise<number> {
    const result = await sql`SELECT wallet_balance FROM users WHERE id = ${userId}`
    return result[0]?.wallet_balance || 0
  }

  async updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean> {
    const result = await sql`
      UPDATE users 
      SET wallet_balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${userId}
    `
    return result.length > 0
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const searchTerm = `%${query.toLowerCase()}%`
    let result

    if (excludeUserId) {
      result = await sql`
        SELECT * FROM users 
        WHERE id != ${excludeUserId}
        AND (LOWER(full_name) LIKE ${searchTerm} OR phone LIKE ${searchTerm} OR LOWER(email) LIKE ${searchTerm})
        LIMIT 10
      `
    } else {
      result = await sql`
        SELECT * FROM users 
        WHERE LOWER(full_name) LIKE ${searchTerm} OR phone LIKE ${searchTerm} OR LOWER(email) LIKE ${searchTerm}
        LIMIT 10
      `
    }

    return result.map((row) => this.mapUserFromDb(row))
  }

  // Operator methods
  async createOperator(operatorData: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator> {
    const result = await sql`
      INSERT INTO operators (company_name, phone, email, pin, license_number, vehicle_count, total_earnings, is_active)
      VALUES (${operatorData.companyName}, ${operatorData.phone}, ${operatorData.email}, ${operatorData.pin}, ${operatorData.licenseNumber}, ${operatorData.vehicleCount}, ${operatorData.totalEarnings}, ${operatorData.isActive})
      RETURNING *
    `
    return this.mapOperatorFromDb(result[0])
  }

  async getOperatorById(id: string): Promise<Operator | null> {
    const result = await sql`SELECT * FROM operators WHERE id = ${id}`
    return result[0] ? this.mapOperatorFromDb(result[0]) : null
  }

  async getOperatorByPhone(phone: string): Promise<Operator | null> {
    const result = await sql`SELECT * FROM operators WHERE phone = ${phone}`
    return result[0] ? this.mapOperatorFromDb(result[0]) : null
  }

  // Transaction methods
  async createTransaction(txnData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const result = await sql`
      INSERT INTO transactions (user_id, type, amount, description, operator_id, status)
      VALUES (${txnData.userId}, ${txnData.type}, ${txnData.amount}, ${txnData.description}, ${txnData.operatorId}, ${txnData.status})
      RETURNING *
    `
    return this.mapTransactionFromDb(result[0])
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const result = await sql`
      SELECT * FROM transactions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.map((row) => this.mapTransactionFromDb(row))
  }

  async getOperatorTransactions(operatorId: string, limit = 50): Promise<Transaction[]> {
    const result = await sql`
      SELECT * FROM transactions 
      WHERE operator_id = ${operatorId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.map((row) => this.mapTransactionFromDb(row))
  }

  // Route methods
  async createRoute(routeData: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route> {
    const result = await sql`
      INSERT INTO routes (operator_id, name, start_location, end_location, fare, distance, estimated_duration, is_active)
      VALUES (${routeData.operatorId}, ${routeData.name}, ${routeData.startLocation}, ${routeData.endLocation}, ${routeData.fare}, ${routeData.distance}, ${routeData.estimatedDuration}, ${routeData.isActive})
      RETURNING *
    `
    return this.mapRouteFromDb(result[0])
  }

  async getOperatorRoutes(operatorId: string): Promise<Route[]> {
    const result = await sql`
      SELECT * FROM routes 
      WHERE operator_id = ${operatorId} AND is_active = true
      ORDER BY name
    `
    return result.map((row) => this.mapRouteFromDb(row))
  }

  async getRouteById(id: string): Promise<Route | null> {
    const result = await sql`SELECT * FROM routes WHERE id = ${id}`
    return result[0] ? this.mapRouteFromDb(result[0]) : null
  }

  // Payment Request methods
  async createPaymentRequest(
    requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">,
  ): Promise<PaymentRequest> {
    const result = await sql`
      INSERT INTO payment_requests (sender_id, receiver_id, amount, description, bill_type, status, expires_at)
      VALUES (${requestData.senderId}, ${requestData.receiverId}, ${requestData.amount}, ${requestData.description}, ${requestData.billType}, ${requestData.status}, ${requestData.expiresAt})
      RETURNING *
    `
    return this.mapPaymentRequestFromDb(result[0])
  }

  async getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
    const result = await sql`SELECT * FROM payment_requests WHERE id = ${id}`
    return result[0] ? this.mapPaymentRequestFromDb(result[0]) : null
  }

  async getUserSentPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    const result = await sql`
      SELECT * FROM payment_requests 
      WHERE sender_id = ${userId}
      ORDER BY created_at DESC
    `
    return result.map((row) => this.mapPaymentRequestFromDb(row))
  }

  async getUserReceivedPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    const result = await sql`
      SELECT * FROM payment_requests 
      WHERE receiver_id = ${userId}
      ORDER BY created_at DESC
    `
    return result.map((row) => this.mapPaymentRequestFromDb(row))
  }

  async updatePaymentRequestStatus(
    id: string,
    status: "accepted" | "declined" | "expired",
    respondedAt?: Date,
  ): Promise<PaymentRequest | null> {
    const result = await sql`
      UPDATE payment_requests 
      SET status = ${status}, responded_at = ${respondedAt || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] ? this.mapPaymentRequestFromDb(result[0]) : null
  }

  // Notification methods
  async createNotification(
    notificationData: Omit<NotificationRecord, "id" | "createdAt">,
  ): Promise<NotificationRecord> {
    const result = await sql`
      INSERT INTO notifications (user_id, type, title, message, data, is_read)
      VALUES (${notificationData.userId}, ${notificationData.type}, ${notificationData.title}, ${notificationData.message}, ${JSON.stringify(notificationData.data)}, ${notificationData.isRead})
      RETURNING *
    `
    return this.mapNotificationFromDb(result[0])
  }

  async getUserNotifications(userId: string, limit = 50): Promise<NotificationRecord[]> {
    const result = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.map((row) => this.mapNotificationFromDb(row))
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await sql`
      UPDATE notifications 
      SET is_read = true
      WHERE id = ${id}
    `
    return result.length > 0
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${userId} AND is_read = false
    `
    return Number.parseInt(result[0]?.count || "0")
  }

  // Legacy methods for compatibility
  async getAdminByPhone(phone: string): Promise<any> {
    return null // Not implemented for Neon yet
  }

  async getMerchantByPhone(phone: string): Promise<any> {
    return null // Not implemented for Neon yet
  }

  async getPartnerByPhone(phone: string): Promise<any> {
    return null // Not implemented for Neon yet
  }

  // Helper methods for mapping database rows to objects
  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      pin: row.pin,
      biometricEnabled: row.biometric_enabled,
      walletBalance: Number.parseFloat(row.wallet_balance),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  private mapOperatorFromDb(row: any): Operator {
    return {
      id: row.id,
      companyName: row.company_name,
      phone: row.phone,
      email: row.email,
      pin: row.pin,
      licenseNumber: row.license_number,
      vehicleCount: row.vehicle_count,
      totalEarnings: Number.parseFloat(row.total_earnings),
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  private mapTransactionFromDb(row: any): Transaction {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: Number.parseFloat(row.amount),
      description: row.description,
      operatorId: row.operator_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  private mapRouteFromDb(row: any): Route {
    return {
      id: row.id,
      operatorId: row.operator_id,
      name: row.name,
      startLocation: row.start_location,
      endLocation: row.end_location,
      fare: Number.parseFloat(row.fare),
      distance: Number.parseFloat(row.distance),
      estimatedDuration: row.estimated_duration,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  private mapPaymentRequestFromDb(row: any): PaymentRequest {
    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      amount: Number.parseFloat(row.amount),
      description: row.description,
      billType: row.bill_type,
      status: row.status,
      expiresAt: new Date(row.expires_at),
      respondedAt: row.responded_at ? new Date(row.responded_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  private mapNotificationFromDb(row: any): NotificationRecord {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : undefined,
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }
}
