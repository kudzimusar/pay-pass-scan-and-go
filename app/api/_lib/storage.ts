import bcrypt from "bcryptjs"

// Define all types in this single file to avoid circular dependencies
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
  type: "payment" | "topup" | "transfer" | "bus_ticket" | "grocery" | "utility"
  amount: number
  description: string
  operatorId?: string
  status: "pending" | "completed" | "failed"
  isPaid: boolean
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
  linkedTransactionId?: string // New field for linked requests
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

// Global storage state
let isSeeded = false
const users: User[] = []
const operators: Operator[] = []
const transactions: Transaction[] = []
const paymentRequests: PaymentRequest[] = []
const notifications: NotificationRecord[] = []

// Extended mock users for better search functionality
const mockUsers = [
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
  // Additional mock contacts for search functionality
  {
    id: "user_6",
    fullName: "Alice Cooper",
    phone: "+263776789012",
    email: "alice@example.com",
    biometricEnabled: true,
    walletBalance: 150.0,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  },
  {
    id: "user_7",
    fullName: "Bob Smith",
    phone: "+263777890123",
    email: "bob@example.com",
    biometricEnabled: false,
    walletBalance: 75.25,
    createdAt: new Date("2024-01-07"),
    updatedAt: new Date("2024-01-07"),
  },
  {
    id: "user_8",
    fullName: "Carol White",
    phone: "+263778901234",
    email: "carol@example.com",
    biometricEnabled: true,
    walletBalance: 95.5,
    createdAt: new Date("2024-01-09"),
    updatedAt: new Date("2024-01-09"),
  },
  {
    id: "user_9",
    fullName: "Daniel Green",
    phone: "+263779012345",
    email: "daniel@example.com",
    biometricEnabled: false,
    walletBalance: 180.75,
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-11"),
  },
  {
    id: "user_10",
    fullName: "Eva Martinez",
    phone: "+263770123456",
    email: "eva@example.com",
    biometricEnabled: true,
    walletBalance: 220.0,
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
  },
]

// Mock unpaid transactions for linked requests
const mockTransactions = [
  {
    id: "txn_bus_001",
    userId: "user_1",
    type: "bus_ticket" as const,
    amount: 5.0,
    description: "ZUPCO Bus - CBD to Avondale",
    status: "pending" as const,
    isPaid: false,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z"),
  },
  {
    id: "txn_grocery_001",
    userId: "user_2",
    type: "grocery" as const,
    amount: 45.75,
    description: "OK Zimbabwe - Weekly Shopping",
    status: "pending" as const,
    isPaid: false,
    createdAt: new Date("2024-01-15T14:30:00Z"),
    updatedAt: new Date("2024-01-15T14:30:00Z"),
  },
  {
    id: "txn_utility_001",
    userId: "user_3",
    type: "utility" as const,
    amount: 85.0,
    description: "ZESA Electricity Bill - January",
    status: "pending" as const,
    isPaid: false,
    createdAt: new Date("2024-01-15T16:00:00Z"),
    updatedAt: new Date("2024-01-15T16:00:00Z"),
  },
]

const mockPaymentRequests = [
  {
    id: "req_1",
    senderId: "user_2",
    receiverId: "user_1",
    amount: 15.5,
    description: "Groceries split",
    billType: "Groceries",
    status: "pending" as const,
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
    billType: "Bus Ticket",
    status: "pending" as const,
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
    billType: "Other",
    status: "pending" as const,
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-15T19:00:00Z"),
    updatedAt: new Date("2024-01-15T19:00:00Z"),
  },
]

const mockNotifications = [
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

// Storage functions
export async function ensureSeeded(): Promise<void> {
  if (isSeeded) {
    console.log("Storage already seeded, skipping...")
    return
  }

  console.log("Seeding storage with mock data...")

  try {
    // Hash PINs for all users (using '1234' as default PIN)
    const hashedPin = await bcrypt.hash("1234", 10)

    // Clear existing data
    users.length = 0
    transactions.length = 0
    paymentRequests.length = 0
    notifications.length = 0

    // Seed users with hashed PINs
    for (const mockUser of mockUsers) {
      users.push({
        ...mockUser,
        pin: hashedPin,
      })
    }

    // Seed transactions
    for (const mockTransaction of mockTransactions) {
      transactions.push(mockTransaction)
    }

    // Seed payment requests
    for (const mockRequest of mockPaymentRequests) {
      paymentRequests.push(mockRequest)
    }

    // Seed notifications
    for (const mockNotification of mockNotifications) {
      notifications.push(mockNotification)
    }

    isSeeded = true
    console.log("Storage seeded successfully with", users.length, "users,", transactions.length, "transactions")
  } catch (error) {
    console.error("Error seeding storage:", error)
    throw error
  }
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const user = users.find((user) => user.phone === phone)
  console.log(`Looking for user with phone ${phone}, found:`, user ? user.fullName : "none")
  return user || null
}

export async function getUserById(id: string): Promise<User | null> {
  return users.find((user) => user.id === id) || null
}

export async function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
  const user: User = {
    id: `user_${Date.now()}`,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  users.push(user)
  return user
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const userIndex = users.findIndex((user) => user.id === id)
  if (userIndex === -1) return null

  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date(),
  }
  return users[userIndex]
}

export async function getUserWalletBalance(userId: string): Promise<number> {
  const user = await getUserById(userId)
  return user?.walletBalance || 0
}

export async function updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean> {
  const user = await updateUser(userId, { walletBalance: newBalance })
  return !!user
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

// Transaction functions
export async function createTransaction(
  txnData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<Transaction> {
  const transaction: Transaction = {
    id: `txn_${Date.now()}`,
    ...txnData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  transactions.push(transaction)
  return transaction
}

export async function getUserTransactions(userId: string, limit?: number): Promise<Transaction[]> {
  const userTxns = transactions
    .filter((txn) => txn.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return limit ? userTxns.slice(0, limit) : userTxns
}

export async function getUnpaidTransactions(userId: string): Promise<Transaction[]> {
  return transactions.filter((txn) => txn.userId === userId && !txn.isPaid && txn.status === "pending")
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  return transactions.find((txn) => txn.id === id) || null
}

export async function updateTransactionStatus(
  id: string,
  status: "pending" | "completed" | "failed",
  isPaid?: boolean,
): Promise<Transaction | null> {
  const txnIndex = transactions.findIndex((txn) => txn.id === id)
  if (txnIndex === -1) return null

  transactions[txnIndex] = {
    ...transactions[txnIndex],
    status,
    isPaid: isPaid !== undefined ? isPaid : transactions[txnIndex].isPaid,
    updatedAt: new Date(),
  }
  return transactions[txnIndex]
}

// Payment Request functions
export async function createPaymentRequest(
  requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">,
): Promise<PaymentRequest> {
  const request: PaymentRequest = {
    id: `req_${Date.now()}`,
    ...requestData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  paymentRequests.push(request)
  return request
}

export async function getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
  return paymentRequests.find((req) => req.id === id) || null
}

export async function getUserSentPaymentRequests(userId: string): Promise<PaymentRequest[]> {
  return paymentRequests
    .filter((req) => req.senderId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getUserReceivedPaymentRequests(userId: string): Promise<PaymentRequest[]> {
  return paymentRequests
    .filter((req) => req.receiverId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updatePaymentRequestStatus(
  id: string,
  status: "accepted" | "declined" | "expired",
  respondedAt?: Date,
): Promise<PaymentRequest | null> {
  const requestIndex = paymentRequests.findIndex((req) => req.id === id)
  if (requestIndex === -1) return null

  paymentRequests[requestIndex] = {
    ...paymentRequests[requestIndex],
    status,
    respondedAt,
    updatedAt: new Date(),
  }
  return paymentRequests[requestIndex]
}

// Notification functions
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

export async function getUserNotifications(userId: string, limit?: number): Promise<NotificationRecord[]> {
  const userNotifs = notifications
    .filter((notif) => notif.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return limit ? userNotifs.slice(0, limit) : userNotifs
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const notifIndex = notifications.findIndex((notif) => notif.id === id)
  if (notifIndex === -1) return false
  notifications[notifIndex].isRead = true
  return true
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return notifications.filter((notif) => notif.userId === userId && !notif.isRead).length
}

// Legacy compatibility functions
export async function getOperatorByPhone(phone: string): Promise<Operator | null> {
  return operators.find((op) => op.phone === phone) || null
}

export async function getAdminByPhone(phone: string): Promise<any> {
  return null
}

export async function getMerchantByPhone(phone: string): Promise<any> {
  return null
}

export async function getPartnerByPhone(phone: string): Promise<any> {
  return null
}
