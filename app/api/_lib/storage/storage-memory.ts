import bcrypt from "bcryptjs"

// Define types directly in this file to avoid circular dependencies
export interface User {
  id: string
  fullName: string
  phone: string
  email: string
  pin: string
  biometricEnabled: boolean
  walletBalance: number
  createdAt: Date
  updatedAt: Date
}

export interface Operator {
  id: string
  companyName: string
  phone: string
  email: string
  pin: string
  licenseNumber: string
  vehicleCount: number
  totalEarnings: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: "payment" | "topup" | "transfer"
  amount: number
  description: string
  operatorId?: string
  status: "pending" | "completed" | "failed"
  createdAt: Date
  updatedAt: Date
}

export interface Route {
  id: string
  operatorId: string
  name: string
  startLocation: string
  endLocation: string
  fare: number
  distance: number
  estimatedDuration: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PaymentRequest {
  id: string
  senderId: string
  receiverId: string
  amount: number
  description: string
  billType: string
  status: "pending" | "accepted" | "declined" | "expired"
  expiresAt: Date
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
}

// Storage interface
export interface StorageInterface {
  ensureSeeded(): Promise<void>
  createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>
  getUserById(id: string): Promise<User | null>
  getUserByPhone(phone: string): Promise<User | null>
  updateUser(id: string, updates: Partial<User>): Promise<User | null>
  getUserWalletBalance(userId: string): Promise<number>
  updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean>
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>
  createOperator(operatorData: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator>
  getOperatorById(id: string): Promise<Operator | null>
  getOperatorByPhone(phone: string): Promise<Operator | null>
  createTransaction(txnData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction>
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>
  getOperatorTransactions(operatorId: string, limit?: number): Promise<Transaction[]>
  createRoute(routeData: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route>
  getOperatorRoutes(operatorId: string): Promise<Route[]>
  getRouteById(id: string): Promise<Route | null>
  createPaymentRequest(requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">): Promise<PaymentRequest>
  getPaymentRequestById(id: string): Promise<PaymentRequest | null>
  getUserSentPaymentRequests(userId: string): Promise<PaymentRequest[]>
  getUserReceivedPaymentRequests(userId: string): Promise<PaymentRequest[]>
  updatePaymentRequestStatus(
    id: string,
    status: "accepted" | "declined" | "expired",
    respondedAt?: Date,
  ): Promise<PaymentRequest | null>
  createNotification(notificationData: Omit<NotificationRecord, "id" | "createdAt">): Promise<NotificationRecord>
  getUserNotifications(userId: string, limit?: number): Promise<NotificationRecord[]>
  markNotificationAsRead(id: string): Promise<boolean>
  getUnreadNotificationCount(userId: string): Promise<number>
  getAdminByPhone(phone: string): Promise<any>
  getMerchantByPhone(phone: string): Promise<any>
  getPartnerByPhone(phone: string): Promise<any>
}

// Global seeding flag
let isSeeded = false

// Mock data templates
const mockUsers: Omit<User, "pin">[] = [
  {
    id: "user_1",
    fullName: "John Doe",
    phone: "+263771234567",
    email: "john@example.com",
    biometricEnabled: false,
    walletBalance: 50.0,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "user_2",
    fullName: "Sarah Wilson",
    phone: "+263772345678",
    email: "sarah@example.com",
    biometricEnabled: true,
    walletBalance: 125.75,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "user_3",
    fullName: "Mike Johnson",
    phone: "+263773456789",
    email: "mike@example.com",
    biometricEnabled: false,
    walletBalance: 89.25,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "user_4",
    fullName: "Emma Davis",
    phone: "+263774567890",
    email: "emma@example.com",
    biometricEnabled: true,
    walletBalance: 203.5,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
  {
    id: "user_5",
    fullName: "David Brown",
    phone: "+263775678901",
    email: "david@example.com",
    biometricEnabled: false,
    walletBalance: 67.8,
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
]

const mockPaymentRequests: PaymentRequest[] = [
  {
    id: "req_1",
    senderId: "user_2",
    receiverId: "user_1",
    amount: 15.5,
    description: "Groceries split",
    billType: "groceries",
    status: "pending",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-15T08:00:00Z"),
    updatedAt: new Date("2024-01-15T08:00:00Z"),
  },
  {
    id: "req_2",
    senderId: "user_3",
    receiverId: "user_1",
    amount: 8.0,
    description: "Bus ticket",
    billType: "transport",
    status: "pending",
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-15T12:30:00Z"),
    updatedAt: new Date("2024-01-15T12:30:00Z"),
  },
  {
    id: "req_3",
    senderId: "user_1",
    receiverId: "user_4",
    amount: 22.0,
    description: "Dinner bill",
    billType: "food",
    status: "pending",
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-15T19:00:00Z"),
    updatedAt: new Date("2024-01-15T19:00:00Z"),
  },
]

const mockNotifications: NotificationRecord[] = [
  {
    id: "notif_1",
    userId: "user_1",
    type: "payment_request_received",
    title: "Payment Request",
    message: "Sarah Wilson requested $15.50 for Groceries split",
    data: { requestId: "req_1", amount: 15.5, senderName: "Sarah Wilson" },
    isRead: false,
    createdAt: new Date("2024-01-15T08:00:00Z"),
  },
  {
    id: "notif_2",
    userId: "user_1",
    type: "payment_request_received",
    title: "Payment Request",
    message: "Mike Johnson requested $8.00 for Bus ticket",
    data: { requestId: "req_2", amount: 8.0, senderName: "Mike Johnson" },
    isRead: false,
    createdAt: new Date("2024-01-15T12:30:00Z"),
  },
  {
    id: "notif_3",
    userId: "user_4",
    type: "payment_request_received",
    title: "Payment Request",
    message: "John Doe requested $22.00 for Dinner bill",
    data: { requestId: "req_3", amount: 22.0, senderName: "John Doe" },
    isRead: false,
    createdAt: new Date("2024-01-15T19:00:00Z"),
  },
]

export class MemoryStorage implements StorageInterface {
  private users: User[] = []
  private operators: Operator[] = []
  private transactions: Transaction[] = []
  private routes: Route[] = []
  private paymentRequests: PaymentRequest[] = []
  private notifications: NotificationRecord[] = []

  async ensureSeeded(): Promise<void> {
    if (isSeeded) {
      console.log("Memory storage already seeded, skipping...")
      return
    }

    console.log("Seeding memory storage with mock data...")

    try {
      // Hash PINs for all users (using '1234' as default PIN)
      const hashedPin = await bcrypt.hash("1234", 10)

      // Seed users with hashed PINs
      this.users = mockUsers.map((user) => ({ ...user, pin: hashedPin }))

      // Seed other data
      this.paymentRequests = [...mockPaymentRequests]
      this.notifications = [...mockNotifications]

      isSeeded = true
      console.log("Memory storage seeded successfully with", this.users.length, "users")
    } catch (error) {
      console.error("Error seeding memory storage:", error)
      throw error
    }
  }

  // User methods
  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(user)
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const user = this.users.find((user) => user.phone === phone)
    console.log(`Looking for user with phone ${phone}, found:`, user ? user.fullName : "none")
    return user || null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    }
    return this.users[userIndex]
  }

  async getUserWalletBalance(userId: string): Promise<number> {
    const user = await this.getUserById(userId)
    return user?.walletBalance || 0
  }

  async updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean> {
    const user = await this.updateUser(userId, { walletBalance: newBalance })
    return !!user
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const searchTerm = query.toLowerCase()
    return this.users
      .filter((user) => {
        if (excludeUserId && user.id === excludeUserId) return false
        return (
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.phone.includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        )
      })
      .slice(0, 10)
  }

  // Operator methods
  async createOperator(operatorData: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator> {
    const operator: Operator = {
      id: `op_${Date.now()}`,
      ...operatorData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.operators.push(operator)
    return operator
  }

  async getOperatorById(id: string): Promise<Operator | null> {
    return this.operators.find((op) => op.id === id) || null
  }

  async getOperatorByPhone(phone: string): Promise<Operator | null> {
    return this.operators.find((op) => op.phone === phone) || null
  }

  // Transaction methods
  async createTransaction(txnData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      ...txnData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.transactions.push(transaction)
    return transaction
  }

  async getUserTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    const userTxns = this.transactions
      .filter((txn) => txn.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return limit ? userTxns.slice(0, limit) : userTxns
  }

  async getOperatorTransactions(operatorId: string, limit?: number): Promise<Transaction[]> {
    const opTxns = this.transactions
      .filter((txn) => txn.operatorId === operatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return limit ? opTxns.slice(0, limit) : opTxns
  }

  // Route methods
  async createRoute(routeData: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route> {
    const route: Route = {
      id: `route_${Date.now()}`,
      ...routeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.routes.push(route)
    return route
  }

  async getOperatorRoutes(operatorId: string): Promise<Route[]> {
    return this.routes.filter((route) => route.operatorId === operatorId && route.isActive)
  }

  async getRouteById(id: string): Promise<Route | null> {
    return this.routes.find((route) => route.id === id) || null
  }

  // Payment Request methods
  async createPaymentRequest(
    requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">,
  ): Promise<PaymentRequest> {
    const request: PaymentRequest = {
      id: `req_${Date.now()}`,
      ...requestData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.paymentRequests.push(request)
    return request
  }

  async getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
    return this.paymentRequests.find((req) => req.id === id) || null
  }

  async getUserSentPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    return this.paymentRequests
      .filter((req) => req.senderId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getUserReceivedPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    return this.paymentRequests
      .filter((req) => req.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async updatePaymentRequestStatus(
    id: string,
    status: "accepted" | "declined" | "expired",
    respondedAt?: Date,
  ): Promise<PaymentRequest | null> {
    const requestIndex = this.paymentRequests.findIndex((req) => req.id === id)
    if (requestIndex === -1) return null

    this.paymentRequests[requestIndex] = {
      ...this.paymentRequests[requestIndex],
      status,
      respondedAt,
      updatedAt: new Date(),
    }
    return this.paymentRequests[requestIndex]
  }

  // Notification methods
  async createNotification(
    notificationData: Omit<NotificationRecord, "id" | "createdAt">,
  ): Promise<NotificationRecord> {
    const notification: NotificationRecord = {
      id: `notif_${Date.now()}`,
      ...notificationData,
      createdAt: new Date(),
    }
    this.notifications.push(notification)
    return notification
  }

  async getUserNotifications(userId: string, limit?: number): Promise<NotificationRecord[]> {
    const userNotifs = this.notifications
      .filter((notif) => notif.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return limit ? userNotifs.slice(0, limit) : userNotifs
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notifIndex = this.notifications.findIndex((notif) => notif.id === id)
    if (notifIndex === -1) return false
    this.notifications[notifIndex].isRead = true
    return true
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.notifications.filter((notif) => notif.userId === userId && !notif.isRead).length
  }

  // Legacy methods for compatibility
  async getAdminByPhone(phone: string): Promise<any> {
    return null
  }

  async getMerchantByPhone(phone: string): Promise<any> {
    return null
  }

  async getPartnerByPhone(phone: string): Promise<any> {
    return null
  }
}

// Create and export the storage instance
export const storage = new MemoryStorage()
