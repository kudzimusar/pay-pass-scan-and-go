import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { friendNetworks, users } from "../../../../shared/schema";
import { eq, and } from "drizzle-orm";

const addFriendSchema = z.object({
  senderId: z.string().uuid("Invalid sender ID"),
  recipientPhone: z.string().min(9, "Invalid phone number"),
  relationship: z.enum(["family", "friend", "business"]),
  nickname: z.string().optional(),
  monthlyLimit: z.number().min(1).max(10000).default(5000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, recipientPhone, relationship, nickname, monthlyLimit } = addFriendSchema.parse(body);

    // Verify sender exists and is international user
    const sender = await db
      .select()
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    if (!sender.length) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    if (!sender[0].isInternational) {
      return NextResponse.json(
        { error: "Only international users can add friends for cross-border payments" },
        { status: 403 }
      );
    }

    // Find recipient by phone
    const recipient = await db
      .select()
      .from(users)
      .where(eq(users.phone, recipientPhone))
      .limit(1);

    if (!recipient.length) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendNetworks)
      .where(
        and(
          eq(friendNetworks.senderId, senderId),
          eq(friendNetworks.recipientId, recipient[0].id)
        )
      )
      .limit(1);

    if (existingFriendship.length > 0) {
      return NextResponse.json(
        { error: "Friend connection already exists" },
        { status: 409 }
      );
    }

    // Create friend network connection
    const newFriendConnection = await db
      .insert(friendNetworks)
      .values({
        senderId,
        recipientId: recipient[0].id,
        relationship,
        nickname: nickname || recipient[0].fullName,
        monthlyLimit: monthlyLimit.toString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      friendNetwork: {
        ...newFriendConnection[0],
        recipient: {
          id: recipient[0].id,
          fullName: recipient[0].fullName,
          phone: recipient[0].phone,
        },
      },
    });
  } catch (error) {
    console.error("Add friend error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add friend connection" },
      { status: 500 }
    );
  }
}