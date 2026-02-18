/**
 * WhatsApp Contacts Sync API
 * Synchronize user's WhatsApp contacts with PayPass friend network
 * Enhances "Pay for your Friend" feature with WhatsApp integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import WhatsAppService from '../../../_lib/whatsapp-service';
import { getAuthFromRequest } from '../../../_lib/auth';
import { storage } from '../../../_lib/storage';
import { users, friendNetworks, whatsappContacts } from '../../../../../shared/schema';
import { db } from '../../../_lib/drizzle';
import { eq, and } from 'drizzle-orm';

const whatsappService = new WhatsAppService();

// Contact sync schema
const contactSyncSchema = z.object({
  contacts: z.array(z.object({
    number: z.string().min(1, 'Phone number is required'),
    name: z.string().min(1, 'Contact name is required'),
    isWhatsAppUser: z.boolean().default(true),
  })),
  autoCreateFriendNetwork: z.boolean().default(false),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authUser = getAuthFromRequest(request);
    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = { ...authUser, id: authUser.userId };

    // Parse and validate request body
    const body = await request.json();
    const validationResult = contactSyncSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { contacts, autoCreateFriendNetwork } = validationResult.data;

    // Sync WhatsApp contacts
    await whatsappService.syncUserContacts(
      currentUser.id,
      contacts.map(c => ({ number: c.number, name: c.name }))
    );

    let friendNetworksCreated = 0;
    const errors: string[] = [];

    // Auto-create friend networks if requested
    if (autoCreateFriendNetwork) {
      for (const contact of contacts) {
        try {
          // Check if recipient exists in our system
          const [recipient] = await db.select()
            .from(users)
            .where(eq(users.phone, contact.number))
            .limit(1);

          if (recipient && recipient.id !== currentUser.id) {
            // Check if friend network already exists
            const [existingFriendship] = await db.select()
              .from(friendNetworks)
              .where(
                and(
                  eq(friendNetworks.senderId, currentUser.id),
                  eq(friendNetworks.recipientId, recipient.id)
                )
              )
              .limit(1);

            if (!existingFriendship) {
              // Create friend network
              await db.insert(friendNetworks).values({
                senderId: currentUser.id,
                recipientId: recipient.id,
                relationship: 'friend',
                nickname: contact.name,
                isVerified: true, // Verified through WhatsApp contact
                monthlyLimit: "1000.00", // Default limit
                totalSent: "0.00",
              });

              friendNetworksCreated++;
            }
          }
        } catch (error) {
          console.error('[WhatsApp Contacts Sync] Friend network creation error:', error);
          errors.push(`Failed to create friend network for ${contact.name}`);
        }
      }
    }

    // Get updated contacts list
    const syncedContacts = await whatsappService.getUserContacts(currentUser.id);

    return NextResponse.json({
      success: true,
      message: 'Contacts synchronized successfully',
      stats: {
        totalContacts: contacts.length,
        syncedContacts: syncedContacts.length,
        friendNetworksCreated,
        errors,
      },
      contacts: syncedContacts,
    });

  } catch (error) {
    console.error('[WhatsApp Contacts Sync] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get user's synchronized WhatsApp contacts
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authUser = getAuthFromRequest(request);
    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = { ...authUser, id: authUser.userId };

    // Get user's WhatsApp contacts
    const contacts = await whatsappService.getUserContacts(currentUser.id);

    // Get associated friend networks
    const friendNetworksData = await db.query.friendNetworks.findMany({
      where: (networks, { eq }) => eq(networks.senderId, currentUser.id),
      with: {
        recipient: {
          columns: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Merge contacts with friend network data
    const enrichedContacts = contacts.map(contact => {
      const friendNetwork = friendNetworksData.find(
        fn => fn.recipient.phone === contact.whatsappNumber
      );

      return {
        id: contact.id,
        whatsappNumber: contact.whatsappNumber,
        displayName: contact.displayName,
        isVerified: contact.isVerified,
        trustScore: contact.trustScore,
        friendNetwork: friendNetwork ? {
          id: friendNetwork.id,
          relationship: friendNetwork.relationship,
          nickname: friendNetwork.nickname,
          monthlyLimit: friendNetwork.monthlyLimit,
          totalSent: friendNetwork.totalSent,
          isVerified: friendNetwork.isVerified,
        } : null,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      contacts: enrichedContacts,
    });

  } catch (error) {
    console.error('[WhatsApp Contacts Get] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove synchronized contacts
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authUser = getAuthFromRequest(request);
    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = { ...authUser, id: authUser.userId };
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (contactId) {
      // Delete specific contact
      await db.delete(whatsappContacts)
        .where(
          and(
            eq(whatsappContacts.id, contactId),
            eq(whatsappContacts.userId, currentUser.id)
          )
        );

      return NextResponse.json({
        success: true,
        message: 'Contact removed successfully',
      });
    } else {
      // Delete all contacts for user
      await db.delete(whatsappContacts)
        .where(eq(whatsappContacts.userId, currentUser.id));

      return NextResponse.json({
        success: true,
        message: 'All contacts removed successfully',
      });
    }

  } catch (error) {
    console.error('[WhatsApp Contacts Delete] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
