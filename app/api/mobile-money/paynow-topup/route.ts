/**
 * Paynow Top-Up Endpoint
 * Handles wallet top-ups via Paynow payment gateway
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../_lib/auth';
import { financialLogger } from '../../_lib/financial-logger';
import { complianceEngine } from '../../_lib/compliance';
import { getPaynowProvider } from '../../_lib/providers/paynow-setup';

export async function POST(request: NextRequest) {
  const operationId = `paynow-topup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
    const { amount, currency } = body;

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
        operationType: 'topup',
        amount,
        currency,
        status: 'failed',
        description: 'Paynow top-up blocked due to compliance check failure',
        metadata: { complianceStatus: complianceReport.overallStatus },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Top-up blocked due to compliance checks',
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

    // Execute top-up
    const startTime = Date.now();
    const result = await paynowProvider.topup(user.id, amount, currency);
    const duration = Date.now() - startTime;

    // Log transaction
    financialLogger.logTransaction({
      operationId,
      userId: user.id,
      operationType: 'topup',
      amount,
      currency,
      status: result.success ? 'processing' : 'failed',
      description: `Top-up via Paynow`,
      metadata: {
        providerId: 'paynow',
        externalReference: result.externalReference,
        pollUrl: result.data?.pollUrl,
      },
      duration,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          operationId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        operationId,
        transactionId: result.transactionId,
        externalReference: result.externalReference,
        pollUrl: result.data?.pollUrl,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Paynow top-up error:', error);

    financialLogger.logTransaction({
      operationId,
      userId: 'unknown',
      operationType: 'topup',
      amount: 0,
      currency: 'ZWL',
      status: 'failed',
      description: `Paynow top-up error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Top-up processing failed',
        operationId,
      },
      { status: 500 }
    );
  }
}
