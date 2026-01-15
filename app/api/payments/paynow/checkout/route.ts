/**
 * Paynow Checkout Endpoint
 * Initiates a Paynow payment flow for user transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../_lib/auth';
import { financialLogger } from '../../../_lib/financial-logger';
import { complianceEngine } from '../../../_lib/compliance';
import { getPaynowProvider } from '../../../_lib/providers/paynow-setup';

export async function POST(request: NextRequest) {
  const operationId = `paynow-checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
    const { amount, currency, description, returnUrl } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!currency || !['ZWL', 'USD'].includes(currency)) {
      return NextResponse.json(
        { success: false, message: 'Invalid currency' },
        { status: 400 }
      );
    }

    if (!returnUrl) {
      return NextResponse.json(
        { success: false, message: 'Return URL is required' },
        { status: 400 }
      );
    }

    // Perform compliance check
    const complianceReport = await complianceEngine.performComplianceCheck(
      user.id,
      amount,
      'ZW',
      []
    );

    if (complianceReport.overallStatus === 'non_compliant') {
      financialLogger.logTransaction({
        operationId,
        userId: user.id,
        operationType: 'payment',
        amount,
        currency,
        status: 'failed',
        description: 'Paynow checkout blocked due to compliance check failure',
        metadata: { complianceStatus: complianceReport.overallStatus },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Payment blocked due to compliance checks',
          details: complianceReport.checks,
        },
        { status: 403 }
      );
    }

    // Get Paynow provider
    const paynowProvider = getPaynowProvider();
    if (!paynowProvider) {
      throw new Error('Paynow provider not available');
    }

    // Create payment link
    const paymentLinkResult = await paynowProvider.createPaymentLink(
      user.id,
      amount,
      currency,
      description || 'PayPass Payment',
      returnUrl
    );

    if (!paymentLinkResult.success) {
      throw new Error(paymentLinkResult.message);
    }

    // Log the operation
    financialLogger.logTransaction({
      operationId,
      userId: user.id,
      operationType: 'payment',
      amount,
      currency,
      status: 'processing',
      description: 'Paynow checkout initiated',
      metadata: {
        paymentLink: paymentLinkResult.paymentLink,
        pollUrl: paymentLinkResult.pollUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payment link created successfully',
        operationId,
        paymentLink: paymentLinkResult.paymentLink,
        pollUrl: paymentLinkResult.pollUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Paynow checkout error:', error);

    financialLogger.logTransaction({
      operationId,
      userId: 'unknown',
      operationType: 'payment',
      amount: 0,
      currency: 'ZWL',
      status: 'failed',
      description: `Paynow checkout error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Payment checkout failed',
        operationId,
      },
      { status: 500 }
    );
  }
}
