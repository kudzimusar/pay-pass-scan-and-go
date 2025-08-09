import { NextRequest, NextResponse } from "next/server";
import { db, normalizePhoneNumber } from "../../_lib/db";
import { comparePin, signToken } from "../../_lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhoneNumber(body.phone || "");
    const user = db.getUserByPhone(phone);
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const ok = await comparePin(body.pin || "", user.pinHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const token = signToken({ type: "user", userId: user.id, phone: user.phone });
    const { pinHash: _drop, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, token });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
