import { storage as memoryStorage } from "./storage/storage-memory"

// Only import NeonStorage if DATABASE_URL is available
let NeonStorage: any = null
if (process.env.DATABASE_URL) {
  try {
    const { storage: neonStorage } = require("./storage/storage-neon")
    NeonStorage = neonStorage
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

export const storage = useNeonStorage ? NeonStorage : memoryStorage

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




// Export functions that maintain 'this' context
export const ensureSeeded = () => storage.ensureSeeded()
export const createUser = (userData: any) => storage.createUser(userData)
export const getUserById = (id: string) => storage.getUserById(id)
export const getUserByPhone = (phone: string) => storage.getUserByPhone(phone)
export const updateUserWalletBalance = (userId: string, newBalance: number) => storage.updateUserWalletBalance(userId, newBalance)
export const createTransaction = (transaction: any) => storage.createTransaction(transaction)
export const getUserTransactions = (userId: string, limit?: number) => storage.getUserTransactions(userId, limit)
export const getTransactionById = (id: string) => storage.getTransactionById(id)
export const createPaymentRequest = (request: any) => storage.createPaymentRequest(request)
export const getPaymentRequestById = (id: string) => storage.getPaymentRequestById(id)
export const updatePaymentRequestStatus = (id: string, status: string, linkedTransactionId?: string) => storage.updatePaymentRequestStatus(id, status, linkedTransactionId)
export const getPendingPaymentRequests = (userId: string) => storage.getPendingPaymentRequests(userId)
export const createNotification = (notification: any) => storage.createNotification(notification)
export const getUserNotifications = (userId: string, limit?: number) => storage.getUserNotifications(userId, limit)
export const markNotificationAsRead = (id: string) => storage.markNotificationAsRead(id)
export const recordMonthlyExpense = (expense: any) => storage.recordMonthlyExpense(expense)
export const getMonthlyExpenses = (userId: string, month: number, year: number) => storage.getMonthlyExpenses(userId, month, year)
