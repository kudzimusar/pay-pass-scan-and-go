/**
 * WhatsApp Payment Request API
 * Send payment requests via WhatsApp to friends and family
 * Integrates with the "Pay for your Friend" functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import WhatsAppService from '../../_lib/whatsapp-service';
import { verifyJWT } from '../../_lib/auth';
import { storage } from '../../_lib/storage';
import { users, friendNetworks } from '../../../../shared/schema';

const whatsappService = new WhatsAppService();

// Request validation schema
const paymentRequestSchema = z.object({
  to: z.string().min(1, 'Recipient WhatsApp number is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  message: z.string().optional(),
  dueDate: z.string().optional(),
  friendNetworkId: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = paymentRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { to, amount, currency, message, dueDate, friendNetworkId } = validationResult.data;

    // Get sender information
    const [sender] = await db.select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Verify friend network relationship if provided
    if (friendNetworkId) {
      const [friendship] = await db.select()
        .from(friendNetworks)
        .where(
          and(
            eq(friendNetworks.id, friendNetworkId),
            eq(friendNetworks.senderId, currentUser.id)
          )
        )
        .limit(1);

      if (!friendship) {
        return NextResponse.json(
          { error: 'Friend network relationship not found' },
          { status: 404 }
        );
      }

      // Check monthly limits
      const monthlyLimit = parseFloat(friendship.monthlyLimit);
      const totalSent = parseFloat(friendship.totalSent);

      if (totalSent + amount > monthlyLimit) {
        return NextResponse.json(
          { 
            error: 'Monthly limit exceeded',
            details: {
              monthlyLimit,
              totalSent,
              requestedAmount: amount,
              remainingLimit: monthlyLimit - totalSent
            }
          },
          { status: 400 }
        );
      }
    }

    // Send WhatsApp payment request
    const whatsappResult = await whatsappService.sendPaymentRequest({
      to,
      amount,
      currency,
      senderName: sender.fullName,
      message,
      dueDate,
    });

    if (!whatsappResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to send WhatsApp message',
          details: whatsappResult.error 
        },
        { status: 500 }
      );
    }

    // Track analytics
    console.log('[WhatsApp Payment Request] Sent successfully:', {
      userId: currentUser.id,
      amount,
      currency,
      recipient: to,
      messageId: whatsappResult.messageId,
    });

    return NextResponse.json({
      success: true,
      messageId: whatsappResult.messageId,
      message: 'Payment request sent successfully via WhatsApp',
    });

  } catch (error) {
    console.error('[WhatsApp Payment Request] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get payment request status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get payment session details
    const session = await db.query.whatsappPaymentSessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.id, sessionId),
      with: {
        conversation: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: session.sessionStatus,
        paymentIntent: JSON.parse(session.paymentIntent),
        expiresAt: session.expiresAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
      },
    });

  } catch (error) {
    console.error('[WhatsApp Payment Request] Get Status Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
