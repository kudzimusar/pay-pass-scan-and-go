"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ArrowLeft, User, Settings, Shield } from "lucide-react"

const demoAccounts = [
  {
    role: "User",
    phone: "+263 772630634",
    pin: "1234",
    name: "John Doe",
    description: "Regular user account with wallet features",
    icon: User,
    color: "bg-blue-500",
    balance: "$125.50",
  },
  {
    role: "Operator",
    phone: "+263 773456789",
    pin: "9876",
    name: "Sarah Wilson",
    description: "Transport operator with route management",
    icon: Settings,
    color: "bg-emerald-500",
    routes: "3 Active Routes",
  },
  {
    role: "Admin",
    phone: "+263 775678901",
    pin: "0000",
    name: "Admin User",
    description: "System administrator with full access",
    icon: Shield,
    color: "bg-purple-500",
    permissions: "Full Access",
  },
]

export default function DemoCredentialsPage() {
  const router = useRouter()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-paypass text-white px-6 py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/20 mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Demo Credentials</h1>
        </div>
        <p className="text-white/80">Test accounts for exploring PayPass features</p>
      </div>

      {/* Demo Accounts */}
      <div className="px-6 py-8 space-y-6">
        {demoAccounts.map((account, index) => {
          const IconComponent = account.icon
          return (
            <Card key={index} className="paypass-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${account.color} p-2 rounded-lg`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {account.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">{account.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Phone Number */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    <p className="text-lg font-mono">{account.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.phone, `phone-${index}`)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {copiedField === `phone-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {/* PIN */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">PIN</p>
                    <p className="text-lg font-mono">{account.pin}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.pin, `pin-${index}`)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {copiedField === `pin-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Additional Info */}
                {account.balance && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Wallet Balance</p>
                    <p className="text-lg font-semibold text-green-800">{account.balance}</p>
                  </div>
                )}

                {account.routes && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm font-medium text-emerald-700">Routes</p>
                    <p className="text-lg font-semibold text-emerald-800">{account.routes}</p>
                  </div>
                )}

                {account.permissions && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">Access Level</p>
                    <p className="text-lg font-semibold text-purple-800">{account.permissions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Instructions */}
        <Card className="paypass-card-gradient">
          <CardHeader>
            <CardTitle className="text-gradient-paypass">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold px-1">1</span>
              </div>
              <p className="text-sm text-gray-700">Copy the phone number and PIN from any account above</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold px-1">2</span>
              </div>
              <p className="text-sm text-gray-700">Return to the login page and paste the credentials</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold px-1">3</span>
              </div>
              <p className="text-sm text-gray-700">Sign in to explore the features for that user type</p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Login Button */}
        <Button onClick={() => router.push("/")} className="paypass-btn-primary">
          Back to Login
        </Button>
      </div>
    </div>
  )
}
