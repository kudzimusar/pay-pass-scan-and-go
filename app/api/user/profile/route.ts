<<<<<<< HEAD
import { NextResponse } from "next/server"
import { ensureSeeded, getUserById } from "../../_lib/storage"
import { verifyToken } from "../../_lib/auth"
=======
import { type NextRequest, NextResponse } from "next/server"
import { getUserById } from "../_lib/storage"
>>>>>>> origin/main

export async function GET(request: NextRequest) {
  try {
    console.log("=== USER PROFILE API CALLED ===")

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header")
      return NextResponse.json(
        {
          success: false,
          error: "Authorization header required",
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    console.log("Token received:", token.substring(0, 20) + "...")

    // Extract user ID from token (simple token format: token_userId_timestamp)
    const tokenParts = token.split("_")
    if (tokenParts.length !== 3 || tokenParts[0] !== "token") {
      console.log("Invalid token format")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token format",
        },
        { status: 401 },
      )
    }

    const userId = tokenParts[1]
    console.log("Extracted user ID from token:", userId)

    // Get user from storage
    const user = await getUserById(userId)
    if (!user) {
      console.log("User not found for ID:", userId)
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    console.log("User profile found:", user.fullName, "Balance:", user.walletBalance)

    // Return user data (excluding PIN)
    const { pin, ...userWithoutPin } = user

    const response = {
      success: true,
<<<<<<< HEAD
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        role: "user",
      },
    })
=======
      user: userWithoutPin,
    }

    console.log("Returning user profile response")
    return NextResponse.json(response)
>>>>>>> origin/main
  } catch (error) {
    console.error("=== USER PROFILE API ERROR ===")
    console.error("Error details:", error)
    console.error("Stack trace:", error.stack)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
