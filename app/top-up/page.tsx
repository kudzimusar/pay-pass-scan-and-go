"use client"

<<<<<<< HEAD
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
=======
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, CreditCard, Smartphone, Building, CheckCircle, AlertCircle, Plus } from "lucide-react"
>>>>>>> origin/main

export default function TopUpPage() {
  const { user, refreshUserData } = useAuth()
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("mobile_money")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
  }, [user, router])

  const paymentMethods = [
    {
      id: "mobile_money",
      name: "Mobile Money",
      icon: Smartphone,
      description: "EcoCash, OneMoney, Telecash",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: Building,
      description: "Direct bank transfer",
    },
    {
      id: "card",
      name: "Debit/Credit Card",
      icon: CreditCard,
      description: "Visa, Mastercard",
    },
  ]

  const handleTopUp = async () => {
<<<<<<< HEAD
    setError("")
    setSuccess("")
    const amt = Number.parseFloat(amount)
    if (!user) {
      setError("Please sign in first")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount")
      return
    }
    try {
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, amount: amt, method: "wallet_topup" }),
      })
      if (!res.ok) {
        const text = await res.text()
        const maybe = text.trim().startsWith("{") ? JSON.parse(text) : null
        throw new Error(maybe?.error || text || `HTTP ${res.status}`)
      }
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        const text = await res.text()
        throw new Error(text || "Invalid server response")
      }
      const data = await res.json()
      if (data.success) {
        await refreshUserData()
        setSuccess(`Successfully added $${amt.toFixed(2)} to your wallet!`)
        setAmount("")
      } else {
        setError(data.error || "Top-up failed. Please try again.")
      }
    } catch (e: any) {
      setError(e?.message || "Top-up failed. Please try again.")
=======
    if (!amount) {
      setError("Please enter an amount")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (selectedMethod === "mobile_money" && !phoneNumber) {
      setError("Please enter your mobile money number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          method: selectedMethod,
          phoneNumber: selectedMethod === "mobile_money" ? phoneNumber : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully added $${amountNum.toFixed(2)} to your wallet!`)
        setAmount("")
        setPhoneNumber("")

        // Refresh user data to get updated balance
        await refreshUserData()
      } else {
        setError(data.error || "Top-up failed. Please try again.")
      }
    } catch (error) {
      console.error("Top-up error:", error)
      setError("Top-up failed. Please try again.")
    } finally {
      setIsLoading(false)
>>>>>>> origin/main
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Top Up Wallet</h1>
          </div>
          <p className="text-orange-100 text-sm">Add money to your PayPass wallet</p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Current Balance */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900">${user.walletBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top-up Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[10, 25, 50].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="text-sm"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedMethod === method.id ? "bg-orange-100" : "bg-gray-100"
                        }`}
                      >
                        <method.icon
                          className={`w-5 h-5 ${selectedMethod === method.id ? "text-orange-600" : "text-gray-600"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    {selectedMethod === method.id && <CheckCircle className="w-5 h-5 text-orange-600" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mobile Money Number Input */}
          {selectedMethod === "mobile_money" && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Mobile Money Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="phoneNumber">Mobile Money Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0771234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Up Button */}
          <Button
            onClick={handleTopUp}
            disabled={isLoading || !amount || (selectedMethod === "mobile_money" && !phoneNumber)}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Top Up Wallet
              </div>
            )}
          </Button>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your payment information is secure and encrypted. Funds will be available immediately after successful
              payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
