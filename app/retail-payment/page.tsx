"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Store,
  DollarSign,
  CreditCard,
  CheckCircle,
  MapPin,
  Clock,
  Receipt,
  ShoppingCart,
} from "lucide-react"

interface RetailPaymentData {
  merchantId: string
  merchantName: string
  branchName: string
  address: string
  category: string
}

export default function RetailPaymentPage() {
  const router = useRouter()
  const [retailData, setRetailData] = useState<RetailPaymentData | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"amount" | "confirm">("amount")

  useEffect(() => {
    // Get scan data from session storage
    const scanData = sessionStorage.getItem("paypass_scan_data")
    if (!scanData) {
      router.push("/unified-scanner")
      return
    }

    try {
      const payload = JSON.parse(scanData)
      if (payload.merchantType !== "retail") {
        router.push("/unified-scanner")
        return
      }

      // Simulate loading retail data
      setTimeout(() => {
        setRetailData({
          merchantId: payload.merchantId,
          merchantName: payload.additionalParams?.merchant?.replace(/_/g, " ") || "Unknown Merchant",
          branchName: payload.additionalParams?.branch || "Main Branch",
          address: "123 Main Street, Harare, Zimbabwe",
          category: "Grocery Store",
        })
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      router.push("/unified-scanner")
    }
  }, [router])

  const handleAmountConfirmation = () => {
    const amount = Number.parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }
    if (amount > 1000) {
      alert("Payment amount seems high. Please confirm the amount.")
      return
    }
    setStep("confirm")
  }

  const processPayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Store payment data for confirmation page
    const paymentData = {
      type: "retail",
      merchantId: retailData!.merchantId,
      merchantName: retailData!.merchantName,
      branchName: retailData!.branchName,
      amount: Number.parseFloat(paymentAmount),
      category: retailData!.category,
    }

    sessionStorage.setItem("paypass_payment_data", JSON.stringify(paymentData))
    router.push("/payment-success")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading merchant information...</p>
        </div>
      </div>
    )
  }

  if (!retailData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error loading merchant data</p>
          <Link href="/unified-scanner">
            <Button className="mt-4">Back to Scanner</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/unified-scanner" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Retail Payment</h1>
              <p className="text-purple-100">General Merchant Payment</p>
            </div>
          </div>

          {/* Merchant Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Store className="w-6 h-6 text-white" />
                <div>
                  <h3 className="font-semibold text-white">{retailData.merchantName}</h3>
                  <p className="text-purple-100 text-sm">{retailData.branchName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {retailData.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 py-6">
          {step === "amount" ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Payment Amount</h2>
                <p className="text-gray-600">How much would you like to pay?</p>
              </div>

              {/* Merchant Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Store className="w-5 h-5 mr-2" />
                    Merchant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business</span>
                    <span className="font-medium">{retailData.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch</span>
                    <span className="font-medium">{retailData.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">{retailData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Location
                    </span>
                    <span className="font-medium text-sm">{retailData.address}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Amount Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Amount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount to Pay (USD)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 20, 50, 100, 200].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentAmount(amount.toString())}
                        className="text-sm"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Alert>
                    <Receipt className="h-4 w-4" />
                    <AlertDescription>
                      Enter the exact amount shown on your receipt or as agreed with the merchant.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleAmountConfirmation}
                disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0}
                className="w-full"
                size="lg"
              >
                Continue to Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Retail Payment</h2>
                <p className="text-gray-600">Review your payment details</p>
              </div>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Merchant</span>
                    <span className="font-medium">{retailData.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch</span>
                    <span className="font-medium">{retailData.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">{retailData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Time
                    </span>
                    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount</span>
                      <span className="text-purple-600">${Number.parseFloat(paymentAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Actions */}
              <div className="space-y-3">
                <Button onClick={processPayment} disabled={isProcessing} className="w-full" size="lg">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ${Number.parseFloat(paymentAmount).toFixed(2)}
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={() => setStep("amount")} className="w-full" disabled={isProcessing}>
                  Change Amount
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
