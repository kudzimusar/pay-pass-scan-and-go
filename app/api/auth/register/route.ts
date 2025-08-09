import { NextRequest, NextResponse } from "next/server";
import { db, normalizePhoneNumber } from "../../_lib/db";
import { hashPin, signToken, persistUserToNeon } from "../../_lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhoneNumber(body.phone || "");
    if (!body.fullName || !body.pin) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    if (db.getUserByPhone(phone)) {
      return NextResponse.json(
        { error: "User with this phone number already exists" },
        { status: 400 }
      );
    }
    const pinHash = await hashPin(body.pin);
    const user = db.createUser({
      fullName: body.fullName,
      phone,
      email: body.email,
      pinHash,
      biometricEnabled: !!body.biometricEnabled,
    });
    // optional persistence
    await persistUserToNeon(user);
    const token = signToken({ type: "user", userId: user.id, phone: user.phone });
    const { pinHash: _drop, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, token });
  } catch (e) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  }
}
