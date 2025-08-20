import bcrypt from "bcryptjs"

// Define all interfaces
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
  // Profile additions
  dateOfBirth?: Date
  joinedDate: Date
  paypassUsername: string
}

export interface PaymentRequest {
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
  senderName?: string
  senderPhone?: string
  // Prevent duplicates
  isProcessed: boolean
  processedAt?: Date
}

export interface Transaction {
  id: string
  userId: string
  type: "payment" | "topup" | "transfer" | "bus_ticket" | "grocery" | "utility" | "electricity" | "water" | "internet"
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

export interface MonthlyExpense {
  id: string
  userId: string
  amount: number
  type: string
  description: string
  month: number
  year: number
  createdAt: Date
}

// In-memory storage
let isSeeded = false
const users: User[] = []
const paymentRequests: PaymentRequest[] = []
const transactions: Transaction[] = []
const notifications: NotificationRecord[] = []
const monthlyExpenses: MonthlyExpense[] = []
const processedTransactions = new Set<string>() // Track processed transaction IDs

// Mock data with enhanced user profiles
const mockUsers = [
  {
    id: "user_1",
    fullName: "John Doe",
    phone: "+263771234567",
    email: "john@example.com",
    biometricEnabled: false,
    walletBalance: 150.0,
    dateOfBirth: new Date("1990-05-15"),
    joinedDate: new Date("2024-01-15"),
    paypassUsername: "johndoe90",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "user_2",
    fullName: "Sarah Johnson",
    phone: "+263771234568",
    email: "sarah@example.com",
    biometricEnabled: true,
    walletBalance: 75.5,
    dateOfBirth: new Date("1988-08-22"),
    joinedDate: new Date("2024-01-10"),
    paypassUsername: "sarahj88",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "user_3",
    fullName: "Mike Wilson",
    phone: "+263771234569",
    email: "mike@example.com",
    biometricEnabled: false,
    walletBalance: 120.25,
    dateOfBirth: new Date("1992-03-10"),
    joinedDate: new Date("2024-01-12"),
    paypassUsername: "mikew92",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "user_4",
    fullName: "Emma Davis",
    phone: "+263771234570",
    email: "emma@example.com",
    biometricEnabled: true,
    walletBalance: 200.0,
    dateOfBirth: new Date("1995-11-30"),
    joinedDate: new Date("2024-01-08"),
    paypassUsername: "emmad95",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
  {
    id: "user_5",
    fullName: "Michael Brown",
    phone: "+263771234571",
    email: "michael@example.com",
    biometricEnabled: false,
    walletBalance: 89.75,
    dateOfBirth: new Date("1987-07-18"),
    joinedDate: new Date("2024-01-14"),
    paypassUsername: "michaelb87",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
]

const mockPaymentRequests = [
  {
    id: "req_1",
    senderId: "user_2",
    recipientId: "user_1",
    amount: 25.0,
    description: "Lunch at downtown cafe",
    billType: "food",
    status: "pending" as const,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isProcessed: false,
  },
  {
    id: "req_2",
    senderId: "user_4",
    recipientId: "user_1",
    amount: 15.0,
    description: "Coffee shop bill",
    billType: "food",
    status: "pending" as const,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
    isProcessed: false,
  },
]

// Generate transaction hash for idempotency
function generateTransactionHash(userId: string, type: string, amount: number, description: string): string {
  return `${userId}_${type}_${amount}_${description}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, "")
}

const mockTransactions = [
  {
    id: "trans_1",
    userId: "user_1",
    type: "grocery" as const,
    amount: 45.75,
    description: "Weekly groceries at SuperMart",
    status: "pending" as const,
    isPaid: false,
    category: "Groceries",
    merchantName: "SuperMart",
    receiptNumber: "SM-2024-001",
    transactionHash: generateTransactionHash("user_1", "grocery", 45.75, "Weekly groceries at SuperMart"),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "trans_2",
    userId: "user_1",
    type: "electricity" as const,
    amount: 125.0,
    description: "Electricity bill - January 2024",
    status: "pending" as const,
    isPaid: false,
    category: "Utilities",
    merchantName: "ZESA Holdings",
    receiptNumber: "ZESA-2024-001",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    transactionHash: generateTransactionHash("user_1", "electricity", 125.0, "Electricity bill - January 2024"),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "trans_3",
    userId: "user_1",
    type: "bus_ticket" as const,
    amount: 3.75,
    description: "Bus Ticket - Route 1A to City Center",
    status: "pending" as const,
    isPaid: false,
    category: "Transport",
    merchantName: "City Transport",
    receiptNumber: "BUS-2024-001",
    transactionHash: generateTransactionHash("user_1", "bus_ticket", 3.75, "Bus Ticket - Route 1A to City Center"),
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
]

const mockNotifications = [
  {
    id: "notif_1",
    userId: "user_1",
    type: "payment_request",
    title: "Payment Request",
    message: "Sarah Johnson requested $25.00 for lunch",
    data: { requestId: "req_1", amount: 25.0 },
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "notif_2",
    userId: "user_1",
    type: "payment_request",
    title: "Payment Request",
    message: "Emma Davis requested $15.00 for coffee",
    data: { requestId: "req_2", amount: 15.0 },
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
]

// Storage functions
export async function ensureSeeded(): Promise<void> {
  if (isSeeded) {
    console.log("Storage already seeded")
    return
  }

  try {
    console.log("Seeding storage with mock data...")
    const hashedPin = await bcrypt.hash("1234", 10)

    // Clear arrays
    users.length = 0
    paymentRequests.length = 0
    transactions.length = 0
    notifications.length = 0
    monthlyExpenses.length = 0
    processedTransactions.clear()

    // Seed users
    for (const mockUser of mockUsers) {
      users.push({ ...mockUser, pin: hashedPin })
    }

    // Seed payment requests
    for (const mockRequest of mockPaymentRequests) {
      paymentRequests.push(mockRequest)
    }

    // Seed transactions
    for (const mockTransaction of mockTransactions) {
      transactions.push(mockTransaction)
    }

    // Seed notifications
    for (const mockNotification of mockNotifications) {
      notifications.push(mockNotification)
    }

    // Seed initial monthly expenses
    const now = new Date()
    monthlyExpenses.push({
      id: `exp_${Date.now()}_1`,
      userId: "user_1",
      amount: 250.0,
      type: "initial",
      description: "Initial monthly expenses",
      month: now.getMonth(),
      year: now.getFullYear(),
      createdAt: new Date(now.getFullYear(), now.getMonth(), 1),
    })

    isSeeded = true
    console.log("Storage seeded successfully with", users.length, "users")
  } catch (error) {
    console.error("Error seeding storage:", error)
    throw error
  }
}

// User functions
export async function getUserByPhone(phone: string): Promise<User | null> {
  const user = users.find((user) => user.phone === phone)
  console.log(`Looking for user with phone ${phone}, found:`, user ? user.fullName : "none")
  return user || null
}

export async function getUserById(id: string): Promise<User | null> {
  return users.find((user) => user.id === id) || null
}

export async function updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean> {
  const userIndex = users.findIndex((user) => user.id === userId)
  if (userIndex === -1) return false

  // Prevent negative balance
  if (newBalance < 0) {
    console.error(`Attempted to set negative balance for user ${userId}: ${newBalance}`)
    return false
  }

  users[userIndex].walletBalance = newBalance
  users[userIndex].updatedAt = new Date()
  console.log(`Updated balance for ${users[userIndex].fullName}: $${newBalance.toFixed(2)}`)
  return true
}

export async function searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
  const searchTerm = query.toLowerCase()
  return users
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

// Payment Request functions with idempotency
export async function createPaymentRequest(
  requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt" | "isProcessed">,
): Promise<PaymentRequest> {
  const request: PaymentRequest = {
    id: `req_${Date.now()}`,
    ...requestData,
    isProcessed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  paymentRequests.push(request)
  return request
}

export async function getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
  return paymentRequests.find((req) => req.id === id) || null
}

export async function getPaymentRequestsByRecipient(recipientId: string): Promise<PaymentRequest[]> {
  return paymentRequests
    .filter((req) => req.recipientId === recipientId && req.status === "pending" && !req.isProcessed)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updatePaymentRequestStatus(
  id: string,
  status: "accepted" | "declined" | "expired",
  respondedAt?: Date,
): Promise<PaymentRequest | null> {
  const requestIndex = paymentRequests.findIndex((req) => req.id === id)
  if (requestIndex === -1) return null

  // Check if already processed to prevent double processing
  if (paymentRequests[requestIndex].isProcessed) {
    console.log(`Payment request ${id} already processed, skipping`)
    return paymentRequests[requestIndex]
  }

  paymentRequests[requestIndex] = {
    ...paymentRequests[requestIndex],
    status,
    respondedAt: respondedAt || new Date(),
    updatedAt: new Date(),
    isProcessed: true,
    processedAt: new Date(),
  }

  // Add to processed transactions set
  processedTransactions.add(id)

  console.log(`Payment request ${id} marked as processed with status: ${status}`)
  return paymentRequests[requestIndex]
}

// Transaction functions
export async function getUnpaidTransactions(userId: string): Promise<Transaction[]> {
  return transactions.filter((txn) => txn.userId === userId && !txn.isPaid && txn.status === "pending")
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  return transactions.find((txn) => txn.id === id) || null
}

export async function updateTransactionStatus(id: string, isPaid: boolean): Promise<boolean> {
  const transactionIndex = transactions.findIndex((txn) => txn.id === id)
  if (transactionIndex === -1) return false

  transactions[transactionIndex].isPaid = isPaid
  transactions[transactionIndex].status = isPaid ? "completed" : "pending"
  transactions[transactionIndex].updatedAt = new Date()
  return true
}

// Create a new transaction
export async function createTransaction(
  transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "transactionHash">,
): Promise<Transaction> {
  const transactionHash = generateTransactionHash(
    transactionData.userId,
    transactionData.type,
    transactionData.amount,
    transactionData.description,
  )

  const transaction: Transaction = {
    id: `txn_${Date.now()}`,
    ...transactionData,
    transactionHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  transactions.push(transaction)

  // Also record as monthly expense if it's a payment
  if (transactionData.type !== "topup" && transactionData.amount > 0) {
    await recordMonthlyExpense(
      transactionData.userId,
      transactionData.amount,
      transactionData.type,
      transactionData.description,
    )
  }

  return transaction
}

// Check if transaction already processed
export function isTransactionProcessed(transactionId: string): boolean {
  return processedTransactions.has(transactionId)
}

// Monthly expense functions
export async function recordMonthlyExpense(
  userId: string,
  amount: number,
  type: string,
  description: string,
): Promise<MonthlyExpense> {
  const now = new Date()
  const expense: MonthlyExpense = {
    id: `exp_${Date.now()}`,
    userId,
    amount,
    type,
    description,
    month: now.getMonth(),
    year: now.getFullYear(),
    createdAt: now,
  }

  monthlyExpenses.push(expense)
  console.log(`Recorded monthly expense for user ${userId}: $${amount.toFixed(2)} - ${description}`)
  return expense
}

export async function getMonthlyExpenses(userId: string, month: number, year: number): Promise<MonthlyExpense[]> {
  return monthlyExpenses.filter((exp) => exp.userId === userId && exp.month === month && exp.year === year)
}

export async function getTotalMonthlyExpenses(userId: string, month: number, year: number): Promise<number> {
  const expenses = await getMonthlyExpenses(userId, month, year)
  return expenses.reduce((total, exp) => total + exp.amount, 0)
}

// Get all transactions for a user
export async function getUserTransactions(userId: string, limit?: number): Promise<Transaction[]> {
  const userTransactions = transactions
    .filter((txn) => txn.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return limit ? userTransactions.slice(0, limit) : userTransactions
}

// Notification functions
export async function getNotificationsForUser(userId: string, limit?: number): Promise<NotificationRecord[]> {
  const userNotifs = notifications
    .filter((notif) => notif.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return limit ? userNotifs.slice(0, limit) : userNotifs
}

export async function createNotification(
  notificationData: Omit<NotificationRecord, "id" | "createdAt">,
): Promise<NotificationRecord> {
  const notification: NotificationRecord = {
    id: `notif_${Date.now()}`,
    ...notificationData,
    createdAt: new Date(),
  }
  notifications.push(notification)
  return notification
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const notifIndex = notifications.findIndex((notif) => notif.id === id)
  if (notifIndex === -1) return false
  notifications[notifIndex].isRead = true
  return true
}
