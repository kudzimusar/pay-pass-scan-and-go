"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiPost } from "@/lib/api"

type User = { id: string; name: string; phone: string }
type Operator = { id: string; name: string; phone: string }

type AuthContextType = {
  token: string | null
  user: User | null
  operator: Operator | null
  login: (phone: string, pin: string) => Promise<void>
  signup: (name: string, phone: string, pin: string) => Promise<void>
  operatorLogin: (phone: string, pin: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)

  useEffect(() => {
    const t = localStorage.getItem("pp_token")
    const u = localStorage.getItem("pp_user")
    const o = localStorage.getItem("pp_operator")
    if (t) setToken(t)
    if (u) setUser(JSON.parse(u))
    if (o) setOperator(JSON.parse(o))
  }, [])

  const login = async (phone: string, pin: string) => {
    const res = await apiPost<{ user: User; token: string }>("/api/auth/login", { phone, pin })
    setToken(res.token)
    setUser(res.user)
    setOperator(null)
    localStorage.setItem("pp_token", res.token)
    localStorage.setItem("pp_user", JSON.stringify(res.user))
    localStorage.removeItem("pp_operator")
  }

  const signup = async (name: string, phone: string, pin: string) => {
    const res = await apiPost<{ user: User; token: string }>("/api/auth/register", { name, phone, pin })
    setToken(res.token)
    setUser(res.user)
    setOperator(null)
    localStorage.setItem("pp_token", res.token)
    localStorage.setItem("pp_user", JSON.stringify(res.user))
    localStorage.removeItem("pp_operator")
  }

  const operatorLogin = async (phone: string, pin: string) => {
    const res = await apiPost<{ operator: Operator; token: string }>("/api/auth/operator/login", { phone, pin })
    setToken(res.token)
    setOperator(res.operator)
    setUser(null)
    localStorage.setItem("pp_token", res.token)
    localStorage.setItem("pp_operator", JSON.stringify(res.operator))
    localStorage.removeItem("pp_user")
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setOperator(null)
    localStorage.removeItem("pp_token")
    localStorage.removeItem("pp_user")
    localStorage.removeItem("pp_operator")
  }

  const value = useMemo(
    () => ({ token, user, operator, login, signup, operatorLogin, logout }),
    [token, user, operator],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
