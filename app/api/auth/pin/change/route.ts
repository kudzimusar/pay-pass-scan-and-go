import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { ensureSeeded, getUserById, updateUser } from "@/app/api/_lib/storage"
import { verifyAuthHeader } from "@/app/api/_lib/auth"

export async function POST(req: Request) {
  try {
    await ensureSeeded()
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user" || !auth.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
    }

    const { currentPin, newPin } = body || {}
    if (!currentPin || !newPin || String(newPin).length < 4) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
    }

    const user = await getUserById(auth.userId)
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    const ok = await bcrypt.compare(currentPin, user.pin)
    if (!ok) return NextResponse.json({ success: false, error: "Incorrect current PIN" }, { status: 400 })

    const pin = await bcrypt.hash(newPin, 10)
    const updated = await updateUser(user.id, { pin })
    if (!updated) return NextResponse.json({ success: false, error: "Failed to update PIN" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
