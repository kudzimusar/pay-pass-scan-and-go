import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/drizzle";
import { identityVerifications, users } from "../../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user and their verification status
    const [user, verifications] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db
        .select()
        .from(identityVerifications)
        .where(eq(identityVerifications.userId, userId))
        .orderBy(desc(identityVerifications.createdAt)),
    ]);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const latestVerification = verifications.length > 0 ? verifications[0] : null;

    return NextResponse.json({
      success: true,
      user: {
        id: user[0].id,
        kycStatus: user[0].kycStatus,
        isInternational: user[0].isInternational,
        countryCode: user[0].countryCode,
      },
      verification: latestVerification
        ? {
            id: latestVerification.id,
            documentType: latestVerification.documentType,
            status: latestVerification.status,
            verificationMethod: latestVerification.verificationMethod,
            verificationNotes: latestVerification.verificationNotes,
            createdAt: latestVerification.createdAt,
            verifiedAt: latestVerification.verifiedAt,
          }
        : null,
      verificationHistory: verifications.map((v) => ({
        id: v.id,
        documentType: v.documentType,
        status: v.status,
        createdAt: v.createdAt,
        verifiedAt: v.verifiedAt,
      })),
    });
  } catch (error) {
    console.error("Identity status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve identity verification status" },
      { status: 500 }
    );
  }
}