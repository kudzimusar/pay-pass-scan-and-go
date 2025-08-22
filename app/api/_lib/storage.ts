import { storage as memoryStorage } from "./storage/storage-memory"

// Only import NeonStorage if DATABASE_URL is available
let NeonStorage: any = null
if (process.env.DATABASE_URL) {
  try {
    const { NeonStorage: NeonStorageClass } = require("./storage/storage-neon")
    NeonStorage = NeonStorageClass
  } catch (error) {
    console.warn("Neon storage not available:", error)
  }
}

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
const useNeonStorage = !!process.env.DATABASE_URL && NeonStorage

export const storage = useNeonStorage ? new NeonStorage() : memoryStorage

// Re-export everything from memory storage
export * from "./storage/storage-memory"

// Helper functions for backward compatibility
export async function updateUser(id: string, updates: any) {
  return storage.updateUser(id, updates)
}

export async function getNotificationsForUser(userId: string, limit?: number) {
  return storage.getUserNotifications(userId, limit)
}

export async function getPaymentRequestsByRecipient(userId: string) {
  return storage.getUserReceivedPaymentRequests(userId)
}

export async function getUnpaidTransactions(userId: string) {
  return storage.getUnpaidTransactions(userId)
}

export async function searchUsers(query: string, excludeUserId?: string) {
  return storage.searchUsers(query, excludeUserId)
}



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
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} = storage
