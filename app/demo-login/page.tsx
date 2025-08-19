"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, DollarSign, Bell, AlertCircle, CheckCircle, Clock } from "lucide-react"

const demoAccounts = [
  {
    id: "user_1",
    name: "John Doe",
    phone: "+263771234567",
    balance: 50.0,
    description: "Has 2 pending payment requests",
    notifications: 2,
    role: "Primary Test User",
    color: "bg-blue-500",
  },
  {
    id: "user_2",
    name: "Sarah Wilson",
    phone: "+263772345678",
    balance: 125.75,
    description: "Sent request to John for groceries",
    notifications: 0,
    role: "Active Sender",
    color: "bg-green-500",
  },
  {
    id: "user_3",
    name: "Mike Johnson",
    phone: "+263773456789",
    balance: 89.25,
    description: "Sent bus fare request to John",
    notifications: 1,
    role: "Transport User",
    color: "bg-orange-500",
  },
  {
    id: "user_4",
    name: "Emma Davis",
    phone: "+263774567890",
    balance: 203.5,
    description: "Received dinner request from John",
    notifications: 1,
    role: "High Balance User",
    color: "bg-purple-500",
  },
  {
    id: "user_5",
    name: "David Brown",
    phone: "+263775678901",
    balance: 67.8,
    description: "Regular user with transaction history",
    notifications: 0,
    role: "Regular User",
    color: "bg-teal-500",
  },
]

export default function DemoLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleDemoLogin = async (account: (typeof demoAccounts)[0]) => {
    setIsLoading(account.id)
    setError("")

    try {
      console.log("Demo login attempt for:", account.name, account.phone)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: account.phone,
          pin: "1234",
        }),
      })

      console.log("Demo login response status:", response.status)

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()
      console.log("Demo login response data:", data)

      if (response.ok && data.success) {
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user_data", JSON.stringify(data.user))
        console.log("Demo login successful, redirecting to dashboard")
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Demo login error:", error)
      setError("Unable to connect to server. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Demo Accounts</h1>
          </div>
          <p className="text-purple-100 text-sm">Choose an account to test PayPass features</p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Demo Info */}
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm">Demo Features</h3>
                  <ul className="text-xs text-amber-800 mt-1 space-y-1">
                    <li>
                      • All accounts use PIN: <span className="font-mono">1234</span>
                    </li>
                    <li>• Pre-loaded with payment requests</li>
                    <li>• Realistic transaction history</li>
                    <li>• Test Request-to-Pay features</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <div className="space-y-3">
            {demoAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${account.color} rounded-full flex items-center justify-center`}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{account.name}</h3>
                          {account.notifications > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              <Bell className="w-3 h-3 mr-1" />
                              {account.notifications}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{account.role}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <DollarSign className="w-3 h-3 mr-1" />${account.balance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDemoLogin(account)}
                      disabled={isLoading !== null}
                      size="sm"
                      className="min-w-16"
                    >
                      {isLoading === account.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{account.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Test Guide */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900">Quick Test Guide</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-blue-800">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>
                    Login as <strong>John Doe</strong> to see pending requests
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  <span>Test accepting/declining payment requests</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span>Switch accounts to see different perspectives</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to regular login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
