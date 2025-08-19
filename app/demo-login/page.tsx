"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Phone, CreditCard, Bell, CheckCircle } from "lucide-react"

const demoAccounts = [
  {
    id: "user_1",
    name: "John Doe",
    phone: "+263771234567",
    role: "Primary User",
    balance: "$50.00",
    features: ["2 pending requests", "Recent transactions", "Notifications"],
    description: "Main test account with incoming payment requests",
  },
  {
    id: "user_2",
    name: "Sarah Wilson",
    phone: "+263772345678",
    role: "Active User",
    balance: "$75.00",
    features: ["Sent requests", "Biometric enabled", "Transaction history"],
    description: "User who has sent payment requests to John",
  },
  {
    id: "user_3",
    name: "Mike Johnson",
    phone: "+263773456789",
    role: "Regular User",
    balance: "$100.00",
    features: ["Bus payments", "Recent activity", "Wallet top-ups"],
    description: "User focused on transport payments",
  },
  {
    id: "user_4",
    name: "Emma Davis",
    phone: "+263774567890",
    role: "Premium User",
    balance: "$125.00",
    features: ["Utility bills", "Biometric enabled", "High balance"],
    description: "User with utility bill payment requests",
  },
  {
    id: "user_5",
    name: "David Brown",
    phone: "+263775678901",
    role: "Business User",
    balance: "$150.00",
    features: ["Shared rides", "Business payments", "Multiple transactions"],
    description: "User with business-related payment activities",
  },
]

export default function DemoLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleDemoLogin = async (phone: string, name: string) => {
    setIsLoading(phone)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, pin: "1234" }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user_data", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Demo login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Demo Login</h1>
            <p className="text-purple-100">Choose a test account to explore PayPass features</p>
            <Badge className="mt-3 bg-white/20 text-white border-white/30">All accounts use PIN: 1234</Badge>
          </div>
        </div>

        <div className="px-6 py-8">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Demo Accounts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Test Accounts</h2>

            {demoAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <Phone className="w-3 h-3" />
                          <span>{account.phone}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{account.role}</Badge>
                      <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                        <CreditCard className="w-3 h-3" />
                        <span>{account.balance}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{account.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {account.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleDemoLogin(account.phone, account.name)}
                    disabled={isLoading !== null}
                    className="w-full"
                    variant={account.id === "user_1" ? "default" : "outline"}
                  >
                    {isLoading === account.phone ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login as {account.name}
                        {account.id === "user_1" && <Bell className="w-4 h-4 ml-2" />}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instructions */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>1. Start with John Doe</strong> - He has pending payment requests to review
                </p>
                <p>
                  <strong>2. Test Request-to-Pay</strong> - Send requests between different accounts
                </p>
                <p>
                  <strong>3. Switch Perspectives</strong> - Login as different users to see various views
                </p>
                <p>
                  <strong>4. All PINs are 1234</strong> - Use this for any PIN verification
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Demo data resets periodically • All transactions are simulated</p>
          </div>
        </div>
      </div>
    </div>
  )
}
