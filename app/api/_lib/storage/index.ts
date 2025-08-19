import { MemoryStorage } from "./storage-memory"

// Request-to-Pay types
export interface PaymentRequest {
  id: string
  senderId: string
  recipientId: string
  amount: string
  currency: string
  billType: string
  description: string
  status: "pending" | "accepted" | "declined" | "expired"
  transactionId?: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export interface InsertPaymentRequest {
  senderId: string
  recipientId: string
  amount: string
  currency: string
  billType: string
  description: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}

export interface InsertNotification {
  userId: string
  type: string
  title: string
  message: string
  data?: any
}

// User type for storage
export interface User {
  id: string
  fullName: string
  phone: string
  email: string
  pin: string
  biometricEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Operator {
  id: string
  companyName: string
  phone: string
  email: string
  pin: string
  createdAt: Date
  updatedAt: Date
}

export interface Wallet {
  id: string
  userId: string
  usdBalance: string
  zwlBalance: string
  createdAt: Date
  updatedAt: Date
}

export interface Route {
  id: string
  operatorId: string
  name: string
  qrCode: string
  fare: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  operatorId?: string
  routeId?: string
  type: string
  category: string
  amount: string
  currency: string
  description: string
  status: string
  paymentMethod: string
  reference: string
  createdAt: Date
  updatedAt: Date
}

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>
  getUserByPhone(phone: string): Promise<User | undefined>
  createUser(user: any): Promise<User>

  // Operator operations
  getOperator(id: string): Promise<Operator | undefined>
  getOperatorByPhone(phone: string): Promise<Operator | undefined>
  createOperator(operator: any): Promise<Operator>

  // Wallet operations
  getWalletByUserId(userId: string): Promise<Wallet | undefined>
  createWallet(wallet: any): Promise<Wallet>
  updateWalletBalance(userId: string, currency: "USD" | "ZWL", amount: string): Promise<Wallet>

  // Route operations
  getRoute(id: string): Promise<Route | undefined>
  getRouteByQrCode(qrCode: string): Promise<Route | undefined>
  getRoutesByOperatorId(operatorId: string): Promise<Route[]>
  createRoute(route: any): Promise<Route>

  // Transaction operations
  createTransaction(transaction: any): Promise<Transaction>
  getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>
  getTransactionsByOperatorId(operatorId: string, limit?: number): Promise<Transaction[]>
  getTransactionsByRouteId(routeId: string): Promise<Transaction[]>

  // Request-to-Pay operations
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>
  getPaymentRequestsBySender(senderId: string): Promise<PaymentRequest[]>
  getPaymentRequestsByRecipient(recipientId: string): Promise<PaymentRequest[]>
  updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest>
  updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest>
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>
  getNotificationsByUserId(userId: string): Promise<Notification[]>
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>
}

// Create storage instance
export const storage: IStorage = new MemoryStorage()
