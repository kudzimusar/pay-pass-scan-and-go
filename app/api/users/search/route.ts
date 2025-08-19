import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { userSearchSchema } from "../../_lib/schema"

export async function GET(req: Request) {
  try {
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const query = url.searchParams.get("q") || ""

    const validation = userSearchSchema.safeParse({ query })
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid search query" }, { status: 400 })
    }

    const users = await storage.searchUsers(query, auth.userId) // Exclude current user

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        // Don't expose sensitive information
      })),
    })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
