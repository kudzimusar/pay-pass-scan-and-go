"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Receipt, Calendar, Clock } from "lucide-react"
import { useAuth } from "@/context/auth"

export default function BillPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUserData } = useAuth()

  const provider = searchParams.get("provider") || ""
  const category = searchParams.get("category") || ""
  const accountType = searchParams.get("accountType") || ""

  const [accountNumber, setAccountNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [receiptData, setReceiptData] = useState<any>(null)

  // Generate a random bill number
  const billNumber = `BILL-${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`

  // Generate a random due date (7-14 days from now)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 7)
  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
  }, [user, router])

  const handlePayBill = async () => {
    if (!accountNumber || !amount) {
      setError("Please fill in all required fields")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      // Process payment
      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
        body: JSON.stringify({
          userId: user.id,
          amount: amountNum,
          merchant: provider,
          description: `${category} - ${provider} (${accountNumber})`,
          type: category.toLowerCase().replace(/\s+/g, "_"),
          billNumber: billNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh user data to get updated balance from auth provider
        await refreshUserData()

        // Set receipt data
        setReceiptData({
          transactionId: data.transactionId,
          provider,
          category,
          accountNumber,
          amount: amountNum,
          date: new Date().toISOString(),
          billNumber,
          status: "Paid",
        })

        setSuccess(`Payment of $${amountNum.toFixed(2)} to ${provider} was successful!`)
      } else {
        setError(data.error || "Payment failed. Please try again.")
      }
    } catch (error) {
      console.error("Payment error:", error)
      setError("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewReceipt = () => {
    if (receiptData) {
      localStorage.setItem("receipt_data", JSON.stringify(receiptData))
      router.push("/proof-of-payment")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/pay-bills">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">{provider}</h1>
          </div>
          <p className="text-blue-100 text-sm">{category}</p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && !receiptData && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {receiptData ? (
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Payment Successful
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">${receiptData.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium text-gray-900">{receiptData.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-medium text-gray-900">{receiptData.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill Number:</span>
                      <span className="font-medium text-gray-900">{receiptData.billNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">{new Date(receiptData.date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">{receiptData.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex space-x-3">
                <Button onClick={handleViewReceipt} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Bill Information */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Bill Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bill Number:</span>
                    <span className="font-medium">{billNumber}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium text-orange-600 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formattedDueDate}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-medium">${user.walletBalance.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="accountNumber">{accountType}</Label>
                    <Input
                      id="accountNumber"
                      placeholder={`Enter your ${accountType.toLowerCase()}`}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">PayPass Wallet</p>
                      <p className="text-sm text-gray-600">Balance: ${user.walletBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pay Button */}
              <Button
                onClick={handlePayBill}
                disabled={isProcessing || !accountNumber || !amount}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Bill
                  </div>
                )}
              </Button>

              {/* Payment Info */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Payment will be processed immediately</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
