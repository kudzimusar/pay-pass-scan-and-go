"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  EyeOff,
  QrCode,
  Send,
  CreditCard,
  Plus,
  History,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [balance, setBalance] = useState({ usd: 125.5, zwl: 45000 })
  const [transactions, setTransactions] = useState([
    {
      id: "1",
      type: "received",
      amount: 25.0,
      currency: "USD",
      description: "Payment from John Doe",
      timestamp: "2024-01-15T10:30:00Z",
      status: "completed",
    },
    {
      id: "2",
      type: "sent",
      amount: 15.5,
      currency: "USD",
      description: "Bus fare - Route 1A",
      timestamp: "2024-01-15T08:15:00Z",
      status: "completed",
    },
    {
      id: "3",
      type: "topup",
      amount: 50.0,
      currency: "USD",
      description: "EcoCash top-up",
      timestamp: "2024-01-14T16:45:00Z",
      status: "completed",
    },
  ])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      // Demo user data
      setUser({
        name: "John Doe",
        phone: "+263 772630634",
        accountType: "Personal",
      })
    }
  }, [])

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    } else {
      return `ZWL ${amount.toLocaleString()}`
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "received":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "sent":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "topup":
        return <Plus className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const quickActions = [
    {
      title: "Scan QR",
      description: "Pay with QR code",
      icon: QrCode,
      color: "bg-blue-500",
      action: () => router.push("/qr-scanner"),
    },
    {
      title: "Send Money",
      description: "Transfer to contacts",
      icon: Send,
      color: "bg-emerald-500",
      action: () => router.push("/send-money"),
    },
    {
      title: "Pay Bills",
      description: "Utilities & services",
      icon: CreditCard,
      color: "bg-purple-500",
      action: () => router.push("/pay-bills"),
    },
    {
      title: "Top Up",
      description: "Add money to wallet",
      icon: Plus,
      color: "bg-orange-500",
      action: () => router.push("/top-up"),
    },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="paypass-logo mx-auto mb-4">
            <div className="paypass-logo-square bg-gray-300"></div>
            <div className="paypass-logo-square bg-gray-300"></div>
            <div className="paypass-logo-square bg-gray-300"></div>
            <div className="paypass-logo-square bg-gray-300"></div>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-paypass text-white px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back,</h1>
            <p className="text-white/80 text-lg">{user.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
            className="text-white hover:bg-white/20"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Wallet Balance</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:bg-white/20"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/80">USD</span>
                <span className="text-2xl font-bold">{showBalance ? formatCurrency(balance.usd, "USD") : "••••"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">ZWL</span>
                <span className="text-xl font-semibold">
                  {showBalance ? formatCurrency(balance.zwl, "ZWL") : "••••"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon
            return (
              <Card key={index} className="paypass-card cursor-pointer" onClick={action.action}>
                <CardContent className="p-4 text-center">
                  <div className={`${action.color} p-3 rounded-xl mx-auto mb-3 w-fit`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Transactions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/transactions")}
            className="text-blue-600 hover:text-blue-700"
          >
            <History className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="paypass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">{getTransactionIcon(transaction.type)}</div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "received"
                          ? "text-green-600"
                          : transaction.type === "sent"
                            ? "text-red-600"
                            : "text-blue-600"
                      }`}
                    >
                      {transaction.type === "sent" ? "-" : "+"}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Account Info */}
        <Card className="paypass-card-gradient mt-8">
          <CardHeader>
            <CardTitle className="text-gradient-paypass">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Phone Number</span>
              <span className="font-medium">{user.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Type</span>
              <Badge variant="secondary">{user.accountType || "Personal"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
