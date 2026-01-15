/**
 * Paynow Payment Status Endpoint
 * Polls the status of a Paynow payment transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../_lib/auth';
import { financialLogger } from '../../../_lib/financial-logger';
import { getPaynowProvider } from '../../../_lib/providers/paynow-setup';

export async function GET(request: NextRequest) {
  const operationId = `paynow-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    // Get poll URL from query parameters
    const pollUrl = request.nextUrl.searchParams.get('pollUrl');
    if (!pollUrl) {
      return NextResponse.json(
        { success: false, message: 'Poll URL is required' },
        { status: 400 }
      );
    }

    // Get Paynow provider
    const paynowProvider = getPaynowProvider();
    if (!paynowProvider) {
      throw new Error('Paynow provider not available');
    }

    // Poll transaction status
    const statusResult = await paynowProvider.pollTransactionStatus(pollUrl);

    // Log the operation
    financialLogger.logAudit({
      auditId: operationId,
      userId: user.id,
      action: 'poll_paynow_status',
      resource: 'payment',
      changes: { status: statusResult.status },
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payment status retrieved',
        operationId,
        status: statusResult.status,
        isPaid: statusResult.success,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Paynow status polling error:', error);

    financialLogger.logAudit({
      auditId: operationId,
      userId: 'unknown',
      action: 'poll_paynow_status',
      resource: 'payment',
      changes: {},
      status: 'failure',
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve payment status',
        operationId,
      },
      { status: 500 }
    );
  }
}
