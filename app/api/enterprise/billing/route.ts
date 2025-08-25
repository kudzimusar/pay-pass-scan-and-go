import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const billingQuerySchema = z.object({
  accountId: z.string().optional(),
  period: z.enum(['current', 'monthly', 'quarterly', 'yearly']).optional(),
  status: z.enum(['current', 'overdue', 'paid', 'pending']).optional(),
  includeUsage: z.boolean().optional(),
  includeForecast: z.boolean().optional()
});

const createInvoiceSchema = z.object({
  accountId: z.string().uuid(),
  billingPeriod: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    amount: z.number().positive(),
    category: z.enum(['subscription', 'usage', 'overage', 'addon', 'discount'])
  })),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const updateBillingSchema = z.object({
  paymentMethodId: z.string().optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  billingContact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string()
  }).optional(),
  preferences: z.object({
    currency: z.string().length(3),
    billingCycle: z.enum(['monthly', 'quarterly', 'annually']),
    autoPayEnabled: z.boolean(),
    paperlessEnabled: z.boolean(),
    reminderDays: z.number().min(1).max(30)
  }).optional()
});

// Mock billing data generator
const generateMockBillingData = (accountId: string) => ({
  accountId,
  currentBalance: Math.random() > 0.5 ? -(Math.random() * 5000 + 1000) : Math.random() * 2000,
  currency: 'USD',
  billingCycle: 'monthly' as const,
  status: ['current', 'overdue', 'paid'][Math.floor(Math.random() * 3)] as 'current' | 'overdue' | 'paid',
  
  currentPeriod: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    charges: {
      subscription: 9999,
      usage: Math.floor(Math.random() * 5000) + 1000,
      overages: Math.floor(Math.random() * 1000),
      discounts: -Math.floor(Math.random() * 500),
      taxes: Math.floor(Math.random() * 800) + 200,
      total: 0 // Will be calculated
    },
    usage: {
      transactions: Math.floor(Math.random() * 100000) + 50000,
      apiCalls: Math.floor(Math.random() * 500000) + 250000,
      storageGB: Math.floor(Math.random() * 100) + 50,
      dataTransferGB: Math.floor(Math.random() * 500) + 100
    }
  },

  paymentMethod: {
    id: 'pm_' + Math.random().toString(36).substring(2, 15),
    type: 'card' as const,
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true
  },

  billingAddress: {
    street: '123 Business Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  },

  billingContact: {
    name: 'John Finance',
    email: 'billing@company.com',
    phone: '+1-555-0123'
  },

  preferences: {
    currency: 'USD',
    billingCycle: 'monthly' as const,
    autoPayEnabled: true,
    paperlessEnabled: true,
    reminderDays: 7
  },

  invoices: Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const amount = Math.floor(Math.random() * 15000) + 5000;
    
    return {
      id: `inv_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`,
      number: `INV-${date.getFullYear()}-${String(i + 1).padStart(3, '0')}`,
      date: date.toISOString(),
      dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount,
      status: i === 0 ? 'current' : ['paid', 'overdue'][Math.floor(Math.random() * 2)],
      currency: 'USD',
      items: [
        {
          description: 'Enterprise Pro Subscription',
          quantity: 1,
          unitPrice: 9999,
          amount: 9999,
          category: 'subscription' as const
        },
        {
          description: 'Transaction Fees',
          quantity: Math.floor(Math.random() * 10000) + 5000,
          unitPrice: 0.029,
          amount: Math.floor(Math.random() * 3000) + 1000,
          category: 'usage' as const
        }
      ]
    };
  }),

  usageHistory: Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    return {
      period: date.toISOString().slice(0, 7),
      transactions: Math.floor(Math.random() * 50000) + 25000,
      apiCalls: Math.floor(Math.random() * 200000) + 100000,
      storageGB: Math.floor(Math.random() * 50) + 25,
      dataTransferGB: Math.floor(Math.random() * 200) + 50,
      cost: Math.floor(Math.random() * 8000) + 4000
    };
  }),

  forecast: {
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedAmount: Math.floor(Math.random() * 5000) + 10000,
    projectedUsage: {
      transactions: Math.floor(Math.random() * 60000) + 40000,
      apiCalls: Math.floor(Math.random() * 300000) + 200000,
      estimatedOverages: Math.floor(Math.random() * 1000)
    }
  },

  alerts: [
    {
      id: 'alert_1',
      type: 'usage_threshold',
      message: 'API usage is approaching monthly limit',
      severity: 'warning',
      threshold: '80%',
      currentUsage: '78%',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert_2',
      type: 'billing_reminder',
      message: 'Payment due in 3 days',
      severity: 'info',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 14567.89,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
});

// GET /api/enterprise/billing - Get billing information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const validation = billingQuerySchema.safeParse(params);
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

    const { accountId, period = 'current', status, includeUsage = 'true', includeForecast = 'true' } = validation.data;

    // Generate billing data
    const billingData = generateMockBillingData(accountId || 'default_account');
    
    // Calculate current period total
    const charges = billingData.currentPeriod.charges;
    charges.total = charges.subscription + charges.usage + charges.overages + charges.discounts + charges.taxes;

    // Apply filters
    let filteredInvoices = billingData.invoices;
    if (status) {
      filteredInvoices = billingData.invoices.filter(inv => inv.status === status);
    }

    const response: any = {
      success: true,
      data: {
        account: {
          id: billingData.accountId,
          balance: billingData.currentBalance,
          currency: billingData.currency,
          status: billingData.status,
          billingCycle: billingData.billingCycle
        },
        currentPeriod: billingData.currentPeriod,
        paymentMethod: billingData.paymentMethod,
        billingContact: billingData.billingContact,
        billingAddress: billingData.billingAddress,
        preferences: billingData.preferences,
        invoices: filteredInvoices.slice(0, 10), // Limit to recent invoices
        alerts: billingData.alerts
      }
    };

    if (includeUsage === 'true' || includeUsage === true) {
      response.data.usageHistory = billingData.usageHistory;
    }

    if (includeForecast === 'true' || includeForecast === true) {
      response.data.forecast = billingData.forecast;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Enterprise billing fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch billing information'
      },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/billing/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = createInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid invoice data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const invoiceData = validation.data;
    
    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    const newInvoice = {
      id: `inv_${Date.now()}`,
      number: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      accountId: invoiceData.accountId,
      date: new Date().toISOString(),
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billingPeriod: invoiceData.billingPeriod,
      status: 'current' as const,
      currency: 'USD',
      amounts: {
        subtotal,
        tax,
        total
      },
      items: invoiceData.items,
      metadata: invoiceData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, save to database
    // await saveInvoice(newInvoice);

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice: newInvoice
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invoice'
      },
      { status: 500 }
    );
  }
}

// PUT /api/enterprise/billing - Update billing settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = updateBillingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid billing update data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;
    
    // In a real implementation, update the billing settings in database
    // await updateBillingSettings(accountId, updateData);

    const updatedBilling = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      success: true
    };

    return NextResponse.json({
      success: true,
      message: 'Billing settings updated successfully',
      data: updatedBilling
    });

  } catch (error) {
    console.error('Billing update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update billing settings'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/enterprise/billing/invoices/[id] - Cancel or void invoice
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const invoiceId = url.pathname.split('/').pop();
    
    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice ID is required'
        },
        { status: 400 }
      );
    }

    // In a real implementation, void the invoice
    // await voidInvoice(invoiceId);

    return NextResponse.json({
      success: true,
      message: 'Invoice voided successfully',
      data: {
        invoiceId,
        status: 'voided',
        voidedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Invoice void error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to void invoice'
      },
      { status: 500 }
    );
  }
}
