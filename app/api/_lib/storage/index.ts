// Base types for storage
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
  // Initialization
  ensureSeeded(): Promise<void>

  // User methods
  createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>
  getUserById(id: string): Promise<User | null>
  getUserByPhone(phone: string): Promise<User | null>
  updateUser(id: string, updates: Partial<User>): Promise<User | null>
  getUserWalletBalance(userId: string): Promise<number>
  updateUserWalletBalance(userId: string, newBalance: number): Promise<boolean>
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>

  // Operator methods
  createOperator(operatorData: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator>
  getOperatorById(id: string): Promise<Operator | null>
  getOperatorByPhone(phone: string): Promise<Operator | null>

  // Transaction methods
  createTransaction(txnData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction>
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>
  getOperatorTransactions(operatorId: string, limit?: number): Promise<Transaction[]>

  // Route methods
  createRoute(routeData: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route>
  getOperatorRoutes(operatorId: string): Promise<Route[]>
  getRouteById(id: string): Promise<Route | null>
  getRouteByQrCode(qrCode: string): Promise<Route | null>
  getOperator(operatorId: string): Promise<Operator | null>

  // Payment Request methods
  createPaymentRequest(requestData: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">): Promise<PaymentRequest>
  getPaymentRequestById(id: string): Promise<PaymentRequest | null>
  getUserSentPaymentRequests(userId: string): Promise<PaymentRequest[]>
  getUserReceivedPaymentRequests(userId: string): Promise<PaymentRequest[]>
  updatePaymentRequestStatus(
    id: string,
    status: "accepted" | "declined" | "expired",
    respondedAt?: Date,
  ): Promise<PaymentRequest | null>

  // Notification methods
  createNotification(notificationData: Omit<NotificationRecord, "id" | "createdAt">): Promise<NotificationRecord>
  getUserNotifications(userId: string, limit?: number): Promise<NotificationRecord[]>
  markNotificationAsRead(id: string): Promise<boolean>
  getUnreadNotificationCount(userId: string): Promise<number>

  // Legacy methods for compatibility
  getAdminByPhone(phone: string): Promise<any>
  getMerchantByPhone(phone: string): Promise<any>
  getPartnerByPhone(phone: string): Promise<any>
}

// Import implementations
import { MemoryStorage } from "./storage-memory"

// Create and export a single storage instance
export const storage = new MemoryStorage()
