import bcrypt from "bcryptjs"

interface User {
  id: string
  fullName: string
  phoneNumber: string
  email?: string
  password: string
  walletBalance: number
  createdAt: Date
  updatedAt: Date
  // Profile additions
  dateOfBirth?: Date
  joinedDate: Date
  paypassUsername: string
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

export interface Admin {
  id: string
  fullName: string
  phone: string
  email: string
  pin: string
  role: "super_admin" | "platform_admin" | "support_admin"
  permissions: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Merchant {
  id: string
  businessName: string
  phone: string
  email: string
  pin: string
  businessType: "retailer" | "utility" | "service_provider"
  licenseNumber: string
  totalEarnings: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Partner {
  id: string
  companyName: string
  phone: string
  email: string
  pin: string
  partnerType: "mobile_money" | "bank" | "fintech"
  integrationKey: string
  totalTransactions: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: "payment" | "topup" | "top_up" | "transfer" | "bus_ticket" | "grocery" | "utility"
| "electricity" | "water" | "internet" | "bill_payment" | "payment_request" | "qr_payment" | "transfer_received"

  amount: number
  description: string
  operatorId?: string
  status: "pending" | "completed" | "failed"
  isPaid: boolean
  createdAt: Date
  updatedAt: Date
  // New fields for better transaction management
  category?: string
  merchantName?: string
  receiptNumber?: string
  dueDate?: Date
  // Prevent duplicates
  transactionHash: string
  // Additional metadata
  metadata?: Record<string, any>
}

interface PaymentRequest {
  id: string
  senderId: string
  recipientId: string
  amount: number
  description: string
  billType: string
  status: "pending" | "accepted" | "declined" | "expired"
  linkedTransactionId?: string
  expiresAt: Date
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: string
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
  createAdmin(adminData: Omit<Admin, "id" | "createdAt" | "updatedAt">): Promise<Admin>
  getAdminById(id: string): Promise<Admin | null>
  getAdminByPhone(phone: string): Promise<Admin | null>
  createMerchant(merchantData: Omit<Merchant, "id" | "createdAt" | "updatedAt">): Promise<Merchant>
  getMerchantById(id: string): Promise<Merchant | null>
  getMerchantByPhone(phone: string): Promise<Merchant | null>
  createPartner(partnerData: Omit<Partner, "id" | "createdAt" | "updatedAt">): Promise<Partner>
  getPartnerById(id: string): Promise<Partner | null>
  getPartnerByPhone(phone: string): Promise<Partner | null>
  createTransaction(txnData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction>
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>
  getOperatorTransactions(operatorId: string, limit?: number): Promise<Transaction[]>
  createRoute(routeData: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route>
  getOperatorRoutes(operatorId: string): Promise<Route[]>
  getRouteById(id: string): Promise<Route | null>
  getRouteByQrCode(qrCode: string): Promise<Route | null>
  getOperator(operatorId: string): Promise<Operator | null>
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

// In-memory storage
const users: User[] = []
const transactions: Transaction[] = []
const paymentRequests: PaymentRequest[] = []
const notifications: Notification[] = []
const monthlyExpenses: MonthlyExpense[] = []
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
    joinedDate: new Date("2024-01-15"),
    paypassUsername: "@john_doe",
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
    joinedDate: new Date("2024-01-10"),
    paypassUsername: "@sarah_wilson",
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
    joinedDate: new Date("2024-01-12"),
    paypassUsername: "@mike_johnson",
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
    joinedDate: new Date("2024-01-08"),
    paypassUsername: "@emma_davis",
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
    joinedDate: new Date("2024-01-14"),
    paypassUsername: "@david_brown",
  },
]

const mockPaymentRequests: PaymentRequest[] = [
  {
    id: "req_1",
    senderId: "user_2",
    recipientId: "user_1",
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
    recipientId: "user_1",
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
    recipientId: "user_4",
    amount: 22.0,
    description: "Dinner bill",
    billType: "food",
    status: "pending",
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-15T19:00:00Z"),
    updatedAt: new Date("2024-01-15T19:00:00Z"),
  },
]

// Demo data for new user types
const mockAdmins: Omit<Admin, "pin">[] = [
  {
    id: "admin_1",
    fullName: "System Administrator",
    phone: "+263700000001",
    email: "admin@paypass.co.zw",
    role: "super_admin",
    permissions: ["all"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "admin_2",
    fullName: "Platform Manager",
    phone: "+263700000002",
    email: "manager@paypass.co.zw",
    role: "platform_admin",
    permissions: ["users", "operators", "transactions", "reports"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

const mockMerchants: Omit<Merchant, "pin">[] = [
  {
    id: "merchant_1",
    businessName: "Pick n Pay Harare",
    phone: "+263711111111",
    email: "harare@pnp.co.zw",
    businessType: "retailer",
    licenseNumber: "RET001",
    totalEarnings: 12500.75,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "merchant_2",
    businessName: "ZESA Harare",
    phone: "+263722222222",
    email: "harare@zesa.co.zw",
    businessType: "utility",
    licenseNumber: "UTL001",
    totalEarnings: 8900.50,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "merchant_3",
    businessName: "City of Harare",
    phone: "+263733333333",
    email: "payments@hararecity.co.zw",
    businessType: "service_provider",
    licenseNumber: "GOV001",
    totalEarnings: 15600.25,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

const mockPartners: Omit<Partner, "pin">[] = [
  {
    id: "partner_1",
    companyName: "EcoCash",
    phone: "+263744444444",
    email: "integration@ecocash.co.zw",
    partnerType: "mobile_money",
    integrationKey: "ecocash_prod_2024",
    totalTransactions: 45000,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "partner_2",
    companyName: "CBZ Bank",
    phone: "+263755555555",
    email: "payments@cbz.co.zw",
    partnerType: "bank",
    integrationKey: "cbz_bank_prod_2024",
    totalTransactions: 32000,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "partner_3",
    companyName: "OneMoney",
    phone: "+263766666666",
    email: "api@onemoney.co.zw",
    partnerType: "mobile_money",
    integrationKey: "onemoney_prod_2024",
    totalTransactions: 28000,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

// Demo operator data
const mockOperators: Omit<Operator, "pin">[] = [
  {
    id: "op_1",
    companyName: "City Bus Lines",
    phone: "+263712345678",
    email: "info@citybus.co.zw",
    licenseNumber: "OP001",
    vehicleCount: 25,
    totalEarnings: 12500.75,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "op_2",
    companyName: "ZUPCO Transport",
    phone: "+263775432109",
    email: "admin@zupco.co.zw",
    licenseNumber: "OP002",
    vehicleCount: 45,
    totalEarnings: 18900.50,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "op_3",
    companyName: "Harare Kombis",
    phone: "+263787654321",
    email: "contact@hararekombis.co.zw",
    licenseNumber: "OP003",
    vehicleCount: 12,
    totalEarnings: 8900.25,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "op_4",
    companyName: "Metro Peach",
    phone: "+263796543210",
    email: "support@metropeach.co.zw",
    licenseNumber: "OP004",
    vehicleCount: 18,
    totalEarnings: 15600.00,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
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
  private admins: Admin[] = []
  private merchants: Merchant[] = []
  private partners: Partner[] = []
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
      const demoUsers = [
        {
          id: "user-1",
          fullName: "John Doe",
          phone: "+263771234567",
          email: "john@paypass.demo",
          walletBalance: 150.50,
          biometricEnabled: true,
          joinedDate: new Date("2024-01-15"),
          paypassUsername: "@john_doe"
        },
        {
          id: "user-2", 
          fullName: "Jane Smith",
          phone: "+263772345678",
          email: "jane@paypass.demo",
          walletBalance: 75.25,
          biometricEnabled: false,
          joinedDate: new Date("2024-02-01"),
          paypassUsername: "@jane_smith"
        },
        {
          id: "user-3",
          fullName: "Mike Johnson", 
          phone: "+263773456789",
          email: "mike@paypass.demo",
          walletBalance: 200.00,
          biometricEnabled: true,
          joinedDate: new Date("2024-01-20"),
          paypassUsername: "@mike_johnson"
        }
      ]
      
      this.users = demoUsers.map((user) => ({ ...user, pin: hashedPin }))

      // Seed other data  
      this.paymentRequests = []
      this.notifications = []

      // Seed new user types  
      this.admins = []
      this.merchants = []
      this.partners = []
      this.operators = []

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

  // Admin methods
  async createAdmin(adminData: Omit<Admin, "id" | "createdAt" | "updatedAt">): Promise<Admin> {
    const admin: Admin = {
      id: `admin_${Date.now()}`,
      ...adminData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.admins.push(admin)
    return admin
  }

  async getAdminById(id: string): Promise<Admin | null> {
    return this.admins.find((admin) => admin.id === id) || null
  }

  async getAdminByPhone(phone: string): Promise<Admin | null> {
    return this.admins.find((admin) => admin.phone === phone) || null
  }

  // Merchant methods
  async createMerchant(merchantData: Omit<Merchant, "id" | "createdAt" | "updatedAt">): Promise<Merchant> {
    const merchant: Merchant = {
      id: `merchant_${Date.now()}`,
      ...merchantData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.merchants.push(merchant)
    return merchant
  }

  async getMerchantById(id: string): Promise<Merchant | null> {
    return this.merchants.find((merchant) => merchant.id === id) || null
  }

  async getMerchantByPhone(phone: string): Promise<Merchant | null> {
    return this.merchants.find((merchant) => merchant.phone === phone) || null
  }

  // Partner methods
  async createPartner(partnerData: Omit<Partner, "id" | "createdAt" | "updatedAt">): Promise<Partner> {
    const partner: Partner = {
      id: `partner_${Date.now()}`,
      ...partnerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.partners.push(partner)
    return partner
  }

  async getPartnerById(id: string): Promise<Partner | null> {
    return this.partners.find((partner) => partner.id === id) || null
  }

  async getPartnerByPhone(phone: string): Promise<Partner | null> {
    return this.partners.find((partner) => partner.phone === phone) || null
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
    const userTxn = this.transactions
      .filter((txn) => txn.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return limit ? userTxn.slice(0, limit) : userTxn
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactions.find((txn) => txn.id === id) || null
  }

  async getUnpaidTransactions(userId: string): Promise<Transaction[]> {
    return this.transactions
      .filter((txn) => txn.userId === userId && txn.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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

  async getRouteByQrCode(qrCode: string): Promise<Route | null> {
    // For now, we'll use a simple mapping - in a real app, QR codes would be stored in the route
    return this.routes.find((route) => route.id === qrCode) || null
  }

  async getOperator(operatorId: string): Promise<Operator | null> {
    return this.operators.find((operator) => operator.id === operatorId) || null
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
      .filter((req) => req.recipientId === userId)
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


}

// Create and export the storage instance
export const storage = new MemoryStorage()
