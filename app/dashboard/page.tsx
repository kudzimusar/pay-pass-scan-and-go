"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye,
  EyeOff,
  QrCode,
  Send,
  Plus,
  Receipt,
  Settings,
  Home,
  History,
  User,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showBalance, setShowBalance] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  // Ensure balance is a number with fallback
  const userBalance = typeof user.balance === "number" ? user.balance : 0

  const demoTransactions = [
    {
      id: "1",
      type: "payment",
      description: "Bus Fare - Route 1A",
      amount: -2.5,
      date: "2024-01-15T10:30:00Z",
      status: "completed",
    },
    {
      id: "2",
      type: "topup",
      description: "Wallet Top-up",
      amount: 50.0,
      date: "2024-01-14T15:45:00Z",
      status: "completed",
    },
    {
      id: "3",
      type: "payment",
      description: "Grocery Store",
      amount: -15.75,
      date: "2024-01-14T12:20:00Z",
      status: "completed",
    },
    {
      id: "4",
      type: "receive",
      description: "From John Smith",
      amount: 25.0,
      date: "2024-01-13T09:15:00Z",
      status: "completed",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-blue-100">{user.name}</p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Wallet Balance</h2>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold">{showBalance ? `$${userBalance.toFixed(2)}` : "••••••"}</span>
            </div>
            <p className="text-blue-100 text-sm">Available Balance</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/qr-scanner"
              className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <QrCode className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Scan QR</span>
            </Link>
            <Link
              href="/send-money"
              className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              <Send className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Send Money</span>
            </Link>
            <Link
              href="/top-up"
              className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <Plus className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Top Up</span>
            </Link>
            <Link
              href="/pay-bills"
              className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <Receipt className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Pay Bills</span>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="px-6 pb-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Link href="/transactions" className="text-blue-600 text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {demoTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      transaction.type === "payment"
                        ? "bg-red-100"
                        : transaction.type === "topup"
                          ? "bg-green-100"
                          : transaction.type === "receive"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                    }`}
                  >
                    {transaction.type === "payment" ? (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    ) : transaction.type === "topup" ? (
                      <Plus className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center py-2 px-3 text-blue-600">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Link>
            <Link href="/qr-scanner" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <QrCode className="w-5 h-5 mb-1" />
              <span className="text-xs">Scan</span>
            </Link>
            <Link
              href="/transactions"
              className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600"
            >
              <History className="w-5 h-5 mb-1" />
              <span className="text-xs">History</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
