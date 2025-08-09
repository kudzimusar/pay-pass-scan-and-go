"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiPost } from "@/lib/api"

type User = {
  id: string
  fullName: string
  phone: string
  email?: string
  biometricEnabled?: boolean
  createdAt: string
  updatedAt: string
}

type Operator = {
  id: string
  companyName: string
  phone: string
  email?: string
  createdAt: string
  updatedAt: string
}

type AuthContextType = {
  token: string | null
  user: User | null
  operator: Operator | null
  login: (phone: string, pin: string) => Promise<void>
  register: (input: { fullName: string; phone: string; email?: string; pin: string; biometricEnabled?: boolean }) => Promise<void>
  loginOperator: (phone: string, pin: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  operator: null,
  login: async () => {},
  register: async () => {},
  loginOperator: async () => {},
  logout: () => {},
})

const TOKEN_KEY = "pp_token"
const ROLE_KEY = "pp_role"
const USER_KEY = "pp_user"
const OP_KEY = "pp_operator"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    const role = localStorage.getItem(ROLE_KEY)
    if (t) setToken(t)
    if (role === "user") {
      const u = localStorage.getItem(USER_KEY)
      if (u) setUser(JSON.parse(u))
    } else if (role === "operator") {
      const o = localStorage.getItem(OP_KEY)
      if (o) setOperator(JSON.parse(o))
    }
  }, [])

  const login = async (phone: string, pin: string) => {
    const res = await apiPost<{ user: User; token: string }>("/api/auth/login", { phone, pin })
    setToken(res.token)
    setUser(res.user)
    setOperator(null)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(ROLE_KEY, "user")
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    localStorage.removeItem(OP_KEY)
  }

  const register = async (input: { fullName: string; phone: string; email?: string; pin: string; biometricEnabled?: boolean }) => {
    const res = await apiPost<{ user: User; token: string }>("/api/auth/register", input)
    setToken(res.token)
    setUser(res.user)
    setOperator(null)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(ROLE_KEY, "user")
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    localStorage.removeItem(OP_KEY)
  }

  const loginOperator = async (phone: string, pin: string) => {
    const res = await apiPost<{ operator: Operator; token: string }>("/api/auth/operator/login", { phone, pin })
    setToken(res.token)
    setOperator(res.operator)
    setUser(null)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(ROLE_KEY, "operator")
    localStorage.setItem(OP_KEY, JSON.stringify(res.operator))
    localStorage.removeItem(USER_KEY)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setOperator(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(OP_KEY)
  }

  const value = useMemo(
    () => ({ token, user, operator, login, register, loginOperator, logout }),
    [token, user, operator]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
