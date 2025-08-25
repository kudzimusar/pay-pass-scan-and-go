import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Mobile QR Scanner API
// Handles QR code scanning, validation, payment processing, and QR code generation

const qrScanSchema = z.object({
  qrData: z.string(),
  scanType: z.enum(['payment', 'merchant', 'p2p', 'topup', 'loyalty', 'coupon']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional()
  }).optional(),
  scanContext: z.object({
    source: z.enum(['camera', 'gallery', 'nfc']),
    timestamp: z.string(),
    confidence: z.number().min(0).max(1).optional()
  })
});

const qrGenerateSchema = z.object({
  type: z.enum(['payment_request', 'merchant_payment', 'p2p_request', 'profile_share', 'loyalty_card']),
  data: z.record(z.any()),
  expiration: z.object({
    expiresIn: z.number().positive(), // seconds
    maxUses: z.number().positive().optional()
  }).optional(),
  customization: z.object({
    logo: z.string().optional(),
    color: z.string().optional(),
    style: z.enum(['standard', 'rounded', 'dots']).optional()
  }).optional()
});

const merchantQrSchema = z.object({
  merchantId: z.string(),
  locationId: z.string().optional(),
  amount: z.number().positive().optional(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number()
  })).optional(),
  taxAmount: z.number().min(0).optional(),
  tipEnabled: z.boolean().optional()
});

// Mock data stores
const mockQrCodes = new Map();
const mockMerchants = new Map();
const mockScanHistory = new Map();

// Initialize mock data
const initializeMockData = () => {
  if (mockMerchants.size === 0) {
    // Sample merchants
    mockMerchants.set('merchant_coffee_123', {
      id: 'merchant_coffee_123',
      name: 'Downtown Coffee Shop',
      type: 'restaurant',
      category: 'food_beverage',
      location: {
        address: '123 Main St, New York, NY 10001',
        latitude: 40.7589,
        longitude: -73.9851,
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      contact: {
        phone: '+1-555-0123',
        email: 'contact@downtowncoffee.com',
        website: 'https://downtowncoffee.com'
      },
      payment: {
        acceptsCard: true,
        acceptsWallet: true,
        acceptsNFC: true,
        tipEnabled: true,
        taxRate: 0.08875 // NYC tax rate
      },
      verification: {
        verified: true,
        businessLicense: 'NYC-123456',
        verifiedAt: '2024-01-15T10:00:00Z'
      },
      logo: 'https://example.com/logos/downtown-coffee.png'
    });

    mockMerchants.set('merchant_retail_456', {
      id: 'merchant_retail_456',
      name: 'TechGear Store',
      type: 'retail',
      category: 'electronics',
      location: {
        address: '456 Tech Ave, San Francisco, CA 94105',
        latitude: 37.7749,
        longitude: -122.4194,
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      },
      contact: {
        phone: '+1-555-0456',
        email: 'info@techgearstore.com',
        website: 'https://techgearstore.com'
      },
      payment: {
        acceptsCard: true,
        acceptsWallet: true,
        acceptsNFC: true,
        tipEnabled: false,
        taxRate: 0.08625 // SF tax rate
      },
      verification: {
        verified: true,
        businessLicense: 'SF-789012',
        verifiedAt: '2024-02-01T14:30:00Z'
      },
      logo: 'https://example.com/logos/techgear.png'
    });

    // Sample QR codes
    const sampleQrCodes = [
      {
        id: 'qr_merchant_coffee_001',
        type: 'merchant_payment',
        merchantId: 'merchant_coffee_123',
        data: {
          amount: 4.50,
          currency: 'USD',
          items: [
            { id: 'coffee_latte', name: 'Latte', price: 4.50, quantity: 1 }
          ],
          orderId: 'ORDER_001',
          tableNumber: 5
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        maxUses: 1,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        active: true
      },
      {
        id: 'qr_p2p_request_002',
        type: 'p2p_request',
        requesterId: 'user_123',
        data: {
          amount: 25.00,
          currency: 'USD',
          message: 'Lunch split payment',
          requestId: 'req_lunch_split_001'
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        maxUses: 1,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        active: true
      }
    ];

    sampleQrCodes.forEach(qr => {
      mockQrCodes.set(qr.id, qr);
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

// Parse and validate QR code data
const parseQrData = (qrData: string) => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(qrData);
    return { success: true, data: parsed, format: 'json' };
  } catch {
    try {
      // Try to parse as base64 encoded JSON
      const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return { success: true, data: parsed, format: 'base64_json' };
    } catch {
      // Try to parse as URL
      if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
        try {
          const url = new URL(qrData);
          return { success: true, data: { url: qrData, params: Object.fromEntries(url.searchParams) }, format: 'url' };
        } catch {
          return { success: false, error: 'Invalid URL format' };
        }
      }
      
      // Try to parse as PayPass specific format
      if (qrData.startsWith('paypass://')) {
        try {
          const url = new URL(qrData);
          return { success: true, data: { 
            action: url.pathname.substring(1), 
            params: Object.fromEntries(url.searchParams) 
          }, format: 'paypass_uri' };
        } catch {
          return { success: false, error: 'Invalid PayPass URI format' };
        }
      }
      
      return { success: false, error: 'Unsupported QR code format' };
    }
  }
};

// Validate QR code against business rules
const validateQrCode = (qrId: string, userId: string) => {
  const qrCode = mockQrCodes.get(qrId);
  
  if (!qrCode) {
    return { valid: false, error: 'QR code not found', code: 'NOT_FOUND' };
  }

  if (!qrCode.active) {
    return { valid: false, error: 'QR code is inactive', code: 'INACTIVE' };
  }

  if (new Date(qrCode.expiresAt) < new Date()) {
    return { valid: false, error: 'QR code has expired', code: 'EXPIRED' };
  }

  if (qrCode.maxUses && qrCode.usedCount >= qrCode.maxUses) {
    return { valid: false, error: 'QR code usage limit exceeded', code: 'USAGE_LIMIT_EXCEEDED' };
  }

  // Check if user is trying to pay themselves (for P2P)
  if (qrCode.type === 'p2p_request' && qrCode.requesterId === userId) {
    return { valid: false, error: 'Cannot pay yourself', code: 'SELF_PAYMENT' };
  }

  return { valid: true, qrCode };
};

// Generate QR code data
const generateQrCode = (type: string, data: any, options: any = {}) => {
  const qrId = `qr_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const qrCode = {
    id: qrId,
    type,
    data,
    expiresAt: options.expiration ? 
      new Date(Date.now() + options.expiration.expiresIn * 1000).toISOString() :
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours
    maxUses: options.expiration?.maxUses || null,
    usedCount: 0,
    createdAt: new Date().toISOString(),
    active: true,
    customization: options.customization || {}
  };

  mockQrCodes.set(qrId, qrCode);

  // Generate QR code content
  const qrContent = Buffer.from(JSON.stringify({
    id: qrId,
    type,
    data,
    version: '2.0'
  })).toString('base64');

  return {
    id: qrId,
    content: qrContent,
    displayUrl: `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(qrContent)}`,
    expiresAt: qrCode.expiresAt,
    maxUses: qrCode.maxUses
  };
};

// POST /api/mobile/qr-scanner - Scan and process QR codes
export async function POST(request: NextRequest) {
  try {
    initializeMockData();
    
    const body = await request.json();
    const { action } = body;
    const decoded = authenticateRequest(request);
    
    switch (action) {
      case 'scan':
        return processScan(body, decoded);
      case 'generate':
        return generateQr(body, decoded);
      case 'validate':
        return validateQr(body, decoded);
      case 'merchant_qr':
        return generateMerchantQr(body, decoded);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('QR scanner error:', error);
    return NextResponse.json(
      { success: false, error: 'QR scanner operation failed' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/qr-scanner - Get QR scanner information
export async function GET(request: NextRequest) {
  try {
    initializeMockData();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const decoded = authenticateRequest(request);
    
    switch (action) {
      case 'history':
        return getScanHistory(decoded.userId, searchParams);
      case 'merchant':
        return getMerchantInfo(searchParams.get('merchantId') || '');
      case 'qr_info':
        return getQrInfo(searchParams.get('qrId') || '');
      case 'supported_formats':
        return getSupportedFormats();
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('QR scanner query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QR scanner data' },
      { status: 500 }
    );
  }
}

const processScan = async (body: any, decoded: any) => {
  const validation = qrScanSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid scan data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { qrData, scanType, location, scanContext } = validation.data;
  
  // Parse QR code data
  const parseResult = parseQrData(qrData);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: parseResult.error },
      { status: 400 }
    );
  }

  const { data: qrContent, format } = parseResult;
  
  // Record scan in history
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const scanRecord = {
    id: scanId,
    userId: decoded.userId,
    qrData,
    scanType,
    location,
    scanContext,
    qrContent,
    format,
    scannedAt: new Date().toISOString(),
    processed: false
  };

  // Add to user's scan history
  const userHistory = mockScanHistory.get(decoded.userId) || [];
  userHistory.unshift(scanRecord);
  mockScanHistory.set(decoded.userId, userHistory.slice(0, 100)); // Keep last 100 scans

  // Process based on QR content type
  let processResult;
  
  if (qrContent.type) {
    switch (qrContent.type) {
      case 'merchant_payment':
        processResult = await processMerchantPayment(qrContent, decoded.userId);
        break;
      case 'p2p_request':
        processResult = await processP2PRequest(qrContent, decoded.userId);
        break;
      case 'payment_request':
        processResult = await processPaymentRequest(qrContent, decoded.userId);
        break;
      case 'loyalty_card':
        processResult = await processLoyaltyCard(qrContent, decoded.userId);
        break;
      case 'profile_share':
        processResult = await processProfileShare(qrContent, decoded.userId);
        break;
      default:
        processResult = { success: false, error: 'Unsupported QR code type' };
    }
  } else if (qrContent.url) {
    // Handle URL-based QR codes
    processResult = await processUrlQr(qrContent, decoded.userId);
  } else if (qrContent.action) {
    // Handle PayPass URI scheme
    processResult = await processPayPassUri(qrContent, decoded.userId);
  } else {
    processResult = { success: false, error: 'Unable to determine QR code purpose' };
  }

  // Update scan record
  scanRecord.processed = processResult.success;
  const updatedHistory = mockScanHistory.get(decoded.userId);
  if (updatedHistory && updatedHistory[0].id === scanId) {
    updatedHistory[0] = scanRecord;
    mockScanHistory.set(decoded.userId, updatedHistory);
  }

  return NextResponse.json({
    success: true,
    data: {
      scanId,
      format,
      qrContent,
      processResult,
      scanContext,
      scannedAt: scanRecord.scannedAt
    }
  });
};

const generateQr = async (body: any, decoded: any) => {
  const validation = qrGenerateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid generation data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { type, data, expiration, customization } = validation.data;
  
  // Add user context to data
  const enrichedData = {
    ...data,
    generatedBy: decoded.userId,
    generatedAt: new Date().toISOString()
  };

  const qrCode = generateQrCode(type, enrichedData, { expiration, customization });

  return NextResponse.json({
    success: true,
    data: {
      qrCode,
      instructions: getQrInstructions(type),
      sharing: {
        link: `https://paypass.app/qr/${qrCode.id}`,
        shortLink: `https://pp.app/q/${qrCode.id.substr(-8)}`
      }
    }
  });
};

const validateQr = async (body: any, decoded: any) => {
  const { qrId } = body;
  
  const validation = validateQrCode(qrId, decoded.userId);
  
  return NextResponse.json({
    success: validation.valid,
    data: validation.valid ? {
      qrCode: validation.qrCode,
      valid: true
    } : {
      valid: false,
      error: validation.error,
      code: validation.code
    }
  });
};

const generateMerchantQr = async (body: any, decoded: any) => {
  const validation = merchantQrSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid merchant QR data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { merchantId, locationId, amount, items, taxAmount, tipEnabled } = validation.data;
  
  const merchant = mockMerchants.get(merchantId);
  if (!merchant) {
    return NextResponse.json(
      { success: false, error: 'Merchant not found' },
      { status: 404 }
    );
  }

  const merchantData = {
    merchantId,
    locationId,
    merchant: {
      name: merchant.name,
      type: merchant.type,
      verified: merchant.verification.verified
    },
    payment: {
      amount,
      currency: 'USD',
      items,
      taxAmount: taxAmount || (amount ? amount * merchant.payment.taxRate : 0),
      tipEnabled: tipEnabled !== undefined ? tipEnabled : merchant.payment.tipEnabled
    },
    orderId: `ORDER_${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  const qrCode = generateQrCode('merchant_payment', merchantData, {
    expiration: { expiresIn: 15 * 60 }, // 15 minutes
    customization: { logo: merchant.logo }
  });

  return NextResponse.json({
    success: true,
    data: {
      qrCode,
      merchant: merchant.name,
      amount: merchantData.payment.amount,
      currency: 'USD',
      validFor: '15 minutes'
    }
  });
};

const processMerchantPayment = async (qrContent: any, userId: string) => {
  if (!qrContent.id) {
    return { success: false, error: 'Invalid merchant QR code' };
  }

  const validation = validateQrCode(qrContent.id, userId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const merchant = mockMerchants.get(qrContent.data.merchantId);
  if (!merchant) {
    return { success: false, error: 'Merchant not found' };
  }

  return {
    success: true,
    type: 'merchant_payment',
    merchant: {
      id: merchant.id,
      name: merchant.name,
      verified: merchant.verification.verified,
      logo: merchant.logo
    },
    payment: qrContent.data.payment,
    qrId: qrContent.id,
    nextStep: 'confirm_payment'
  };
};

const processP2PRequest = async (qrContent: any, userId: string) => {
  if (!qrContent.id) {
    return { success: false, error: 'Invalid P2P QR code' };
  }

  const validation = validateQrCode(qrContent.id, userId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return {
    success: true,
    type: 'p2p_request',
    request: {
      amount: qrContent.data.amount,
      currency: qrContent.data.currency,
      message: qrContent.data.message,
      requesterId: qrContent.data.requesterId
    },
    qrId: qrContent.id,
    nextStep: 'confirm_payment'
  };
};

const processPaymentRequest = async (qrContent: any, userId: string) => {
  return {
    success: true,
    type: 'payment_request',
    request: qrContent.data,
    nextStep: 'confirm_payment'
  };
};

const processLoyaltyCard = async (qrContent: any, userId: string) => {
  return {
    success: true,
    type: 'loyalty_card',
    card: qrContent.data,
    nextStep: 'add_to_wallet'
  };
};

const processProfileShare = async (qrContent: any, userId: string) => {
  return {
    success: true,
    type: 'profile_share',
    profile: qrContent.data,
    nextStep: 'add_contact'
  };
};

const processUrlQr = async (qrContent: any, userId: string) => {
  return {
    success: true,
    type: 'url',
    url: qrContent.url,
    params: qrContent.params,
    nextStep: 'open_browser'
  };
};

const processPayPassUri = async (qrContent: any, userId: string) => {
  return {
    success: true,
    type: 'paypass_uri',
    action: qrContent.action,
    params: qrContent.params,
    nextStep: 'execute_action'
  };
};

const getScanHistory = (userId: string, searchParams: URLSearchParams) => {
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type');
  
  let history = mockScanHistory.get(userId) || [];
  
  if (type) {
    history = history.filter((scan: any) => scan.scanType === type);
  }

  const paginatedHistory = history.slice(offset, offset + limit);
  
  return NextResponse.json({
    success: true,
    data: {
      history: paginatedHistory,
      pagination: {
        total: history.length,
        limit,
        offset,
        hasMore: offset + limit < history.length
      },
      summary: {
        totalScans: history.length,
        successfulScans: history.filter((scan: any) => scan.processed).length,
        scanTypes: history.reduce((acc: any, scan: any) => {
          acc[scan.scanType] = (acc[scan.scanType] || 0) + 1;
          return acc;
        }, {})
      }
    }
  });
};

const getMerchantInfo = (merchantId: string) => {
  const merchant = mockMerchants.get(merchantId);
  
  if (!merchant) {
    return NextResponse.json(
      { success: false, error: 'Merchant not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { merchant }
  });
};

const getQrInfo = (qrId: string) => {
  const qrCode = mockQrCodes.get(qrId);
  
  if (!qrCode) {
    return NextResponse.json(
      { success: false, error: 'QR code not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: qrCode.id,
      type: qrCode.type,
      active: qrCode.active,
      expiresAt: qrCode.expiresAt,
      usedCount: qrCode.usedCount,
      maxUses: qrCode.maxUses,
      createdAt: qrCode.createdAt
    }
  });
};

const getSupportedFormats = () => {
  return NextResponse.json({
    success: true,
    data: {
      formats: [
        { type: 'json', description: 'Native JSON format' },
        { type: 'base64_json', description: 'Base64 encoded JSON' },
        { type: 'url', description: 'HTTP/HTTPS URLs' },
        { type: 'paypass_uri', description: 'PayPass URI scheme' }
      ],
      qrTypes: [
        { type: 'merchant_payment', description: 'Merchant payment QR codes' },
        { type: 'p2p_request', description: 'Person-to-person payment requests' },
        { type: 'payment_request', description: 'General payment requests' },
        { type: 'loyalty_card', description: 'Loyalty card QR codes' },
        { type: 'profile_share', description: 'Profile sharing QR codes' }
      ],
      scanTypes: [
        { type: 'payment', description: 'Payment-related scans' },
        { type: 'merchant', description: 'Merchant-specific scans' },
        { type: 'p2p', description: 'Person-to-person scans' },
        { type: 'topup', description: 'Top-up scans' },
        { type: 'loyalty', description: 'Loyalty program scans' },
        { type: 'coupon', description: 'Coupon/discount scans' }
      ]
    }
  });
};

const getQrInstructions = (type: string) => {
  const instructions = {
    merchant_payment: 'Show this QR code to the customer for payment',
    p2p_request: 'Share this QR code to request money from friends',
    payment_request: 'Share this QR code for payment',
    loyalty_card: 'Show this QR code to earn loyalty points',
    profile_share: 'Share this QR code to connect with others'
  };

  return instructions[type as keyof typeof instructions] || 'Scan this QR code with PayPass app';
};
