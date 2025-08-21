interface User {
  id: string
  fullName: string
  phoneNumber: string
  email?: string
  password: string
  walletBalance: number
  createdAt: string
  updatedAt: string
}

interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  description: string
  status: string
  createdAt: string
  updatedAt: string
  category?: string
  metadata?: any
  isPaid?: boolean
  senderId?: string
  receiverId?: string
}

interface PaymentRequest {
  id: string
  senderId: string
  recipientId: string
  amount: number
  description: string
  status: string
  createdAt: string
  updatedAt: string
  respondedAt?: string
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

interface MonthlyExpense {
  id: string
  userId: string
  amount: number
  category: string
  description: string
  month: number
  year: number
  createdAt: string
}

// In-memory storage
const users: User[] = []
const transactions: Transaction[] = []
const paymentRequests: PaymentRequest[] = []
const notifications: Notification[] = []
const monthlyExpenses: MonthlyExpense[] = []
let isSeeded = false

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function ensureSeeded(): Promise<void> {
  if (isSeeded) return

  console.log("Seeding memory storage...")

  // Create demo users
  const demoUsers = [
    {
      id: generateId(),
      fullName: "John Doe",
      phoneNumber: "+1234567890",
      email: "john@example.com",
      password: "1234",
      walletBalance: 150.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      fullName: "Jane Smith",
      phoneNumber: "+1234567891",
      email: "jane@example.com",
      password: "1234",
      walletBalance: 200.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  users.push(...demoUsers)

  // Create demo transactions
  const demoTransactions = [
    {
      id: generateId(),
      userId: demoUsers[0].id,
      type: "payment",
      amount: 25.0,
      description: "Coffee Shop Payment",
      status: "completed",
      category: "food",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      isPaid: true,
    },
    {
      id: generateId(),
      userId: demoUsers[0].id,
      type: "topup",
      amount: 100.0,
      description: "Wallet Top-up",
      status: "completed",
      category: "topup",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      isPaid: true,
    },
  ]

  transactions.push(...demoTransactions)

  isSeeded = true
  console.log("Memory storage seeded successfully")
}

async function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
  const user: User = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  users.push(user)
  return user
}

async function getUserById(id: string): Promise<User | null> {
  return users.find((user) => user.id === id) || null
}

async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  return users.find((user) => user.phoneNumber === phoneNumber) || null
}

async function updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean> {
  const userIndex = users.findIndex((user) => user.id === userId)
  if (userIndex === -1) return false

  users[userIndex].walletBalance = newBalance
  users[userIndex].updatedAt = new Date().toISOString()
  return true
}

async function createTransaction(
  transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<Transaction> {
  const transaction: Transaction = {
    ...transactionData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  transactions.push(transaction)
  return transaction
}

async function getUserTransactions(userId: string): Promise<Transaction[]> {
  return transactions.filter(
    (transaction) =>
      transaction.userId === userId || transaction.senderId === userId || transaction.receiverId === userId,
  )
}

async function getTransactionById(id: string): Promise<Transaction | null> {
  return transactions.find((transaction) => transaction.id === id) || null
}

async function createPaymentRequest(
  requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">,
): Promise<PaymentRequest> {
  const request: PaymentRequest = {
    ...requestData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  paymentRequests.push(request)
  return request
}

async function getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
  return paymentRequests.find((request) => request.id === id) || null
}

async function updatePaymentRequestStatus(
  id: string,
  status: string,
  respondedAt?: Date,
): Promise<PaymentRequest | null> {
  const requestIndex = paymentRequests.findIndex((request) => request.id === id)
  if (requestIndex === -1) return null

  paymentRequests[requestIndex].status = status
  paymentRequests[requestIndex].updatedAt = new Date().toISOString()
  if (respondedAt) {
    paymentRequests[requestIndex].respondedAt = respondedAt.toISOString()
  }

  return paymentRequests[requestIndex]
}

async function getPendingPaymentRequests(userId: string): Promise<PaymentRequest[]> {
  return paymentRequests.filter((request) => request.recipientId === userId && request.status === "pending")
}

async function createNotification(notificationData: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
  const notification: Notification = {
    ...notificationData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  notifications.push(notification)
  return notification
}

async function getUserNotifications(userId: string): Promise<Notification[]> {
  return notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

async function markNotificationAsRead(id: string): Promise<boolean> {
  const notificationIndex = notifications.findIndex((notification) => notification.id === id)
  if (notificationIndex === -1) return false

  notifications[notificationIndex].isRead = true
  return true
}

async function recordMonthlyExpense(
  userId: string,
  amount: number,
  category: string,
  description: string,
): Promise<MonthlyExpense> {
  const now = new Date()
  const expense: MonthlyExpense = {
    id: generateId(),
    userId,
    amount,
    category,
    description,
    month: now.getMonth(),
    year: now.getFullYear(),
    createdAt: now.toISOString(),
  }

  monthlyExpenses.push(expense)
  return expense
}

async function getMonthlyExpenses(userId: string, month?: number, year?: number): Promise<MonthlyExpense[]> {
  const now = new Date()
  const targetMonth = month ?? now.getMonth()
  const targetYear = year ?? now.getFullYear()

  return monthlyExpenses.filter(
    (expense) => expense.userId === userId && expense.month === targetMonth && expense.year === targetYear,
  )
}

export const storage = {
  ensureSeeded,
  createUser,
  getUserById,
  getUserByPhone,
  updateUserWalletBalance,
  createTransaction,
  getUserTransactions,
  getTransactionById,
  createPaymentRequest,
  getPaymentRequestById,
  updatePaymentRequestStatus,
  getPendingPaymentRequests,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  recordMonthlyExpense,
  getMonthlyExpenses,
}
