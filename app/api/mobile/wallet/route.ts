import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Mobile Wallet API - Optimized for mobile wallet operations
// Handles balance queries, transaction history, quick actions, and wallet management

const walletTransferSchema = z.object({
  recipientId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  memo: z.string().optional(),
  category: z.string().optional(),
  scheduleDate: z.string().optional(),
  recurring: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    endDate: z.string().optional()
  }).optional()
}).refine(data => data.recipientId || data.recipientEmail || data.recipientPhone, {
  message: "Must provide at least one recipient identifier"
});

const topUpSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethod: z.enum(['card', 'bank', 'mobile_money', 'crypto']),
  paymentMethodId: z.string(),
  saveMethod: z.boolean().optional()
});

const billPaymentSchema = z.object({
  billerType: z.enum(['utility', 'telecom', 'internet', 'insurance', 'loan', 'subscription']),
  billerId: z.string(),
  accountNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  dueDate: z.string().optional(),
  saveBiller: z.boolean().optional()
});

const qrPaymentSchema = z.object({
  qrData: z.string(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  tip: z.number().min(0).optional(),
  memo: z.string().optional()
});

// Mock data stores
const mockWallets = new Map();
const mockTransactions = new Map();
const mockBillers = new Map();
const mockContacts = new Map();

// Initialize mock data
const initializeMockData = () => {
  if (mockWallets.size === 0) {
    // Sample wallets
    mockWallets.set('wallet_1', {
      id: 'wallet_1',
      userId: 'user_1',
      balance: 1250.75,
      currency: 'USD',
      availableBalance: 1250.75,
      pendingBalance: 0,
      frozenBalance: 0,
      limits: {
        dailySend: 5000,
        dailySendUsed: 250,
        monthlyTopUp: 25000,
        monthlyTopUpUsed: 1250
      },
      cards: [
        {
          id: 'card_1',
          last4: '4242',
          brand: 'visa',
          primary: true,
          expires: '12/25'
        }
      ],
      bankAccounts: [
        {
          id: 'bank_1',
          name: 'Checking Account',
          last4: '1234',
          bank: 'Chase Bank',
          verified: true
        }
      ]
    });

    // Sample transactions
    const transactions = [
      {
        id: 'txn_1',
        walletId: 'wallet_1',
        type: 'send',
        amount: -50.00,
        currency: 'USD',
        status: 'completed',
        description: 'Payment to John Doe',
        recipient: { name: 'John Doe', avatar: null },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'friends',
        method: 'instant'
      },
      {
        id: 'txn_2',
        walletId: 'wallet_1',
        type: 'receive',
        amount: 125.50,
        currency: 'USD',
        status: 'completed',
        description: 'Payment from Sarah Wilson',
        sender: { name: 'Sarah Wilson', avatar: null },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        category: 'business',
        method: 'standard'
      },
      {
        id: 'txn_3',
        walletId: 'wallet_1',
        type: 'topup',
        amount: 200.00,
        currency: 'USD',
        status: 'completed',
        description: 'Top up from Visa ending in 4242',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'topup',
        method: 'card'
      },
      {
        id: 'txn_4',
        walletId: 'wallet_1',
        type: 'bill_payment',
        amount: -89.99,
        currency: 'USD',
        status: 'completed',
        description: 'Electric Bill - ConEd',
        biller: { name: 'ConEd Electric', logo: null },
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        category: 'utilities',
        method: 'scheduled'
      }
    ];

    transactions.forEach(txn => mockTransactions.set(txn.id, txn));

    // Sample saved billers
    mockBillers.set('biller_1', {
      id: 'biller_1',
      name: 'ConEd Electric',
      type: 'utility',
      accountNumber: '****5678',
      logo: null,
      averageAmount: 89.99,
      lastPayment: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      autopay: false
    });

    // Sample contacts
    mockContacts.set('contact_1', {
      id: 'contact_1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      avatar: null,
      lastTransaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      transactionCount: 5,
      totalSent: 250.00,
      totalReceived: 100.00,
      favorite: true
    });
  }
};

// Helper function to authenticate mobile requests
const authenticateRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mobile-secret') as any;
  
  if (decoded.platform !== 'mobile') {
    throw new Error('Invalid token platform');
  }

  return decoded;
};

// GET /api/mobile/wallet - Get wallet information and quick actions
export async function GET(request: NextRequest) {
  try {
    initializeMockData();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const decoded = authenticateRequest(request);
    const wallet = Array.from(mockWallets.values()).find((w: any) => w.userId === decoded.userId);
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'balance':
        return getWalletBalance(wallet);
      case 'transactions':
        return getTransactionHistory(wallet.id, searchParams);
      case 'contacts':
        return getRecentContacts(decoded.userId);
      case 'billers':
        return getSavedBillers(decoded.userId);
      case 'quick_actions':
        return getQuickActions(wallet);
      default:
        return getWalletOverview(wallet, decoded.userId);
    }

  } catch (error) {
    console.error('Mobile wallet error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/wallet - Execute wallet operations
export async function POST(request: NextRequest) {
  try {
    initializeMockData();
    
    const body = await request.json();
    const { action } = body;
    
    const decoded = authenticateRequest(request);
    const wallet = Array.from(mockWallets.values()).find((w: any) => w.userId === decoded.userId);
    
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'transfer':
        return handleTransfer(wallet, body, decoded.userId);
      case 'topup':
        return handleTopUp(wallet, body);
      case 'bill_payment':
        return handleBillPayment(wallet, body);
      case 'qr_payment':
        return handleQRPayment(wallet, body);
      case 'request_money':
        return handleMoneyRequest(wallet, body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Mobile wallet operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Operation failed' },
      { status: 500 }
    );
  }
}

const getWalletBalance = (wallet: any) => {
  return NextResponse.json({
    success: true,
    data: {
      balance: wallet.balance,
      currency: wallet.currency,
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      frozenBalance: wallet.frozenBalance,
      formattedBalance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: wallet.currency
      }).format(wallet.balance)
    }
  });
};

const getTransactionHistory = (walletId: string, searchParams: URLSearchParams) => {
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  
  let transactions = Array.from(mockTransactions.values())
    .filter((txn: any) => txn.walletId === walletId)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (type) {
    transactions = transactions.filter((txn: any) => txn.type === type);
  }
  
  if (category) {
    transactions = transactions.filter((txn: any) => txn.category === category);
  }

  const paginatedTransactions = transactions.slice(offset, offset + limit);
  
  return NextResponse.json({
    success: true,
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total: transactions.length,
        limit,
        offset,
        hasMore: offset + limit < transactions.length
      }
    }
  });
};

const getRecentContacts = (userId: string) => {
  const contacts = Array.from(mockContacts.values())
    .sort((a: any, b: any) => new Date(b.lastTransaction).getTime() - new Date(a.lastTransaction).getTime())
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    data: { contacts }
  });
};

const getSavedBillers = (userId: string) => {
  const billers = Array.from(mockBillers.values());
  
  return NextResponse.json({
    success: true,
    data: { billers }
  });
};

const getQuickActions = (wallet: any) => {
  const actions = [
    {
      id: 'send',
      title: 'Send Money',
      icon: 'send',
      description: 'Send to contacts or new recipients',
      available: wallet.balance > 0,
      dailyLimit: wallet.limits.dailySend,
      dailyUsed: wallet.limits.dailySendUsed
    },
    {
      id: 'request',
      title: 'Request Money',
      icon: 'request',
      description: 'Request payment from others',
      available: true
    },
    {
      id: 'topup',
      title: 'Add Money',
      icon: 'topup',
      description: 'Top up your wallet',
      available: true,
      monthlyLimit: wallet.limits.monthlyTopUp,
      monthlyUsed: wallet.limits.monthlyTopUpUsed
    },
    {
      id: 'bills',
      title: 'Pay Bills',
      icon: 'bills',
      description: 'Pay your bills instantly',
      available: wallet.balance > 0
    },
    {
      id: 'qr',
      title: 'QR Pay',
      icon: 'qr',
      description: 'Scan QR code to pay',
      available: wallet.balance > 0
    },
    {
      id: 'exchange',
      title: 'Exchange',
      icon: 'exchange',
      description: 'Convert between currencies',
      available: wallet.balance > 0
    }
  ];

  return NextResponse.json({
    success: true,
    data: { actions }
  });
};

const getWalletOverview = (wallet: any, userId: string) => {
  // Get recent transactions
  const recentTransactions = Array.from(mockTransactions.values())
    .filter((txn: any) => txn.walletId === wallet.id)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Get spending analytics
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyTransactions = Array.from(mockTransactions.values())
    .filter((txn: any) => 
      txn.walletId === wallet.id && 
      new Date(txn.timestamp) > last30Days &&
      txn.amount < 0 // Only outgoing
    );

  const monthlySpent = monthlyTransactions.reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0);
  const topCategories = monthlyTransactions.reduce((acc: any, txn: any) => {
    acc[txn.category] = (acc[txn.category] || 0) + Math.abs(txn.amount);
    return acc;
  }, {});

  return NextResponse.json({
    success: true,
    data: {
      wallet: {
        ...wallet,
        formattedBalance: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: wallet.currency
        }).format(wallet.balance)
      },
      recentTransactions,
      analytics: {
        monthlySpent,
        topCategories: Object.entries(topCategories)
          .sort(([,a]: any, [,b]: any) => b - a)
          .slice(0, 3)
          .map(([category, amount]) => ({ category, amount }))
      },
      quickActions: [
        { id: 'send', title: 'Send', available: wallet.balance > 0 },
        { id: 'request', title: 'Request', available: true },
        { id: 'topup', title: 'Add Money', available: true },
        { id: 'bills', title: 'Bills', available: wallet.balance > 0 }
      ]
    }
  });
};

const handleTransfer = async (wallet: any, body: any, userId: string) => {
  const validation = walletTransferSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid transfer data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { amount, currency, memo, recipientEmail, recipientPhone, recipientId } = validation.data;

  // Check sufficient balance
  if (wallet.balance < amount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  // Check daily limit
  if (wallet.limits.dailySendUsed + amount > wallet.limits.dailySend) {
    return NextResponse.json(
      { success: false, error: 'Daily sending limit exceeded' },
      { status: 400 }
    );
  }

  // Find or create recipient
  let recipient = null;
  if (recipientEmail) {
    recipient = { email: recipientEmail, name: 'Unknown User' };
  } else if (recipientPhone) {
    recipient = { phone: recipientPhone, name: 'Unknown User' };
  } else if (recipientId) {
    recipient = mockContacts.get(recipientId) || { id: recipientId, name: 'Unknown User' };
  }

  // Create transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const transaction = {
    id: transactionId,
    walletId: wallet.id,
    type: 'send',
    amount: -amount,
    currency,
    status: 'completed',
    description: memo || `Payment to ${recipient?.name || 'Unknown'}`,
    recipient,
    timestamp: new Date().toISOString(),
    category: 'transfer',
    method: 'instant',
    fee: amount > 100 ? 0 : 0.50 // Free for amounts over $100
  };

  mockTransactions.set(transactionId, transaction);

  // Update wallet balance
  wallet.balance -= (amount + (transaction.fee || 0));
  wallet.limits.dailySendUsed += amount;
  mockWallets.set(wallet.id, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      newBalance: wallet.balance,
      formattedBalance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: wallet.currency
      }).format(wallet.balance)
    }
  });
};

const handleTopUp = async (wallet: any, body: any) => {
  const validation = topUpSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid top-up data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { amount, currency, paymentMethod, paymentMethodId } = validation.data;

  // Check monthly limit
  if (wallet.limits.monthlyTopUpUsed + amount > wallet.limits.monthlyTopUp) {
    return NextResponse.json(
      { success: false, error: 'Monthly top-up limit exceeded' },
      { status: 400 }
    );
  }

  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const transaction = {
    id: transactionId,
    walletId: wallet.id,
    type: 'topup',
    amount,
    currency,
    status: 'completed',
    description: `Top up from ${paymentMethod} ending in ${paymentMethodId.slice(-4)}`,
    timestamp: new Date().toISOString(),
    category: 'topup',
    method: paymentMethod,
    fee: 0
  };

  mockTransactions.set(transactionId, transaction);

  // Update wallet balance
  wallet.balance += amount;
  wallet.limits.monthlyTopUpUsed += amount;
  mockWallets.set(wallet.id, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      newBalance: wallet.balance,
      formattedBalance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: wallet.currency
      }).format(wallet.balance)
    }
  });
};

const handleBillPayment = async (wallet: any, body: any) => {
  const validation = billPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid bill payment data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { amount, billerType, billerId, accountNumber } = validation.data;

  // Check sufficient balance
  if (wallet.balance < amount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  // Create transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const transaction = {
    id: transactionId,
    walletId: wallet.id,
    type: 'bill_payment',
    amount: -amount,
    currency: wallet.currency,
    status: 'completed',
    description: `${billerType} bill payment`,
    biller: { id: billerId, type: billerType, accountNumber },
    timestamp: new Date().toISOString(),
    category: billerType,
    method: 'instant',
    fee: 0
  };

  mockTransactions.set(transactionId, transaction);

  // Update wallet balance
  wallet.balance -= amount;
  mockWallets.set(wallet.id, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      newBalance: wallet.balance,
      confirmationNumber: `BILL${Date.now()}`,
      formattedBalance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: wallet.currency
      }).format(wallet.balance)
    }
  });
};

const handleQRPayment = async (wallet: any, body: any) => {
  const validation = qrPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid QR payment data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { qrData, amount, tip = 0, memo } = validation.data;

  // Parse QR data (simplified)
  let paymentData;
  try {
    paymentData = JSON.parse(qrData);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid QR code format' },
      { status: 400 }
    );
  }

  const totalAmount = (amount || paymentData.amount) + tip;

  // Check sufficient balance
  if (wallet.balance < totalAmount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  // Create transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const transaction = {
    id: transactionId,
    walletId: wallet.id,
    type: 'qr_payment',
    amount: -totalAmount,
    currency: wallet.currency,
    status: 'completed',
    description: memo || paymentData.description || 'QR Payment',
    merchant: paymentData.merchant,
    tip,
    timestamp: new Date().toISOString(),
    category: 'merchant',
    method: 'qr',
    fee: 0
  };

  mockTransactions.set(transactionId, transaction);

  // Update wallet balance
  wallet.balance -= totalAmount;
  mockWallets.set(wallet.id, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      newBalance: wallet.balance,
      receipt: {
        merchant: paymentData.merchant,
        amount: amount || paymentData.amount,
        tip,
        total: totalAmount,
        timestamp: transaction.timestamp
      },
      formattedBalance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: wallet.currency
      }).format(wallet.balance)
    }
  });
};

const handleMoneyRequest = async (wallet: any, body: any) => {
  const { recipientEmail, recipientPhone, amount, currency, memo } = body;

  // Create request record
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const request = {
    id: requestId,
    requesterId: wallet.userId,
    recipientEmail,
    recipientPhone,
    amount,
    currency,
    memo,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };

  return NextResponse.json({
    success: true,
    data: {
      request,
      message: 'Money request sent successfully',
      shareUrl: `https://app.paypass.com/request/${requestId}`
    }
  });
};
