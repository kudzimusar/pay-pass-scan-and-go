/**
 * Create Payment Request Endpoint
 * Allows users to request payments from friends and family
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentRequestManager } from '../../../_lib/pay-for-friend-advanced';
import { verifyToken } from '../../../_lib/auth';
import { financialLogger } from '../../../_lib/financial-logger';

export async function POST(request: NextRequest) {
  const operationId = `payment-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
    const { payerId, amount, currency, purpose, expiryDays } = body;

    // Validate input
    if (!payerId) {
      return NextResponse.json(
        { success: false, message: 'Payer ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create payment request
    const paymentRequest = await paymentRequestManager.createPaymentRequest(
      user.id,
      payerId,
      amount,
      currency || 'USD',
      purpose || 'Payment request',
      expiryDays || 7
    );

    // Log the operation
    financialLogger.logAudit({
      auditId: operationId,
      userId: user.id,
      action: 'create_payment_request',
      resource: 'payment_request',
      changes: {
        requestId: paymentRequest.requestId,
        payerId,
        amount,
      },
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payment request created successfully',
        operationId,
        paymentRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment request creation error:', error);

    financialLogger.logAudit({
      auditId: operationId,
      userId: 'unknown',
      action: 'create_payment_request',
      resource: 'payment_request',
      changes: {},
      status: 'failure',
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create payment request',
        operationId,
      },
      { status: 500 }
    );
  }
}
