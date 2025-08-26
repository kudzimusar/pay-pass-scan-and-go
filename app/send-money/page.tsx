"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Send, CreditCard, Smartphone, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"

interface PaymentMethod {
  id: string
  type: "wallet" | "ecocash" | "telecash" | "bank"
  name: string
  icon: any
  balance?: number
  accountNumber?: string
}

export default function SendMoney() {
  const router = useRouter()
  const { user } = useAuth()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [paymentMethod, setPaymentMethod] = useState("wallet")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Available payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: "wallet",
      type: "wallet",
      name: "PayPass Wallet",
      icon: CreditCard,
      balance: user?.walletBalance || 0,
    },
    {
      id: "ecocash",
      type: "ecocash",
      name: "EcoCash",
      icon: Smartphone,
      accountNumber: "**** 1234",
    },
    {
      id: "telecash",
      type: "telecash",
      name: "TeleCash",
      icon: Smartphone,
      accountNumber: "**** 5678",
    },
  ]

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate inputs
      if (!recipient || !amount || !currency) {
        throw new Error("Please fill in all required fields")
      }

      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      if (paymentMethod === "wallet" && numAmount > (user?.walletBalance || 0)) {
        throw new Error("Insufficient wallet balance")
      }

      // Send money request
      const response = await fetch("/api/transactions/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientPhone: recipient,
          amount: numAmount,
          currency,
          paymentMethod,
          description: description || "Money transfer",
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send money")
      }

      if (data.success) {
        setSuccess(`Successfully sent ${currency} ${amount} to ${recipient}`)
        setRecipient("")
        setAmount("")
        setDescription("")
        
        // Redirect to transactions page after a delay
        setTimeout(() => {
          router.push("/transactions")
        }, 2000)
      } else {
        throw new Error(data.error || "Transaction failed")
      }
    } catch (err: any) {
      console.error("Send money error:", err)
      setError(err.message || "Failed to send money")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
            <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
            <p className="text-gray-600">Transfer money quickly and securely</p>
          </div>
        </div>

        {/* Main Form */}
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Send Money
              </CardTitle>
            <CardDescription>
              Send money to friends, family, or businesses
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSendMoney} className="space-y-6">
              {/* Recipient */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Phone Number</Label>
                <Input
                  id="recipient"
                  type="tel"
                  placeholder="+263 77 123 4567"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="ZWL">ZWL (Z$)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <Card
                      key={method.id}
                      className={`cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <method.icon className="w-5 h-5 text-gray-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{method.name}</p>
                            {method.balance !== undefined && (
                              <p className="text-xs text-gray-500">
                                Balance: {currency} {method.balance.toFixed(2)}
                              </p>
                            )}
                            {method.accountNumber && (
                              <p className="text-xs text-gray-500">{method.accountNumber}</p>
                            )}
                          </div>
              </div>
            </CardContent>
          </Card>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What's this payment for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Summary */}
              {amount && recipient && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Transaction Summary</h3>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>{currency} {amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recipient:</span>
                        <span>{recipient}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span>{paymentMethods.find(m => m.id === paymentMethod)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee:</span>
                        <span>FREE</span>
                      </div>
                      <div className="border-t border-blue-300 pt-1 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>{currency} {amount}</span>
                        </div>
                      </div>
              </div>
            </CardContent>
          </Card>
              )}

              {/* Submit Button */}
          <Button
                type="submit"
                className="w-full"
                disabled={loading || !recipient || !amount}
              >
                {loading ? (
                  <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Send {currency} {amount || "0.00"}
                  </>
                )}
          </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Send */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Send</CardTitle>
            <CardDescription>Send to recent recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No recent recipients</p>
              <p className="text-sm">Your recent sends will appear here</p>
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}