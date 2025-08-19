"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Home,
  QrCode,
  History,
  User,
  CheckCircle,
} from "lucide-react"

export default function TopUpPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [topUpStatus, setTopUpStatus] = useState<"idle" | "success" | "error">("idle")

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

  const topUpMethods = [
    {
      id: "card",
      name: "Debit/Credit Card",
      description: "Visa, Mastercard, or local cards",
      icon: CreditCard,
      color: "bg-blue-100 text-blue-600",
      fee: "2.5%",
    },
    {
      id: "mobile",
      name: "Mobile Money",
      description: "EcoCash, OneMoney, Telecash",
      icon: Smartphone,
      color: "bg-green-100 text-green-600",
      fee: "1.5%",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      description: "Direct bank account transfer",
      icon: Building2,
      color: "bg-purple-100 text-purple-600",
      fee: "Free",
    },
    {
      id: "agent",
      name: "PayPass Agent",
      description: "Visit any authorized agent",
      icon: Wallet,
      color: "bg-orange-100 text-orange-600",
      fee: "1.0%",
    },
  ]

  const quickAmounts = [10, 25, 50, 100]

  const handleTopUp = async () => {
    if (!selectedMethod || !amount || Number.parseFloat(amount) <= 0) {
      return
    }

    setIsProcessing(true)

    // Simulate top-up processing
    setTimeout(() => {
      setIsProcessing(false)
      setTopUpStatus("success")
    }, 3000)
  }

  const resetTopUp = () => {
    setSelectedMethod(null)
    setAmount("")
    setTopUpStatus("idle")
    setIsProcessing(false)
  }

  if (topUpStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Top-Up Successful!</h1>
            <p className="text-gray-600 text-center mb-6">
              Your wallet has been topped up with ${Number.parseFloat(amount).toFixed(2)}. The funds will be available
              shortly.
            </p>
            <div className="w-full space-y-3">
              <Link
                href="/dashboard"
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={resetTopUp}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Top Up Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Top Up Wallet</h1>
              <p className="text-blue-100">Add money to your account</p>
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
            <div className="text-center">
              <p className="text-blue-100 text-sm">Current Balance</p>
              <p className="text-2xl font-bold">${userBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Top-Up Form */}
        <div className="px-6 py-6 pb-24">
          {/* Amount Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Amount</h3>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    amount === quickAmount.toString()
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold">${quickAmount}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Or enter custom amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  max="1000"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="space-y-3">
              {topUpMethods.map((method) => {
                const IconComponent = method.icon
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${method.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">Fee: {method.fee}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Top-Up Button */}
          <div className="space-y-3">
            <button
              onClick={handleTopUp}
              disabled={!selectedMethod || !amount || Number.parseFloat(amount) <= 0 || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isProcessing ? "Processing..." : `Top Up $${amount || "0.00"}`}
            </button>

            {amount && selectedMethod && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${Number.parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">{topUpMethods.find((m) => m.id === selectedMethod)?.fee}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>${Number.parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Information */}
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">💡 Top-Up Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Minimum top-up amount is $1.00</li>
                <li>• Maximum top-up amount is $1,000.00</li>
                <li>• Funds are usually available within 5 minutes</li>
                <li>• You'll receive a confirmation SMS</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">🔒 Secure Payments</h3>
              <p className="text-sm text-green-700">
                All transactions are encrypted and processed through secure payment gateways. Your financial information
                is protected with bank-level security.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
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
