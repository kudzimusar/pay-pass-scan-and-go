import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Mobile Payments API - Optimized for mobile payment flows
// Handles payment processing, QR payments, contactless payments, and mobile-specific features

const mobilePaymentSchema = z.object({
  type: z.enum(['qr', 'nfc', 'p2p', 'merchant', 'bill', 'topup']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  recipient: z.object({
    id: z.string().optional(),
    type: z.enum(['user', 'merchant', 'biller']),
    data: z.record(z.any())
  }),
  paymentMethod: z.object({
    type: z.enum(['wallet', 'card', 'bank']),
    id: z.string()
  }),
  memo: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional()
  }).optional(),
  deviceInfo: z.object({
    platform: z.enum(['ios', 'android']),
    version: z.string(),
    deviceId: z.string(),
    biometricUsed: z.boolean().optional()
  }),
  metadata: z.record(z.any()).optional()
});

const qrDataSchema = z.object({
  qrCode: z.string(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  tip: z.number().min(0).optional()
});

const nfcPaymentSchema = z.object({
  nfcData: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  merchantId: z.string(),
  terminalId: z.string().optional()
});

const p2pPaymentSchema = z.object({
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientUsername: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  message: z.string().optional(),
  requestMoney: z.boolean().optional()
});

const paymentStatusSchema = z.object({
  transactionId: z.string()
});

// Mock data stores
const mockTransactions = new Map();
const mockWallets = new Map();
const mockMerchants = new Map();

// Initialize mock data
const initializeMockData = () => {
  if (mockWallets.size === 0) {
    mockWallets.set('user_1', {
      id: 'wallet_1',
      userId: 'user_1',
      balance: 1250.75,
      currency: 'USD',
      cards: [
        { id: 'card_1', last4: '4242', brand: 'visa', primary: true }
      ]
    });

    mockMerchants.set('merchant_1', {
      id: 'merchant_1',
      name: 'Coffee Shop Downtown',
      type: 'restaurant',
      location: { latitude: 40.7589, longitude: -73.9851 },
      acceptedPayments: ['wallet', 'card', 'nfc']
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

// Generate transaction ID
const generateTransactionId = () => `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// POST /api/mobile/payments - Process mobile payments
export async function POST(request: NextRequest) {
  try {
    initializeMockData();
    
    const body = await request.json();
    const { action } = body;
    
    const decoded = authenticateRequest(request);
    
    switch (action) {
      case 'pay':
        return processPayment(body, decoded);
      case 'qr_pay':
        return processQRPayment(body, decoded);
      case 'nfc_pay':
        return processNFCPayment(body, decoded);
      case 'p2p_pay':
        return processP2PPayment(body, decoded);
      case 'request_money':
        return processMoneyRequest(body, decoded);
      case 'verify_merchant':
        return verifyMerchant(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Mobile payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/payments - Get payment information
export async function GET(request: NextRequest) {
  try {
    initializeMockData();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const decoded = authenticateRequest(request);
    
    switch (action) {
      case 'status':
        return getPaymentStatus(searchParams.get('transactionId') || '');
      case 'history':
        return getPaymentHistory(decoded.userId, searchParams);
      case 'methods':
        return getPaymentMethods(decoded.userId);
      case 'limits':
        return getPaymentLimits(decoded.userId);
      case 'merchants':
        return getNearbyMerchants(searchParams);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Mobile payment query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}

const processPayment = async (body: any, decoded: any) => {
  const validation = mobilePaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid payment data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { type, amount, currency, recipient, paymentMethod, memo, location, deviceInfo } = validation.data;
  
  // Get user wallet
  const wallet = mockWallets.get(decoded.userId);
  if (!wallet) {
    return NextResponse.json(
      { success: false, error: 'Wallet not found' },
      { status: 404 }
    );
  }

  // Check payment method
  if (paymentMethod.type === 'wallet' && wallet.balance < amount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient wallet balance' },
      { status: 400 }
    );
  }

  // Calculate fees
  const feeRate = type === 'p2p' ? 0.01 : type === 'merchant' ? 0.025 : 0.005; // 1%, 2.5%, 0.5%
  const fee = Math.max(amount * feeRate, 0.50); // Minimum 50 cents
  const totalAmount = amount + fee;

  // Process payment
  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    userId: decoded.userId,
    type,
    amount,
    fee,
    totalAmount,
    currency,
    recipient,
    paymentMethod,
    memo,
    location,
    deviceInfo,
    status: 'processing',
    createdAt: new Date().toISOString(),
    processedAt: null,
    confirmationCode: null
  };

  mockTransactions.set(transactionId, transaction);

  // Simulate processing time
  setTimeout(() => {
    const tx = mockTransactions.get(transactionId);
    if (tx) {
      tx.status = Math.random() > 0.05 ? 'completed' : 'failed'; // 95% success rate
      tx.processedAt = new Date().toISOString();
      tx.confirmationCode = tx.status === 'completed' ? `PAY${Date.now()}` : null;
      
      if (tx.status === 'completed' && paymentMethod.type === 'wallet') {
        // Update wallet balance
        wallet.balance -= totalAmount;
        mockWallets.set(decoded.userId, wallet);
      }
      
      mockTransactions.set(transactionId, tx);
    }
  }, Math.random() * 3000 + 1000); // 1-4 second processing

  return NextResponse.json({
    success: true,
    data: {
      transactionId,
      status: 'processing',
      amount,
      fee,
      totalAmount,
      currency,
      estimatedCompletion: new Date(Date.now() + 5000).toISOString(),
      recipient: {
        name: recipient.data.name || 'Unknown',
        type: recipient.type
      }
    }
  });
};

const processQRPayment = async (body: any, decoded: any) => {
  const validation = qrDataSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid QR payment data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { qrCode, amount, currency = 'USD', tip = 0 } = validation.data;

  // Parse QR code data
  let qrData;
  try {
    qrData = JSON.parse(Buffer.from(qrCode, 'base64').toString());
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid QR code format' },
      { status: 400 }
    );
  }

  const paymentAmount = amount || qrData.amount;
  const totalAmount = paymentAmount + tip;
  
  const wallet = mockWallets.get(decoded.userId);
  if (!wallet || wallet.balance < totalAmount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    userId: decoded.userId,
    type: 'qr',
    amount: paymentAmount,
    tip,
    totalAmount,
    currency,
    merchant: qrData.merchant,
    qrData,
    status: 'completed',
    createdAt: new Date().toISOString(),
    confirmationCode: `QR${Date.now()}`
  };

  mockTransactions.set(transactionId, transaction);
  
  // Update wallet balance
  wallet.balance -= totalAmount;
  mockWallets.set(decoded.userId, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      receipt: {
        merchant: qrData.merchant,
        location: qrData.location,
        items: qrData.items || [],
        subtotal: paymentAmount,
        tip,
        total: totalAmount,
        confirmationCode: transaction.confirmationCode
      }
    }
  });
};

const processNFCPayment = async (body: any, decoded: any) => {
  const validation = nfcPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid NFC payment data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { nfcData, amount, currency, merchantId, terminalId } = validation.data;
  
  const wallet = mockWallets.get(decoded.userId);
  if (!wallet || wallet.balance < amount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  const merchant = mockMerchants.get(merchantId);
  if (!merchant) {
    return NextResponse.json(
      { success: false, error: 'Merchant not found' },
      { status: 404 }
    );
  }

  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    userId: decoded.userId,
    type: 'nfc',
    amount,
    currency,
    merchant,
    terminalId,
    nfcData,
    status: 'completed',
    createdAt: new Date().toISOString(),
    confirmationCode: `NFC${Date.now()}`
  };

  mockTransactions.set(transactionId, transaction);
  
  // Update wallet balance
  wallet.balance -= amount;
  mockWallets.set(decoded.userId, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      merchant: {
        name: merchant.name,
        type: merchant.type,
        location: merchant.location
      }
    }
  });
};

const processP2PPayment = async (body: any, decoded: any) => {
  const validation = p2pPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid P2P payment data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { recipientPhone, recipientEmail, recipientUsername, amount, currency, message, requestMoney } = validation.data;
  
  if (requestMoney) {
    // Handle money request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const request = {
      id: requestId,
      requesterId: decoded.userId,
      recipientPhone,
      recipientEmail,
      recipientUsername,
      amount,
      currency,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        request,
        shareLink: `https://paypass.app/pay/${requestId}`,
        message: 'Money request sent successfully'
      }
    });
  }

  // Handle payment
  const wallet = mockWallets.get(decoded.userId);
  if (!wallet || wallet.balance < amount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient balance' },
      { status: 400 }
    );
  }

  const transactionId = generateTransactionId();
  const transaction = {
    id: transactionId,
    userId: decoded.userId,
    type: 'p2p',
    amount,
    currency,
    recipientPhone,
    recipientEmail,
    recipientUsername,
    message,
    status: 'completed',
    createdAt: new Date().toISOString(),
    confirmationCode: `P2P${Date.now()}`
  };

  mockTransactions.set(transactionId, transaction);
  
  // Update wallet balance
  wallet.balance -= amount;
  mockWallets.set(decoded.userId, wallet);

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      recipient: {
        phone: recipientPhone,
        email: recipientEmail,
        username: recipientUsername
      }
    }
  });
};

const processMoneyRequest = async (body: any, decoded: any) => {
  const { amount, currency, recipientId, message } = body;
  
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const request = {
    id: requestId,
    requesterId: decoded.userId,
    recipientId,
    amount,
    currency,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  return NextResponse.json({
    success: true,
    data: {
      request,
      shareLink: `https://paypass.app/pay/${requestId}`,
      qrCode: Buffer.from(JSON.stringify({
        type: 'payment_request',
        requestId,
        amount,
        currency
      })).toString('base64')
    }
  });
};

const verifyMerchant = async (body: any) => {
  const { merchantId, location } = body;
  
  const merchant = mockMerchants.get(merchantId);
  if (!merchant) {
    return NextResponse.json(
      { success: false, error: 'Merchant not found' },
      { status: 404 }
    );
  }

  // Calculate distance if location provided
  let distance = null;
  if (location && merchant.location) {
    const lat1 = location.latitude;
    const lon1 = location.longitude;
    const lat2 = merchant.location.latitude;
    const lon2 = merchant.location.longitude;
    
    // Simple distance calculation (not accurate for production)
    distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111; // Approximate km
  }

  return NextResponse.json({
    success: true,
    data: {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        type: merchant.type,
        verified: true,
        acceptedPayments: merchant.acceptedPayments,
        distance: distance ? `${distance.toFixed(2)} km` : null
      }
    }
  });
};

const getPaymentStatus = async (transactionId: string) => {
  const transaction = mockTransactions.get(transactionId);
  
  if (!transaction) {
    return NextResponse.json(
      { success: false, error: 'Transaction not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt,
      confirmationCode: transaction.confirmationCode,
      type: transaction.type
    }
  });
};

const getPaymentHistory = async (userId: string, searchParams: URLSearchParams) => {
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type');
  
  let transactions = Array.from(mockTransactions.values())
    .filter((tx: any) => tx.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (type) {
    transactions = transactions.filter((tx: any) => tx.type === type);
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

const getPaymentMethods = async (userId: string) => {
  const wallet = mockWallets.get(userId);
  
  if (!wallet) {
    return NextResponse.json(
      { success: false, error: 'Wallet not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        available: true
      },
      cards: wallet.cards.map((card: any) => ({
        id: card.id,
        last4: card.last4,
        brand: card.brand,
        primary: card.primary,
        available: true
      })),
      paymentTypes: [
        { type: 'wallet', name: 'PayPass Wallet', available: true },
        { type: 'qr', name: 'QR Code Payment', available: true },
        { type: 'nfc', name: 'NFC Payment', available: true },
        { type: 'p2p', name: 'Send to Friend', available: true }
      ]
    }
  });
};

const getPaymentLimits = async (userId: string) => {
  return NextResponse.json({
    success: true,
    data: {
      daily: {
        limit: 5000,
        used: 250,
        remaining: 4750,
        currency: 'USD'
      },
      monthly: {
        limit: 25000,
        used: 8750,
        remaining: 16250,
        currency: 'USD'
      },
      perTransaction: {
        max: 2500,
        currency: 'USD'
      },
      paymentTypes: {
        qr: { maxPerTransaction: 500, dailyLimit: 2000 },
        nfc: { maxPerTransaction: 100, dailyLimit: 500 },
        p2p: { maxPerTransaction: 1000, dailyLimit: 3000 }
      }
    }
  });
};

const getNearbyMerchants = async (searchParams: URLSearchParams) => {
  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const radius = parseFloat(searchParams.get('radius') || '5'); // km
  
  const merchants = Array.from(mockMerchants.values()).map((merchant: any) => {
    // Calculate distance (simplified)
    const distance = Math.sqrt(
      Math.pow(merchant.location.latitude - latitude, 2) + 
      Math.pow(merchant.location.longitude - longitude, 2)
    ) * 111;
    
    return {
      ...merchant,
      distance: distance.toFixed(2)
    };
  }).filter((merchant: any) => parseFloat(merchant.distance) <= radius);

  return NextResponse.json({
    success: true,
    data: {
      merchants,
      location: { latitude, longitude, radius },
      count: merchants.length
    }
  });
};
