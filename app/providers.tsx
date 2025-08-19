"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/components/auth-provider"

interface User {
  id: string
  phone: string
  name: string
  role: "user" | "operator" | "admin"
  balance: number
}

interface AuthContextType {
  user: User | null
  login: (phone: string, pin: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const demoUsers = [
  {
    id: "1",
    phone: "+263772630634",
    pin: "1234",
    name: "John Doe",
    role: "user" as const,
    balance: 250.75,
  },
  {
    id: "2",
    phone: "+263773456789",
    pin: "9876",
    name: "Transport Operator",
    role: "operator" as const,
    balance: 1500.0,
  },
  {
    id: "3",
    phone: "+263775678901",
    pin: "0000",
    name: "System Admin",
    role: "admin" as const,
    balance: 5000.0,
  },
]

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
