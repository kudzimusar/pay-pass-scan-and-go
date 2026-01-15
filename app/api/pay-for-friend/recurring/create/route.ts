/**
 * Create Recurring Payment Endpoint
 * Allows users to set up recurring payments to friends and family
 */

import { NextRequest, NextResponse } from 'next/server';
import { recurringPaymentManager, RecurrenceType } from '../../../_lib/pay-for-friend-advanced';
import { verifyToken } from '../../../_lib/auth';
import { financialLogger } from '../../../_lib/financial-logger';

export async function POST(request: NextRequest) {
  const operationId = `recurring-create-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { recipientId, amount, currency, recurrence, purpose, startDate, endDate } = body;

    // Validate input
    if (!recipientId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid recipient or amount' },
        { status: 400 }
      );
    }

    if (!Object.values(RecurrenceType).includes(recurrence)) {
      return NextResponse.json(
        { success: false, message: 'Invalid recurrence type' },
        { status: 400 }
      );
    }

    // Create recurring payment
    const payment = await recurringPaymentManager.createRecurringPayment(
      user.id,
      recipientId,
      amount,
      currency || 'USD',
      recurrence,
      purpose || 'Regular payment',
      new Date(startDate),
      endDate ? new Date(endDate) : undefined
    );

    // Log the operation
    financialLogger.logAudit({
      auditId: operationId,
      userId: user.id,
      action: 'create_recurring_payment',
      resource: 'recurring_payment',
      changes: { paymentId: payment.paymentId, recurrence },
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Recurring payment created successfully',
        operationId,
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Recurring payment creation error:', error);

    financialLogger.logAudit({
      auditId: operationId,
      userId: 'unknown',
      action: 'create_recurring_payment',
      resource: 'recurring_payment',
      changes: {},
      status: 'failure',
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create recurring payment',
        operationId,
      },
      { status: 500 }
    );
  }
}
