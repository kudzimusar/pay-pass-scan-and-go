import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createEnterpriseAccountSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  businessType: z.enum(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'other']),
  industry: z.string(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  primaryContact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    title: z.string()
  }),
  accountLimits: z.object({
    dailyTransactionLimit: z.number().positive(),
    monthlyTransactionLimit: z.number().positive(),
    maxTransactionAmount: z.number().positive(),
    maxApiCallsPerDay: z.number().positive()
  }).optional(),
  features: z.array(z.enum([
    'bulk_payments',
    'api_access',
    'advanced_reporting',
    'dedicated_support',
    'custom_integration',
    'white_label',
    'multi_currency',
    'real_time_notifications'
  ])).optional()
});

const updateEnterpriseAccountSchema = createEnterpriseAccountSchema.partial();

const accountQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  industry: z.string().optional(),
  tier: z.enum(['basic', 'premium', 'enterprise', 'custom']).optional(),
  search: z.string().optional()
});

// Mock enterprise account data
const generateMockAccount = (id: string) => ({
  id,
  companyName: `Company ${id.slice(-3)}`,
  businessType: 'corporation' as const,
  industry: ['fintech', 'e-commerce', 'healthcare', 'education', 'manufacturing'][Math.floor(Math.random() * 5)],
  taxId: `TAX${Math.random().toString().slice(2, 11)}`,
  registrationNumber: `REG${Math.random().toString().slice(2, 11)}`,
  website: `https://company${id.slice(-3)}.com`,
  description: `Leading company in their industry with innovative solutions`,
  status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as 'active' | 'inactive' | 'suspended',
  tier: ['basic', 'premium', 'enterprise', 'custom'][Math.floor(Math.random() * 4)] as 'basic' | 'premium' | 'enterprise' | 'custom',
  billingAddress: {
    street: `${Math.floor(Math.random() * 9999)} Business Ave`,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  },
  primaryContact: {
    name: `John Contact ${id.slice(-3)}`,
    email: `contact${id.slice(-3)}@company.com`,
    phone: '+1-555-0123',
    title: 'CFO'
  },
  accountLimits: {
    dailyTransactionLimit: 1000000,
    monthlyTransactionLimit: 30000000,
    maxTransactionAmount: 100000,
    maxApiCallsPerDay: 10000
  },
  features: ['bulk_payments', 'api_access', 'advanced_reporting', 'dedicated_support'],
  metrics: {
    totalTransactions: Math.floor(Math.random() * 100000) + 10000,
    totalVolume: Math.floor(Math.random() * 10000000) + 1000000,
    monthlyVolume: Math.floor(Math.random() * 1000000) + 100000,
    averageTransactionSize: Math.floor(Math.random() * 5000) + 500,
    successRate: 95 + Math.random() * 5,
    lastTransactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  billing: {
    plan: 'Enterprise Pro',
    monthlyFee: 9999,
    usageCharges: Math.floor(Math.random() * 5000) + 1000,
    outstandingBalance: Math.floor(Math.random() * 10000),
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa'
    }
  },
  apiCredentials: {
    publicKey: `pk_${Math.random().toString(36).substring(2, 32)}`,
    hasSecretKey: true,
    webhookUrl: `https://company${id.slice(-3)}.com/webhooks/paypass`,
    allowedIPs: ['192.168.1.0/24', '10.0.0.0/8']
  },
  compliance: {
    kycStatus: 'approved' as const,
    amlStatus: 'approved' as const,
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    lastReview: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    nextReview: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    documents: [
      { type: 'business_license', status: 'approved', uploadDate: new Date().toISOString() },
      { type: 'tax_certificate', status: 'approved', uploadDate: new Date().toISOString() },
      { type: 'bank_statement', status: 'pending', uploadDate: new Date().toISOString() }
    ]
  },
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
});

// GET /api/enterprise/accounts - List enterprise accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    
    const validation = accountQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { page = '1', limit = '10', status, industry, tier, search } = validation.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Generate mock accounts
    const totalAccounts = 156;
    const accounts = Array.from({ length: Math.min(limitNum, 20) }, (_, i) => 
      generateMockAccount(`ent_${pageNum}_${i + 1}`)
    );

    // Apply filters
    let filteredAccounts = accounts;
    
    if (status) {
      filteredAccounts = filteredAccounts.filter(acc => acc.status === status);
    }
    
    if (industry) {
      filteredAccounts = filteredAccounts.filter(acc => acc.industry === industry);
    }
    
    if (tier) {
      filteredAccounts = filteredAccounts.filter(acc => acc.tier === tier);
    }
    
    if (search) {
      filteredAccounts = filteredAccounts.filter(acc => 
        acc.companyName.toLowerCase().includes(search.toLowerCase()) ||
        acc.primaryContact.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const totalPages = Math.ceil(totalAccounts / limitNum);

    return NextResponse.json({
      success: true,
      data: {
        accounts: filteredAccounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalAccounts,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        summary: {
          totalAccounts,
          activeAccounts: Math.floor(totalAccounts * 0.85),
          inactiveAccounts: Math.floor(totalAccounts * 0.1),
          suspendedAccounts: Math.floor(totalAccounts * 0.05),
          totalMonthlyVolume: 45678900,
          averageMonthlyVolume: 292750
        }
      }
    });

  } catch (error) {
    console.error('Enterprise accounts list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch enterprise accounts'
      },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/accounts - Create new enterprise account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = createEnterpriseAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid account data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const accountData = validation.data;
    
    // Create new account
    const newAccount = {
      id: `ent_${Date.now()}`,
      ...accountData,
      status: 'pending' as const,
      tier: 'basic' as const,
      metrics: {
        totalTransactions: 0,
        totalVolume: 0,
        monthlyVolume: 0,
        averageTransactionSize: 0,
        successRate: 0,
        lastTransactionDate: null
      },
      billing: {
        plan: 'Enterprise Basic',
        monthlyFee: 299,
        usageCharges: 0,
        outstandingBalance: 0,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: null
      },
      apiCredentials: {
        publicKey: `pk_${Math.random().toString(36).substring(2, 32)}`,
        hasSecretKey: true,
        webhookUrl: null,
        allowedIPs: []
      },
      compliance: {
        kycStatus: 'pending' as const,
        amlStatus: 'pending' as const,
        riskLevel: 'medium' as const,
        lastReview: null,
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        documents: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    // In a real implementation, save to database
    // await saveEnterpriseAccount(newAccount);

    return NextResponse.json({
      success: true,
      message: 'Enterprise account created successfully',
      data: {
        account: newAccount,
        nextSteps: [
          'Complete KYC verification',
          'Upload required documents',
          'Setup payment method',
          'Configure API credentials',
          'Test integration'
        ]
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Enterprise account creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create enterprise account'
      },
      { status: 500 }
    );
  }
}

// PUT /api/enterprise/accounts/[id] - Update enterprise account
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const accountId = url.pathname.split('/').pop();
    
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validation = updateEnterpriseAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    // In a real implementation, fetch and update the account
    const existingAccount = generateMockAccount(accountId);
    
    const updatedAccount = {
      ...existingAccount,
      ...validation.data,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Enterprise account updated successfully',
      data: {
        account: updatedAccount
      }
    });

  } catch (error) {
    console.error('Enterprise account update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update enterprise account'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/enterprise/accounts/[id] - Deactivate enterprise account
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const accountId = url.pathname.split('/').pop();
    
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account ID is required'
        },
        { status: 400 }
      );
    }

    // In a real implementation, soft delete or deactivate the account
    // await deactivateEnterpriseAccount(accountId);

    return NextResponse.json({
      success: true,
      message: 'Enterprise account deactivated successfully',
      data: {
        accountId,
        status: 'inactive',
        deactivatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Enterprise account deactivation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to deactivate enterprise account'
      },
      { status: 500 }
    );
  }
}
