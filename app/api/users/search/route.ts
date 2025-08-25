import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, searchUsers } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const excludeUserId = searchParams.get("excludeUserId")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      })
    }

    const users = await searchUsers(query.trim(), excludeUserId || undefined)

    // Remove sensitive information
    const safeUsers = users.map(({ pin, ...user }: any) => user)

    return NextResponse.json({
      success: true,
      users: safeUsers,
    })
  } catch (error) {
    console.error("User search API error:", error)
    return NextResponse.json({ success: false, error: "Failed to search users" }, { status: 500 })
  }
}
