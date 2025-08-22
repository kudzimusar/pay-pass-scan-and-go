import { storage } from "./storage/storage-memory"

// Re-export everything from memory storage
export * from "./storage/storage-memory"

// Helper functions for backward compatibility
export async function ensureSeeded() {
  return storage.ensureSeeded()
}

export async function getUserById(id: string) {
  return storage.getUserById(id)
}

export async function getUserByPhone(phone: string) {
  return storage.getUserByPhone(phone)
}

export async function createUser(userData: any) {
  return storage.createUser(userData)
}

export async function updateUser(id: string, updates: any) {
  return storage.updateUser(id, updates)
}

export async function getUserWalletBalance(userId: string) {
  return storage.getUserWalletBalance(userId)
}

export async function updateUserWalletBalance(userId: string, newBalance: number) {
  return storage.updateUserWalletBalance(userId, newBalance)
}

export async function searchUsers(query: string, excludeUserId?: string) {
  return storage.searchUsers(query, excludeUserId)
}

export async function createTransaction(txnData: any) {
  return storage.createTransaction(txnData)
}

export async function getUserTransactions(userId: string, limit?: number) {
  return storage.getUserTransactions(userId, limit)
}

export async function getTransactionById(id: string) {
  return storage.getTransactionById(id)
}

export async function getUnpaidTransactions(userId: string) {
  return storage.getUnpaidTransactions(userId)
}

export async function createPaymentRequest(requestData: any) {
  return storage.createPaymentRequest(requestData)
}

export async function getPaymentRequestById(id: string) {
  return storage.getPaymentRequestById(id)
}

export async function getPaymentRequestsByRecipient(userId: string) {
  return storage.getUserReceivedPaymentRequests(userId)
}

export async function updatePaymentRequestStatus(id: string, status: any, respondedAt?: Date) {
  return storage.updatePaymentRequestStatus(id, status, respondedAt)
}

export async function createNotification(notificationData: any) {
  return storage.createNotification(notificationData)
}

export async function getNotificationsForUser(userId: string, limit?: number) {
  return storage.getUserNotifications(userId, limit)
}

export async function markNotificationAsRead(id: string) {
  return storage.markNotificationAsRead(id)
}

export async function getUnreadNotificationCount(userId: string) {
  return storage.getUnreadNotificationCount(userId)
}

// Export the storage instance
export { storage }
