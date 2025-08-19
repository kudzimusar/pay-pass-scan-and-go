"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  QrCode,
  CreditCard,
  Settings,
  Send,
  Receipt,
  Wallet,
  TrendingUp,
  Clock,
  Bus,
  Zap,
  HandCoins,
  Bell,
} from "lucide-react"

interface WalletData {
  balance_usd: number
  balance_zwl: number
  currency: "USD" | "ZWL"
}

interface Transaction {
  id: string
  type: "transport" | "topup" | "transfer"
  amount: number
  currency: "USD" | "ZWL"
  description: string
  timestamp: string
  status: "completed" | "pending" | "failed"
}

export default function DashboardPage() {
  const [walletData, setWalletData] = useState<WalletData>({
    balance_usd: 25.5,
    balance_zwl: 850.0,
    currency: "USD",
  })

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "transport",
      amount: 2.5,
      currency: "USD",
      description: "Bus Fare - Harare CBD to Avondale",
      timestamp: "2025-01-17T10:30:00Z",
      status: "completed",
    },
    {
      id: "2",
      type: "topup",
      amount: 20.0,
      currency: "USD",
      description: "Wallet Top-up via EcoCash",
      timestamp: "2025-01-17T08:15:00Z",
      status: "completed",
    },
    {
      id: "3",
      type: "transport",
      amount: 1.75,
      currency: "USD",
      description: "Bus Fare - Avondale to Borrowdale",
      timestamp: "2025-01-16T17:45:00Z",
      status: "completed",
    },
  ])

  const [pendingRequests, setPendingRequests] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading wallet data and pending requests
    const timer = setTimeout(() => {
      setPendingRequests(2) // Mock pending requests count
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-ZW", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-ZW", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "transport":
        return <Bus className="w-4 h-4" />
      case "topup":
        return <TrendingUp className="w-4 h-4" />
      case "transfer":
        return <Send className="w-4 h-4" />
      default:
        return <Receipt className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">PayPass</h1>
              <p className="text-blue-100">Welcome back!</p>
            </div>
            <div className="flex items-center space-x-2">
              {pendingRequests > 0 && (
                <Link href="/payment-requests">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 relative">
                    <Bell className="w-6 h-6" />
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center p-0">
                      {pendingRequests}
                    </Badge>
                  </Button>
                </Link>
              )}
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="w-6 h-6" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Wallet Balance */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">Wallet Balance</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {walletData.currency}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">{formatCurrency(walletData.balance_usd, "USD")}</div>
                <div className="text-sm text-blue-100">≈ {formatCurrency(walletData.balance_zwl, "ZWL")}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link href="/unified-scanner">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <QrCode className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Scan & Go</h3>
                  <p className="text-xs text-gray-600 mt-1">Universal payment scanner</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/top-up">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Top Up</h3>
                  <p className="text-xs text-gray-600 mt-1">Add money to wallet</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/request-money">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <HandCoins className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Request Money</h3>
                  <p className="text-xs text-gray-600 mt-1">Send payment requests</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pay-bills">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <Receipt className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Pay Bills</h3>
                  <p className="text-xs text-gray-600 mt-1">Utilities & services</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Pending Requests Alert */}
          {pendingRequests > 0 && (
            <Link href="/payment-requests">
              <Card className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Payment Requests</h3>
                      <p className="text-sm text-yellow-100">
                        You have {pendingRequests} pending request{pendingRequests > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">{pendingRequests}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* New Features Banner */}
          <Card className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">New: Request-to-Pay</h3>
                  <p className="text-sm text-indigo-100">Send payment requests instantly</p>
                </div>
                <Link href="/request-money">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    Try Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "transport"
                          ? "bg-blue-100 text-blue-600"
                          : transaction.type === "topup"
                            ? "bg-green-100 text-green-600"
                            : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatTime(transaction.timestamp)}</span>
                        <Badge
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${transaction.type === "topup" ? "text-green-600" : "text-gray-900"}`}
                      >
                        {transaction.type === "topup" ? "+" : "-"}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Status */}
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">All systems operational</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Request-to-Pay and all payment systems ready</p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation Spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
