import * as storage from "./storage"

export interface FinancialOperation {
  userId: string
  amount: number
  type: "debit" | "credit"
  category: "transfer" | "bill_payment" | "top_up" | "payment_request" | "qr_payment"
  description: string
  recipientId?: string
  metadata?: Record<string, any>
}

export interface TransactionRecord {
  id: string
  userId: string
  amount: number
  type: "debit" | "credit"
  category: string
  description: string
  recipientId?: string
  metadata?: Record<string, any>
  balanceAfter: number
  createdAt: string
}

export class FinancialCore {
  /**
   * Process a financial operation with full integrity checks
   */
  static async processOperation(operation: FinancialOperation): Promise<{
    success: boolean
    newBalance: number
    transactionId: string
    error?: string
  }> {
    try {
      console.log("=== FINANCIAL CORE: Processing operation ===", operation)

      // Get current user
      const user = await storage.getUserById(operation.userId)
      if (!user) {
        return { success: false, newBalance: 0, transactionId: "", error: "User not found" }
      }

      const currentBalance = user.walletBalance

      // Calculate new balance
      const balanceChange = operation.type === "debit" ? -operation.amount : operation.amount
      const newBalance = currentBalance + balanceChange

      // Validate sufficient funds for debits
      if (operation.type === "debit" && newBalance < 0) {
        return {
          success: false,
          newBalance: currentBalance,
          transactionId: "",
          error: `Insufficient funds. You have $${currentBalance.toFixed(2)} available.`,
        }
      }

      // Update user balance
      const balanceUpdateSuccess = await storage.updateUserWalletBalance(operation.userId, newBalance)
      if (!balanceUpdateSuccess) {
        return { success: false, newBalance: currentBalance, transactionId: "", error: "Failed to update balance" }
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: operation.userId,
        type: operation.category,
        amount: operation.amount,
        description: operation.description,
        operatorId: operation.recipientId,
        status: "completed",
        isPaid: true,
        category: operation.category,
        merchantName: operation.metadata?.merchantName,
        receiptNumber: this.generateReceiptNumber(),
        metadata: operation.metadata,
      })

      console.log("Transaction created:", transaction.id)

      // Handle recipient for transfers
      if (operation.category === "transfer" && operation.recipientId) {
        const recipient = await storage.getUserById(operation.recipientId)
        if (recipient) {
          const recipientNewBalance = recipient.walletBalance + operation.amount
          await storage.updateUserWalletBalance(operation.recipientId, recipientNewBalance)

          // Create recipient transaction record
          await storage.createTransaction({
            userId: operation.recipientId,
            type: "transfer_received",
            amount: operation.amount,
            description: `Received from ${user.fullName}: ${operation.description}`,
            status: "completed",
            isPaid: true,
            category: "transfer_received",
            metadata: { senderId: operation.userId, originalTransactionId: transaction.id },
          })

          console.log(`Recipient balance updated: ${recipient.walletBalance} → ${recipientNewBalance}`)
        }
      }

      // Create notifications
      await this.createTransactionNotifications(operation.userId, operation, transaction.id)

      console.log("=== FINANCIAL CORE: Operation completed successfully ===")

      return {
        success: true,
        newBalance,
        transactionId: transaction.id,
      }
    } catch (error) {
      console.error("=== FINANCIAL CORE ERROR ===", error)
      return {
        success: false,
        newBalance: 0,
        transactionId: "",
        error: "Transaction processing failed",
      }
    }
  }

  /**
   * Get user's current balance
   */
  static async getUserBalance(userId: string): Promise<number> {
    try {
      const user = await storage.getUserById(userId)
      return user?.walletBalance || 0
    } catch (error) {
      console.error("Error getting user balance:", error)
      return 0
    }
  }

  /**
   * Get user's transaction history
   */
  static async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    try {
      return await storage.getUserTransactions(userId, limit)
    } catch (error) {
      console.error("Error getting user transactions:", error)
      return []
    }
  }

  /**
   * Calculate monthly expenses for a user
   */
  static async getMonthlyExpenses(userId: string): Promise<number> {
    try {
      const transactions = await storage.getUserTransactions(userId)

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const monthlyTransactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.createdAt)
        return (
          txnDate.getMonth() === currentMonth &&
          txnDate.getFullYear() === currentYear &&
          ["payment", "bill_payment", "request_payment"].includes(txn.type)
        )
      })

      return monthlyTransactions.reduce((total, txn) => total + txn.amount, 0)
    } catch (error) {
      console.error("Error calculating monthly expenses:", error)
      return 0
    }
  }

  /**
   * Validate transaction integrity
   */
  static async validateUserBalance(userId: string): Promise<{
    isValid: boolean
    calculatedBalance: number
    storedBalance: number
  }> {
    try {
      const user = await storage.getUserById(userId)
      if (!user) {
        return { isValid: false, calculatedBalance: 0, storedBalance: 0 }
      }

      const storedBalance = user.walletBalance
      const transactions = await storage.getUserTransactions(userId)

      // Calculate balance from transactions
      let calculatedBalance = 0
      for (const txn of transactions) {
        const isIncoming = ["topup", "transfer_received"].includes(txn.type)
        const balanceChange = isIncoming ? txn.amount : -txn.amount
        calculatedBalance += balanceChange
      }

      return {
        isValid: Math.abs(storedBalance - calculatedBalance) < 0.01,
        calculatedBalance,
        storedBalance,
      }
    } catch (error) {
      console.error("Error validating user balance:", error)
      return { isValid: false, calculatedBalance: 0, storedBalance: 0 }
    }
  }

  private static generateReceiptNumber(): string {
    const timestamp = Date.now()
    return `PP-${timestamp}`
  }

  private static async createTransactionNotifications(
    userId: string,
    operation: FinancialOperation,
    transactionId: string,
  ): Promise<void> {
    try {
      const user = await storage.getUserById(userId)
      if (!user) return

      let title = "Transaction Completed"
      let message = ""

      switch (operation.category) {
        case "transfer":
          title = operation.type === "debit" ? "Money Sent" : "Money Received"
          message =
            operation.type === "debit"
              ? `You sent $${operation.amount.toFixed(2)} successfully`
              : `You received $${operation.amount.toFixed(2)}`
          break
        case "bill_payment":
          title = "Bill Payment"
          message = `Payment of $${operation.amount.toFixed(2)} completed`
          break
        case "top_up":
          title = "Wallet Top Up"
          message = `Your wallet has been topped up with $${operation.amount.toFixed(2)}`
          break
        case "payment_request":
          title = "Payment Request Fulfilled"
          message = `You paid $${operation.amount.toFixed(2)} for a payment request`
          break
        case "qr_payment":
          title = "QR Payment"
          message = `Payment of $${operation.amount.toFixed(2)} completed`
          break
        default:
          message = `Transaction of $${operation.amount.toFixed(2)} completed`
      }

      await storage.createNotification({
        userId,
        type: `${operation.category}_completed`,
        title,
        message,
        data: {
          transactionId,
          amount: operation.amount,
          category: operation.category,
        },
        isRead: false,
      })

      // Notification for recipient (if applicable)
      if (operation.recipientId && operation.category === "transfer") {
        await storage.createNotification({
          userId: operation.recipientId,
          type: "money_received",
          title: "Money Received",
          message: `You received $${operation.amount.toFixed(2)} from ${user.fullName}`,
          data: {
            transactionId,
            amount: operation.amount,
            senderId: userId,
          },
          isRead: false,
        })
      }
    } catch (error) {
      console.error("Error creating transaction notifications:", error)
    }
  }
}

/**
 * Convenience functions for common operations
 */
export const processPayment = (userId: string, amount: number, description: string, metadata?: any) =>
  FinancialCore.processOperation({
    userId,
    amount,
    type: "debit",
    category: "qr_payment",
    description,
    metadata,
  })

export const processBillPayment = (userId: string, amount: number, description: string, metadata?: any) =>
  FinancialCore.processOperation({
    userId,
    amount,
    type: "debit",
    category: "bill_payment",
    description,
    metadata,
  })

export const processTopUp = (userId: string, amount: number, description: string) =>
  FinancialCore.processOperation({
    userId,
    amount,
    type: "credit",
    category: "top_up",
    description,
  })

export const processTransfer = (userId: string, recipientId: string, amount: number, description: string) =>
  FinancialCore.processOperation({
    userId,
    amount,
    type: "debit",
    category: "transfer",
    description,
    recipientId,
  })

export const processRequestPayment = (userId: string, amount: number, description: string, requestId: string) =>
  FinancialCore.processOperation({
    userId,
    amount,
    type: "debit",
    category: "payment_request",
    description,
    metadata: { requestId },
  })
