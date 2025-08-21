import { storage as neonStorage } from "./storage/storage-neon"
import { storage as memoryStorage } from "./storage/storage-memory"

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

// Use Neon storage if DATABASE_URL is available, otherwise use memory storage
const useNeonStorage = !!process.env.DATABASE_URL

export const storage = useNeonStorage ? neonStorage : memoryStorage

// Re-export all storage functions for convenience
export const {
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
} = storage
