"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface User {
  id: string
  fullName: string
  email: string
  phone: string
  walletBalance: number
  role: string
}

interface AuthContextType {
  user: User | null
  login: (token: string, userData: User) => void
  logout: () => void
  refreshUserData: () => Promise<void>
  isLoading: boolean
  signup?: (fullName: string, phone: string, pin: string, biometricEnabled?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      console.log("Refreshing user data...")
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.log("Failed to refresh user data, clearing auth")
        localStorage.removeItem("auth_token")
        setUser(null)
        setIsLoading(false)
        return
      }

      const data = await response.json()
      if (data.success && data.user) {
        console.log("User data refreshed:", data.user)
        setUser(data.user)
      } else {
        console.log("Invalid user data response")
        localStorage.removeItem("auth_token")
        setUser(null)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      localStorage.removeItem("auth_token")
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((token: string, userData: User) => {
    console.log("Logging in user:", userData)
    localStorage.setItem("auth_token", token)
    localStorage.setItem("user_data", JSON.stringify(userData))
    setUser(userData)
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    console.log("Logging out user")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    setIsLoading(false)
  }, [])

  const signup = useCallback(
    async (fullName: string, phone: string, pin: string, biometricEnabled?: boolean) => {
      const payload = { fullName, phone, pin, biometricEnabled: !!biometricEnabled }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // Read as text first to avoid JSON parse errors on non-JSON responses
        const text = await res.text()
        try {
          const maybeJson = text.trim().startsWith("{") ? JSON.parse(text) : null
          throw new Error(maybeJson?.error || `Signup failed (${res.status})`)
        } catch (e) {
          // If JSON parsing of error body fails, use raw text
          throw new Error(text || `Signup failed (${res.status})`)
        }
      }

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        const text = await res.text()
        throw new Error(text || "Server returned invalid response format")
      }

      const data = await res.json()
      if (!data?.token || !data?.user) {
        throw new Error(data?.error || "Invalid signup response")
      }

      // Persist and set auth
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("user_data", JSON.stringify(data.user))
      setUser(data.user)
    },
    [],
  )

  // Initial auth check
  useEffect(() => {
    refreshUserData()
  }, [refreshUserData])

  // Auto-refresh user data every 30 seconds to keep balance in sync
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      console.log("Auto-refreshing user data...")
      refreshUserData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, refreshUserData])

  // Refresh when page becomes visible (user returns to app)
  useEffect(() => {
    if (!user) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing user data...")
        refreshUserData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [user, refreshUserData])

  const value = {
    user,
    login,
    logout,
    refreshUserData,
    isLoading,
    signup,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
