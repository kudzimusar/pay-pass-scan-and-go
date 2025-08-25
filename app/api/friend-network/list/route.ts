import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/drizzle";
import { friendNetworks, users } from "../../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const senderId = searchParams.get("senderId");

    if (!senderId) {
      return NextResponse.json({ error: "Sender ID is required" }, { status: 400 });
    }

    // Get all friend connections for the user with recipient details
    const friendConnections = await db
      .select({
        id: friendNetworks.id,
        relationship: friendNetworks.relationship,
        nickname: friendNetworks.nickname,
        isVerified: friendNetworks.isVerified,
        monthlyLimit: friendNetworks.monthlyLimit,
        totalSent: friendNetworks.totalSent,
        lastPaymentAt: friendNetworks.lastPaymentAt,
        createdAt: friendNetworks.createdAt,
        recipient: {
          id: users.id,
          fullName: users.fullName,
          phone: users.phone,
          countryCode: users.countryCode,
        },
      })
      .from(friendNetworks)
      .innerJoin(users, eq(friendNetworks.recipientId, users.id))
      .where(eq(friendNetworks.senderId, senderId))
      .orderBy(desc(friendNetworks.lastPaymentAt), desc(friendNetworks.createdAt));

    return NextResponse.json({
      success: true,
      friends: friendConnections,
      count: friendConnections.length,
    });
  } catch (error) {
    console.error("List friends error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve friend connections" },
      { status: 500 }
    );
  }
}