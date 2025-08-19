import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, searchUsers } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("User search API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const excludeUserId = searchParams.get("excludeUserId")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
    }

    console.log("Searching for:", query, "excluding:", excludeUserId)

    const users = await searchUsers(query.trim(), excludeUserId || undefined)

    console.log("Found", users.length, "users")

    // Remove sensitive data
    const safeUsers = users.map(({ pin, ...user }) => user)

    return NextResponse.json({
      success: true,
      users: safeUsers,
    })
  } catch (error) {
    console.error("User search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
