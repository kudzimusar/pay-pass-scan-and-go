"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type User = {
  id: string
  name: string
  phone: string
  balance: number
  role: "user" | "operator" | "admin"
}

type AuthContextType = {
  token: string | null
  user: User | null
  isLoading: boolean
  login: (phone: string, pin: string) => Promise<boolean>
  signup: (name: string, phone: string, pin: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo data with proper balance values
const DEMO_USERS = [
  {
    id: "1",
    name: "John Doe",
    phone: "+263772630634",
    pin: "1234",
    balance: 250.75,
    role: "user" as const,
  },
  {
    id: "2",
    name: "Transport Co",
    phone: "+263773456789",
    pin: "9876",
    balance: 1500.0,
    role: "operator" as const,
  },
  {
    id: "3",
    name: "Admin User",
    phone: "+263775678901",
    pin: "0000",
    balance: 5000.0,
    role: "admin" as const,
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Ensure balance is a number
        if (parsedUser && typeof parsedUser.balance !== "number") {
          parsedUser.balance = 0
        }
        setToken(storedToken)
        setUser(parsedUser)
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
  }, [])

  const login = async (phone: string, pin: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const cleanPhone = phone.replace(/\s/g, "")
      const demoUser = DEMO_USERS.find((u) => u.phone === cleanPhone && u.pin === pin)

      if (!demoUser) {
        return false
      }

      const userData: User = {
        id: demoUser.id,
        name: demoUser.name,
        phone: demoUser.phone,
        balance: demoUser.balance || 0, // Ensure balance is always a number
        role: demoUser.role,
      }

      const demoToken = `demo_token_${Date.now()}`

      setToken(demoToken)
      setUser(userData)
      localStorage.setItem("token", demoToken)
      localStorage.setItem("user", JSON.stringify(userData))

      return true
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, phone: string, pin: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const userData: User = {
        id: Date.now().toString(),
        name,
        phone,
        balance: 0, // Default balance for new users
        role: "user" as const,
      }

      const demoToken = `demo_token_${Date.now()}`

      setToken(demoToken)
      setUser(userData)
      localStorage.setItem("token", demoToken)
      localStorage.setItem("user", JSON.stringify(userData))

      return true
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  const value = useMemo(() => ({ token, user, isLoading, login, signup, logout }), [token, user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
