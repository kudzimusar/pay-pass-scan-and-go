/**
 * Create Group Payment Endpoint
 * Allows users to create group payments for shared expenses
 */

import { NextRequest, NextResponse } from 'next/server';
import { groupPaymentManager } from '../../../_lib/pay-for-friend-advanced';
import { verifyToken } from '../../../_lib/auth';
import { financialLogger } from '../../../_lib/financial-logger';

export async function POST(request: NextRequest) {
  const operationId = `group-create-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
    const { totalAmount, currency, purpose, splitMethod, participants, expiryDays } = body;

    // Validate input
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid total amount' },
        { status: 400 }
      );
    }

    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return NextResponse.json(
        { success: false, message: 'At least 2 participants required' },
        { status: 400 }
      );
    }

    if (!['equal', 'custom', 'percentage'].includes(splitMethod)) {
      return NextResponse.json(
        { success: false, message: 'Invalid split method' },
        { status: 400 }
      );
    }

    // Create group payment
    const groupPayment = await groupPaymentManager.createGroupPayment(
      user.id,
      totalAmount,
      currency || 'USD',
      purpose || 'Group expense',
      splitMethod,
      participants,
      expiryDays || 7
    );

    // Log the operation
    financialLogger.logAudit({
      auditId: operationId,
      userId: user.id,
      action: 'create_group_payment',
      resource: 'group_payment',
      changes: {
        groupPaymentId: groupPayment.groupPaymentId,
        participantCount: participants.length,
        totalAmount,
      },
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Group payment created successfully',
        operationId,
        groupPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Group payment creation error:', error);

    financialLogger.logAudit({
      auditId: operationId,
      userId: 'unknown',
      action: 'create_group_payment',
      resource: 'group_payment',
      changes: {},
      status: 'failure',
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create group payment',
        operationId,
      },
      { status: 500 }
    );
  }
}
