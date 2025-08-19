import bcrypt from "bcryptjs"
import type {
  IStorage,
  PaymentRequest,
  InsertPaymentRequest,
  Notification,
  InsertNotification,
  User,
  Operator,
  Wallet,
  Route,
  Transaction,
} from "./index"

export class MemoryStorage implements IStorage {
  private users: User[] = []
  private operators: Operator[] = []
  private wallets: Wallet[] = []
  private routes: Route[] = []
  private transactions: Transaction[] = []
  private paymentRequests: PaymentRequest[] = []
  private notifications: Notification[] = []
  private seeded = false

  private async seed() {
    if (this.seeded) return
    this.seeded = true

    const pinHash = await bcrypt.hash("1234", 10)

    // Create mock users
    const users: User[] = [
      {
        id: "user_1",
        fullName: "John Doe",
        phone: "+263771234567",
        email: "john.doe@example.com",
        pin: pinHash,
        biometricEnabled: false,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "user_2",
        fullName: "Sarah Wilson",
        phone: "+263772345678",
        email: "sarah.wilson@example.com",
        pin: pinHash,
        biometricEnabled: true,
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      },
      {
        id: "user_3",
        fullName: "Mike Johnson",
        phone: "+263773456789",
        email: "mike.johnson@example.com",
        pin: pinHash,
        biometricEnabled: false,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
      {
        id: "user_4",
        fullName: "Emma Davis",
        phone: "+263774567890",
        email: "emma.davis@example.com",
        pin: pinHash,
        biometricEnabled: true,
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-10"),
      },
      {
        id: "user_5",
        fullName: "David Brown",
        phone: "+263775678901",
        email: "david.brown@example.com",
        pin: pinHash,
        biometricEnabled: false,
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-15"),
      },
    ]

    this.users = users

    // Create wallets for all users
    const wallets: Wallet[] = users.map((user, index) => ({
      id: `wallet_${user.id}`,
      userId: user.id,
      usdBalance: (50 + index * 25).toFixed(2), // $50, $75, $100, $125, $150
      zwlBalance: ((50 + index * 25) * 35).toFixed(2), // Convert to ZWL
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    this.wallets = wallets

    // Create mock payment requests
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    this.paymentRequests = [
      // Pending request from Sarah to John (John will see this as received)
      {
        id: "req_1",
        senderId: "user_2", // Sarah
        recipientId: "user_1", // John
        amount: "15.50",
        currency: "USD",
        billType: "Groceries",
        description: "Shared grocery shopping at OK Mart",
        status: "pending",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000), // 22 hours from now
      },
      // Pending request from Mike to John (John will see this as received)
      {
        id: "req_2",
        senderId: "user_3", // Mike
        recipientId: "user_1", // John
        amount: "8.00",
        currency: "USD",
        billType: "Bus Ticket",
        description: "Bus fare for trip to Borrowdale",
        status: "pending",
        createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 23.5 * 60 * 60 * 1000), // 23.5 hours from now
      },
      // Request John sent to Emma (John will see this as sent)
      {
        id: "req_3",
        senderId: "user_1", // John
        recipientId: "user_4", // Emma
        amount: "25.00",
        currency: "USD",
        billType: "Utility Bill",
        description: "Split electricity bill for December",
        status: "pending",
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 20 * 60 * 60 * 1000), // 20 hours from now
      },
      // Accepted request from yesterday
      {
        id: "req_4",
        senderId: "user_5", // David
        recipientId: "user_1", // John
        amount: "12.75",
        currency: "USD",
        billType: "Shared Ride",
        description: "Taxi fare from airport",
        status: "accepted",
        transactionId: "txn_accepted_1",
        createdAt: yesterday,
        updatedAt: yesterday,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      // Declined request from two days ago
      {
        id: "req_5",
        senderId: "user_2", // Sarah
        recipientId: "user_1", // John
        amount: "30.00",
        currency: "USD",
        billType: "Other",
        description: "Concert tickets",
        status: "declined",
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
        expiresAt: yesterday,
      },
    ]

    // Create mock notifications
    this.notifications = [
      {
        id: "notif_1",
        userId: "user_1", // John
        type: "payment_request_received",
        title: "Payment Request Received",
        message: "Sarah Wilson requested $15.50 for Groceries",
        data: { requestId: "req_1", amount: "15.50", senderName: "Sarah Wilson" },
        read: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        id: "notif_2",
        userId: "user_1", // John
        type: "payment_request_received",
        title: "Payment Request Received",
        message: "Mike Johnson requested $8.00 for Bus Ticket",
        data: { requestId: "req_2", amount: "8.00", senderName: "Mike Johnson" },
        read: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        id: "notif_3",
        userId: "user_4", // Emma
        type: "payment_request_received",
        title: "Payment Request Received",
        message: "John Doe requested $25.00 for Utility Bill",
        data: { requestId: "req_3", amount: "25.00", senderName: "John Doe" },
        read: false,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ]

    // Create some mock transactions
    this.transactions = [
      {
        id: "txn_accepted_1",
        userId: "user_1",
        type: "receive",
        category: "transfer",
        amount: "12.75",
        currency: "USD",
        description: "Received payment for Shared Ride",
        status: "completed",
        paymentMethod: "wallet",
        reference: "REQ-req_4",
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        id: "txn_topup_1",
        userId: "user_1",
        type: "topup",
        category: "transfer",
        amount: "50.00",
        currency: "USD",
        description: "Wallet Top-up via EcoCash",
        status: "completed",
        paymentMethod: "ecocash",
        reference: "TOPUP-001",
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ]
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    await this.seed()
    return this.users.find((user) => user.id === id)
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    await this.seed()
    return this.users.find((user) => user.phone === phone)
  }

  async createUser(insertUser: any): Promise<User> {
    await this.seed()
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(user)

    // Create wallet for new user
    await this.createWallet({ userId: user.id })

    return user
  }

  // Operator operations
  async getOperator(id: string): Promise<Operator | undefined> {
    await this.seed()
    return this.operators.find((operator) => operator.id === id)
  }

  async getOperatorByPhone(phone: string): Promise<Operator | undefined> {
    await this.seed()
    return this.operators.find((operator) => operator.phone === phone)
  }

  async createOperator(insertOperator: any): Promise<Operator> {
    await this.seed()
    const operator: Operator = {
      id: `operator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...insertOperator,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.operators.push(operator)
    return operator
  }

  // Wallet operations
  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    await this.seed()
    return this.wallets.find((wallet) => wallet.userId === userId)
  }

  async createWallet(insertWallet: any): Promise<Wallet> {
    await this.seed()
    const wallet: Wallet = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: insertWallet.userId,
      usdBalance: "0.00",
      zwlBalance: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.wallets.push(wallet)
    return wallet
  }

  async updateWalletBalance(userId: string, currency: "USD" | "ZWL", amount: string): Promise<Wallet> {
    await this.seed()
    const wallet = await this.getWalletByUserId(userId)
    if (!wallet) {
      throw new Error("Wallet not found")
    }

    if (currency === "USD") {
      wallet.usdBalance = (Number.parseFloat(wallet.usdBalance) + Number.parseFloat(amount)).toFixed(2)
    } else {
      wallet.zwlBalance = (Number.parseFloat(wallet.zwlBalance) + Number.parseFloat(amount)).toFixed(2)
    }
    wallet.updatedAt = new Date()

    return wallet
  }

  // Route operations
  async getRoute(id: string): Promise<Route | undefined> {
    await this.seed()
    return this.routes.find((route) => route.id === id)
  }

  async getRouteByQrCode(qrCode: string): Promise<Route | undefined> {
    await this.seed()
    return this.routes.find((route) => route.qrCode === qrCode)
  }

  async getRoutesByOperatorId(operatorId: string): Promise<Route[]> {
    await this.seed()
    return this.routes.filter((route) => route.operatorId === operatorId)
  }

  async createRoute(insertRoute: any): Promise<Route> {
    await this.seed()
    const route: Route = {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...insertRoute,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.routes.push(route)
    return route
  }

  // Transaction operations
  async createTransaction(insertTransaction: any): Promise<Transaction> {
    await this.seed()
    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...insertTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.transactions.push(transaction)
    return transaction
  }

  async getTransactionsByUserId(userId: string, limit = 50): Promise<Transaction[]> {
    await this.seed()
    return this.transactions
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  async getTransactionsByOperatorId(operatorId: string, limit = 50): Promise<Transaction[]> {
    await this.seed()
    return this.transactions
      .filter((transaction) => transaction.operatorId === operatorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  async getTransactionsByRouteId(routeId: string): Promise<Transaction[]> {
    await this.seed()
    return this.transactions
      .filter((transaction) => transaction.routeId === routeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Request-to-Pay methods
  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    await this.seed()
    const paymentRequest: PaymentRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...request,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }
    this.paymentRequests.push(paymentRequest)
    return paymentRequest
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    await this.seed()
    return this.paymentRequests.find((request) => request.id === id)
  }

  async getPaymentRequestsBySender(senderId: string): Promise<PaymentRequest[]> {
    await this.seed()
    return this.paymentRequests
      .filter((request) => request.senderId === senderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getPaymentRequestsByRecipient(recipientId: string): Promise<PaymentRequest[]> {
    await this.seed()
    return this.paymentRequests
      .filter((request) => request.recipientId === recipientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest> {
    await this.seed()
    const request = await this.getPaymentRequest(id)
    if (!request) {
      throw new Error("Payment request not found")
    }
    request.status = status as any
    request.updatedAt = new Date()
    return request
  }

  async updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest> {
    await this.seed()
    const request = await this.getPaymentRequest(id)
    if (!request) {
      throw new Error("Payment request not found")
    }
    Object.assign(request, updates)
    request.updatedAt = new Date()
    return request
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    await this.seed()
    const lowerQuery = query.toLowerCase()
    return this.users
      .filter((user) => {
        if (excludeUserId && user.id === excludeUserId) return false
        return (
          user.fullName.toLowerCase().includes(lowerQuery) ||
          user.phone.includes(query) ||
          user.email.toLowerCase().includes(lowerQuery)
        )
      })
      .slice(0, 10)
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    await this.seed()
    const newNotification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      read: false,
      createdAt: new Date(),
    }
    this.notifications.push(newNotification)
    return newNotification
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    await this.seed()
    return this.notifications
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50)
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await this.seed()
    const notification = this.notifications.find((notif) => notif.id === notificationId && notif.userId === userId)
    if (notification) {
      notification.read = true
    }
  }
}
