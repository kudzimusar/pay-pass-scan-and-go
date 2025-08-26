"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

// Define User interface
export interface User {
  id: string
  fullName: string
  phone: string
  email?: string
  walletBalance: number
  biometricEnabled: boolean
  joinedDate: Date
  paypassUsername: string
}

// Define AuthContext interface
interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (phone: string, pin: string) => Promise<void>
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

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Login function
  const login = useCallback(async (phone: string, pin: string) => {
    console.log("Login attempt for:", phone)
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      if (data.success && data.user && data.token) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user_data", JSON.stringify(data.user))
        console.log("Login successful for:", data.user.fullName)
        router.push("/dashboard")
      } else {
        throw new Error(data.error || "Invalid login response")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Signup function
  const signup = useCallback(async (fullName: string, phone: string, pin: string, biometricEnabled = false) => {
    console.log("Signup attempt for:", fullName, phone)
    setIsLoading(true)

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

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      if (data.success && data.user && data.token) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user_data", JSON.stringify(data.user))
        console.log("Signup successful for:", data.user.fullName)
        router.push("/dashboard")
      } else {
        throw new Error(data.error || "Invalid signup response")
      }
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    } finally {
    setIsLoading(false)
    }
  }, [router])

  // Logout function
  const logout = useCallback(() => {
    console.log("Logging out user")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    setToken(null)
    setIsLoading(false)
    router.push("/")
  }, [router])

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!token || !user) return

    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
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
  }, [token, user])

  // Update balance function
  const updateBalance = useCallback((newBalance: number) => {
      if (user) {
        const updatedUser = { ...user, walletBalance: newBalance }
        setUser(updatedUser)
        localStorage.setItem("user_data", JSON.stringify(updatedUser))
    }
  }, [user])

  // Auto-refresh user data every 30 seconds
  useEffect(() => {
    if (!token || !user) return

    const interval = setInterval(() => {
      refreshUserData()
    }, 30000)

    return () => clearInterval(interval)
  }, [token, user, refreshUserData])

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