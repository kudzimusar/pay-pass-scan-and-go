"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Smartphone, CreditCard, Building2, Plus, DollarSign, AlertCircle, Shield } from "lucide-react"

const quickAmounts = {
  USD: [5, 10, 25, 50, 100],
  ZWL: [1000, 2500, 5000, 10000, 25000],
}

const paymentMethods = [
  {
    id: "ecocash",
    name: "EcoCash",
    icon: Smartphone,
    color: "bg-green-500",
    description: "Mobile money transfer",
    fee: "2.5%",
    minAmount: 1,
  },
  {
    id: "onemoney",
    name: "OneMoney",
    icon: Smartphone,
    color: "bg-red-500",
    description: "NetOne mobile money",
    fee: "2.0%",
    minAmount: 1,
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: Building2,
    color: "bg-blue-500",
    description: "Direct bank transfer",
    fee: "$0.50",
    minAmount: 10,
  },
  {
    id: "card",
    name: "Debit/Credit Card",
    icon: CreditCard,
    color: "bg-purple-500",
    description: "Visa, Mastercard accepted",
    fee: "3.5%",
    minAmount: 5,
  },
]

export default function TopUpPage() {
  const router = useRouter()
  const [currency, setCurrency] = useState("USD")
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const calculateFee = (amount: number, method: any) => {
    if (method.fee.includes("%")) {
      const percentage = Number.parseFloat(method.fee.replace("%", "")) / 100
      return amount * percentage
    } else {
      return Number.parseFloat(method.fee.replace("$", ""))
    }
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
  }

  const handleTopUp = async () => {
    if (!amount || !selectedMethod) return

    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      router.push(`/payment-success?type=topup&amount=${amount}&currency=${currency}&method=${selectedMethod}`)
    }, 3000)
  }

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedMethod)
  const numericAmount = Number.parseFloat(amount) || 0
  const fee = selectedPaymentMethod ? calculateFee(numericAmount, selectedPaymentMethod) : 0
  const total = numericAmount + fee

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-paypass text-white px-6 py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/20 mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Top Up Wallet</h1>
        </div>
        <p className="text-white/80">Add money to your PayPass wallet</p>
      </div>

      <div className="px-6 py-8">
        {/* Currency Selection */}
        <Card className="paypass-card mb-6">
          <CardHeader>
            <CardTitle className="text-gradient-paypass">Select Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currency} onValueChange={setCurrency}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="USD" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>USD</span>
                </TabsTrigger>
                <TabsTrigger value="ZWL" className="flex items-center space-x-2">
                  <span className="text-sm font-bold">ZWL</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Amount Selection */}
        <Card className="paypass-card mb-6">
          <CardHeader>
            <CardTitle className="text-gradient-paypass">Enter Amount</CardTitle>
            <CardDescription>Choose a quick amount or enter custom amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts[currency as keyof typeof quickAmounts].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`${amount === quickAmount.toString() ? "bg-blue-50 border-blue-500 text-blue-600" : ""}`}
                >
                  {currency === "USD" ? "$" : "ZWL "}
                  {quickAmount}
                </Button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {currency === "USD" ? "$" : "ZWL"}
              </div>
              <Input
                type="number"
                placeholder="Enter custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="paypass-input pl-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="paypass-card mb-6">
          <CardHeader>
            <CardTitle className="text-gradient-paypass">Payment Method</CardTitle>
            <CardDescription>Choose how you want to fund your wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon
              const isSelected = selectedMethod === method.id
              const isDisabled = numericAmount < method.minAmount

              return (
                <div
                  key={method.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : isDisabled
                        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => !isDisabled && setSelectedMethod(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${method.color} p-2 rounded-lg`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        {isDisabled && (
                          <p className="text-xs text-red-500">
                            Min: {currency === "USD" ? "$" : "ZWL "}
                            {method.minAmount}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        Fee: {method.fee}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Transaction Summary */}
        {amount && selectedMethod && (
          <Card className="paypass-card-gradient mb-6">
            <CardHeader>
              <CardTitle className="text-gradient-paypass">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Top-up Amount</span>
                <span className="font-semibold">
                  {currency === "USD" ? "$" : "ZWL "}
                  {numericAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-semibold">
                  {currency === "USD" ? "$" : "ZWL "}
                  {fee.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total to Pay</span>
                <span className="text-xl font-bold text-blue-600">
                  {currency === "USD" ? "$" : "ZWL "}
                  {total.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="paypass-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Secure Transaction</h4>
                <p className="text-sm text-gray-600">
                  Your payment is protected by bank-grade encryption and security measures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Up Button */}
        <Button
          onClick={handleTopUp}
          disabled={
            !amount || !selectedMethod || isProcessing || numericAmount < (selectedPaymentMethod?.minAmount || 0)
          }
          className="paypass-btn-primary"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Top Up Wallet
            </>
          )}
        </Button>

        {/* Important Notice */}
        <Card className="paypass-card mt-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Important Notice</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Top-up transactions are usually processed instantly</li>
                  <li>• Funds will be available in your wallet within 5 minutes</li>
                  <li>• Keep your transaction receipt for your records</li>
                  <li>• Contact support if you experience any issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
