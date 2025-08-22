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

// Export the storage instance and functions
export const storage = memoryStorage

// Export convenience functions
export async function ensureSeeded() {
  return storage.ensureSeeded()
}

export async function getUserByPhone(phone: string) {
  return storage.getUserByPhone(phone)
}

export async function getUserById(id: string) {
  return storage.getUserById(id)
}

export async function createUser(userData: any) {
  return storage.createUser(userData)
}

export async function updateUserWalletBalance(userId: string, newBalance: number) {
  return storage.updateUserWalletBalance(userId, newBalance)
}

export async function getUserTransactions(userId: string, limit?: number) {
  return storage.getUserTransactions(userId, limit)
}

export async function createTransaction(txnData: any) {
  return storage.createTransaction(txnData)
}

export async function getUserNotifications(userId: string, limit?: number) {
  return storage.getUserNotifications(userId, limit)
}

export async function createNotification(notificationData: any) {
  return storage.createNotification(notificationData)
}

export async function getUserReceivedPaymentRequests(userId: string) {
  return storage.getUserReceivedPaymentRequests(userId)
}

export async function getPaymentRequestById(id: string) {
  return storage.getPaymentRequestById(id)
}

export async function updatePaymentRequestStatus(id: string, status: string, respondedAt?: Date) {
  return storage.updatePaymentRequestStatus(id, status as any, respondedAt)
}

export async function searchUsers(query: string, excludeUserId?: string) {
  return storage.searchUsers(query, excludeUserId)
}
