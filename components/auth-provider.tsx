"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  fullName: string
  phone: string
  email?: string
  walletBalance: number
  biometricEnabled?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, userData: User) => void
  signup: (fullName: string, phone: string, pin: string, biometricEnabled?: boolean) => Promise<void>
  logout: () => void
  refreshUserData: () => Promise<void>
  updateBalance: (newBalance: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token")
        const storedUser = localStorage.getItem("user_data")

        console.log("Initializing auth - Token exists:", !!storedToken, "User exists:", !!storedUser)

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser)
          console.log("Restored user from storage:", userData.fullName)
          setToken(storedToken)
          setUser(userData)

          // Refresh user data from server
          await refreshUserDataInternal(storedToken)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        // Clear invalid data
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Auto-sync balance every 30 seconds
  useEffect(() => {
    if (!token || !user) return

    const interval = setInterval(() => {
      refreshUserDataInternal(token)
    }, 30000)

    return () => clearInterval(interval)
  }, [token, user])

  // Sync when page becomes visible
  useEffect(() => {
    if (!token || !user) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshUserDataInternal(token)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [token, user])

  const refreshUserDataInternal = async (authToken: string) => {
    try {
      console.log("Refreshing user data...")
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log("User data refreshed:", data.user.fullName, "Balance:", data.user.walletBalance)
          setUser(data.user)
          localStorage.setItem("user_data", JSON.stringify(data.user))
        }
      } else {
        console.log("Failed to refresh user data, status:", response.status)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const login = useCallback((authToken: string, userData: User) => {
    console.log("AuthProvider login called for:", userData.fullName)
    setToken(authToken)
    setUser(userData)
    localStorage.setItem("auth_token", authToken)
    localStorage.setItem("user_data", JSON.stringify(userData))
  }, [])

  const signup = useCallback(
    async (fullName: string, phone: string, pin: string, biometricEnabled = false) => {
      console.log("AuthProvider signup called for:", fullName, phone)

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            phone,
            pin,
            biometricEnabled,
          }),
        })

        const data = await response.json()
        console.log("Signup response:", data)

        if (!response.ok) {
          throw new Error(data.error || "Signup failed")
        }

        if (data.user && data.token) {
          console.log("Signup successful, logging in user:", data.user.fullName)
          login(data.token, data.user)
        } else {
          throw new Error("Invalid signup response")
        }
      } catch (error) {
        console.error("Signup error:", error)
        throw error
      }
    },
    [login],
  )

  const logout = useCallback(() => {
    console.log("Logging out user")
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    router.push("/")
  }, [router])

  const refreshUserData = useCallback(async () => {
    if (token) {
      await refreshUserDataInternal(token)
    }
  }, [token])

  const updateBalance = useCallback(
    (newBalance: number) => {
      if (user) {
        const updatedUser = { ...user, walletBalance: newBalance }
        setUser(updatedUser)
        localStorage.setItem("user_data", JSON.stringify(updatedUser))
        console.log("Balance updated to:", newBalance)
      }
    },
    [user],
  )

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    refreshUserData,
    updateBalance,
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
