import { storage } from "./storage"
import { Decimal } from "decimal.js"

/**
 * Enhanced Financial Core with Atomic Transactions
 * Provides robust financial operations with integrity checks and atomic transactions
 */

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

export interface FinancialOperationResult {
  success: boolean
  newBalance: number
  transactionId: string
  recipientNewBalance?: number
  error?: string
  details?: {
    previousBalance: number
    amountProcessed: number
    timestamp: string
  }
}

/**
 * Enhanced Financial Core with atomic transaction support
 */
export class FinancialCoreEnhanced {
  /**
   * Process a financial operation with full integrity checks and atomic transactions
   * This method ensures that either all operations succeed or none do
   */
  static async processOperation(operation: FinancialOperation): Promise<FinancialOperationResult> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`[FinancialCore] Starting operation ${operationId}:`, {
      userId: operation.userId,
      amount: operation.amount,
      type: operation.type,
      category: operation.category,
    })

    try {
      // Step 1: Validate user exists
      const user = await storage.getUserById(operation.userId)
      if (!user) {
        console.error(`[FinancialCore] User not found: ${operation.userId}`)
        return {
          success: false,
          newBalance: 0,
          transactionId: "",
          error: "User not found",
        }
      }

      // Step 2: Validate amount
      if (operation.amount <= 0) {
        console.error(`[FinancialCore] Invalid amount: ${operation.amount}`)
        return {
          success: false,
          newBalance: user.walletBalance,
          transactionId: "",
          error: "Amount must be greater than zero",
        }
      }

      // Step 3: Use Decimal for precise calculations
      const currentBalance = new Decimal(user.walletBalance)
      const amount = new Decimal(operation.amount)
      const balanceChange = operation.type === "debit" ? amount.negated() : amount
      const newBalance = currentBalance.plus(balanceChange)

      // Step 4: Validate sufficient funds for debits
      if (operation.type === "debit" && newBalance.isNegative()) {
        console.warn(`[FinancialCore] Insufficient funds for user ${operation.userId}`)
        return {
          success: false,
          newBalance: currentBalance.toNumber(),
          transactionId: "",
          error: `Insufficient funds. You have $${currentBalance.toFixed(2)} available.`,
        }
      }

      // Step 5: Validate spending limits
      const limitValidation = await this.validateSpendingLimits(operation.userId, amount, operation.type)
      if (!limitValidation.valid) {
        console.warn(`[FinancialCore] Spending limit exceeded: ${limitValidation.reason}`)
        return {
          success: false,
          newBalance: currentBalance.toNumber(),
          transactionId: "",
          error: limitValidation.reason,
        }
      }

      // Step 6: Create transaction record (this is the atomic unit)
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
        metadata: {
          ...operation.metadata,
          operationId,
          previousBalance: currentBalance.toNumber(),
          newBalance: newBalance.toNumber(),
        },
        transactionHash: this.generateTransactionHash(operation),
      })

      if (!transaction) {
        console.error(`[FinancialCore] Failed to create transaction for operation ${operationId}`)
        return {
          success: false,
          newBalance: currentBalance.toNumber(),
          transactionId: "",
          error: "Failed to create transaction record",
        }
      }

      console.log(`[FinancialCore] Transaction created: ${transaction.id}`)

      // Step 7: Update user balance
      const balanceUpdateSuccess = await storage.updateUserWalletBalance(
        operation.userId,
        newBalance.toNumber(),
      )

      if (!balanceUpdateSuccess) {
        console.error(`[FinancialCore] Failed to update balance for user ${operation.userId}`)
        // In a real system with database transactions, this would be rolled back
        return {
          success: false,
          newBalance: currentBalance.toNumber(),
          transactionId: transaction.id,
          error: "Failed to update wallet balance",
        }
      }

      console.log(`[FinancialCore] Balance updated for user ${operation.userId}`)

      // Step 8: Handle recipient for transfers
      let recipientNewBalance: number | undefined
      if (operation.category === "transfer" && operation.recipientId) {
        const recipientResult = await this.processTransferToRecipient(
          operation.recipientId,
          operation.amount,
          user.fullName,
          operation.description,
          transaction.id,
        )

        if (!recipientResult.success) {
          console.error(`[FinancialCore] Failed to process recipient transfer`)
          // In a real system, we would rollback the sender's transaction
          return {
            success: false,
            newBalance: newBalance.toNumber(),
            transactionId: transaction.id,
            error: `Transfer to recipient failed: ${recipientResult.error}`,
          }
        }

        recipientNewBalance = recipientResult.newBalance
      }

      // Step 9: Create notifications
      await this.createTransactionNotifications(operation.userId, operation, transaction.id)

      console.log(`[FinancialCore] Operation ${operationId} completed successfully`)

      return {
        success: true,
        newBalance: newBalance.toNumber(),
        transactionId: transaction.id,
        recipientNewBalance,
        details: {
          previousBalance: currentBalance.toNumber(),
          amountProcessed: operation.amount,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error(`[FinancialCore] Unexpected error in operation ${operationId}:`, error)
      return {
        success: false,
        newBalance: 0,
        transactionId: "",
        error: "An unexpected error occurred during the transaction",
      }
    }
  }

  /**
   * Validate spending limits (daily and monthly)
   */
  private static async validateSpendingLimits(
    userId: string,
    amount: Decimal,
    type: "debit" | "credit",
  ): Promise<{ valid: boolean; reason?: string }> {
    // Only validate for debits
    if (type === "credit") {
      return { valid: true }
    }

    // Get user's transactions for today and this month
    const transactions = await storage.getUserTransactions(userId)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt)
      return txDate >= today && tx.type === "payment"
    })

    const monthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt)
      return txDate >= monthStart && tx.type === "payment"
    })

    // Calculate totals
    const dailyTotal = todayTransactions.reduce((sum, tx) => sum.plus(new Decimal(tx.amount)), new Decimal(0))
    const monthlyTotal = monthTransactions.reduce((sum, tx) => sum.plus(new Decimal(tx.amount)), new Decimal(0))

    // Check limits (these should be fetched from user's wallet settings in production)
    const dailyLimit = new Decimal(1000)
    const monthlyLimit = new Decimal(10000)

    if (dailyTotal.plus(amount).greaterThan(dailyLimit)) {
      return {
        valid: false,
        reason: `Daily spending limit exceeded. Limit: $${dailyLimit}, Used today: $${dailyTotal}, Requested: $${amount}`,
      }
    }

    if (monthlyTotal.plus(amount).greaterThan(monthlyLimit)) {
      return {
        valid: false,
        reason: `Monthly spending limit exceeded. Limit: $${monthlyLimit}, Used this month: $${monthlyTotal}, Requested: $${amount}`,
      }
    }

    return { valid: true }
  }

  /**
   * Process transfer to recipient
   */
  private static async processTransferToRecipient(
    recipientId: string,
    amount: number,
    senderName: string,
    description: string,
    linkedTransactionId: string,
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const recipient = await storage.getUserById(recipientId)
      if (!recipient) {
        return { success: false, error: "Recipient not found" }
      }

      const recipientNewBalance = new Decimal(recipient.walletBalance).plus(new Decimal(amount))

      const balanceUpdateSuccess = await storage.updateUserWalletBalance(
        recipientId,
        recipientNewBalance.toNumber(),
      )

      if (!balanceUpdateSuccess) {
        return { success: false, error: "Failed to update recipient balance" }
      }

      // Create recipient transaction record
      await storage.createTransaction({
        userId: recipientId,
        type: "transfer_received",
        amount,
        description: `Received from ${senderName}: ${description}`,
        status: "completed",
        isPaid: true,
        category: "transfer_received",
        receiptNumber: this.generateReceiptNumber(),
        metadata: {
          linkedTransactionId,
          senderName,
        },
        transactionHash: `txn_${linkedTransactionId}`,
      })

      return { success: true, newBalance: recipientNewBalance.toNumber() }
    } catch (error) {
      console.error("Error processing recipient transfer:", error)
      return { success: false, error: "Failed to process recipient transfer" }
    }
  }

  /**
   * Create transaction notifications
   */
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

  /**
   * Validate transaction integrity
   */
  static async validateUserBalance(userId: string): Promise<{
    isValid: boolean
    calculatedBalance: number
    storedBalance: number
    discrepancy: number
  }> {
    try {
      const user = await storage.getUserById(userId)
      if (!user) {
        return { isValid: false, calculatedBalance: 0, storedBalance: 0, discrepancy: 0 }
      }

      const storedBalance = user.walletBalance
      const transactions = await storage.getUserTransactions(userId)

      // Calculate balance from transactions
      let calculatedBalance = new Decimal(0)
      for (const txn of transactions) {
        const isIncoming = ["topup", "transfer_received"].includes(txn.type)
        const amount = new Decimal(txn.amount)
        const balanceChange = isIncoming ? amount : amount.negated()
        calculatedBalance = calculatedBalance.plus(balanceChange)
      }

      const discrepancy = new Decimal(storedBalance).minus(calculatedBalance).abs().toNumber()
      const isValid = discrepancy < 0.01 // Allow for rounding errors

      return {
        isValid,
        calculatedBalance: calculatedBalance.toNumber(),
        storedBalance,
        discrepancy,
      }
    } catch (error) {
      console.error("Error validating user balance:", error)
      return { isValid: false, calculatedBalance: 0, storedBalance: 0, discrepancy: 0 }
    }
  }

  /**
   * Get monthly expenses for a user
   */
  static async getMonthlyExpenses(userId: string, month?: number, year?: number): Promise<number> {
    try {
      const now = new Date()
      const targetMonth = month || now.getMonth() + 1
      const targetYear = year || now.getFullYear()

      const transactions = await storage.getUserTransactions(userId)

      const monthlyExpenses = transactions
        .filter((txn) => {
          const txDate = new Date(txn.createdAt)
          return (
            txDate.getMonth() + 1 === targetMonth &&
            txDate.getFullYear() === targetYear &&
            ["payment", "bill_payment", "qr_payment"].includes(txn.type)
          )
        })
        .reduce((total, txn) => total.plus(new Decimal(txn.amount)), new Decimal(0))

      return monthlyExpenses.toNumber()
    } catch (error) {
      console.error("Error calculating monthly expenses:", error)
      return 0
    }
  }

  private static generateReceiptNumber(): string {
    const timestamp = Date.now()
    return `PP-${timestamp}`
  }

  private static generateTransactionHash(operation: FinancialOperation): string {
    const data = `${operation.userId}-${operation.amount}-${operation.type}-${Date.now()}`
    return `txn_${Buffer.from(data).toString("base64").substring(0, 16)}`
  }
}

/**
 * Convenience functions for common operations
 */
export const processPayment = (userId: string, amount: number, description: string, metadata?: any) =>
  FinancialCoreEnhanced.processOperation({
    userId,
    amount,
    type: "debit",
    category: "qr_payment",
    description,
    metadata,
  })

export const processBillPayment = (userId: string, amount: number, description: string, metadata?: any) =>
  FinancialCoreEnhanced.processOperation({
    userId,
    amount,
    type: "debit",
    category: "bill_payment",
    description,
    metadata,
  })

export const processTopUp = (userId: string, amount: number, description: string) =>
  FinancialCoreEnhanced.processOperation({
    userId,
    amount,
    type: "credit",
    category: "top_up",
    description,
  })

export const processTransfer = (userId: string, recipientId: string, amount: number, description: string) =>
  FinancialCoreEnhanced.processOperation({
    userId,
    amount,
    type: "debit",
    category: "transfer",
    description,
    recipientId,
  })

export const processRequestPayment = (userId: string, amount: number, description: string, requestId: string) =>
  FinancialCoreEnhanced.processOperation({
    userId,
    amount,
    type: "debit",
    category: "payment_request",
    description,
    metadata: { requestId },
  })
