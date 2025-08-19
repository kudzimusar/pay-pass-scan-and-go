"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  Download,
  Share,
  Home,
  Receipt,
  QrCode,
  Bus,
  Car,
  Store,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react"

interface PaymentData {
  type: "bus" | "taxi" | "retail"
  transactionId: string
  timestamp: string
  amount: number
  [key: string]: any
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get payment data from session storage
    const paymentInfo = sessionStorage.getItem("paypass_payment_data")
    if (!paymentInfo) {
      router.push("/unified-scanner")
      return
    }

    try {
      const data = JSON.parse(paymentInfo)
      setPaymentData({
        ...data,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        amount: data.fare || data.amount,
      })
      setIsLoading(false)
    } catch (error) {
      router.push("/unified-scanner")
    }
  }, [router])

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "bus":
        return Bus
      case "taxi":
        return Car
      case "retail":
        return Store
      default:
        return Receipt
    }
  }

  const getPaymentColor = (type: string) => {
    switch (type) {
      case "bus":
        return "blue"
      case "taxi":
        return "green"
      case "retail":
        return "purple"
      default:
        return "gray"
    }
  }

  const shareReceipt = async () => {
    if (navigator.share && paymentData) {
      try {
        await navigator.share({
          title: "PayPass Payment Receipt",
          text: `Payment of $${paymentData.amount.toFixed(2)} completed successfully`,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/receipt/${paymentData.transactionId}`,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating receipt...</p>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error loading payment data</p>
          <Link href="/dashboard">
            <Button className="mt-4">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const PaymentIcon = getPaymentIcon(paymentData.type)
  const paymentColor = getPaymentColor(paymentData.type)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100">Your transaction has been completed</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Transaction Summary */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    paymentColor === "blue"
                      ? "bg-blue-100"
                      : paymentColor === "green"
                        ? "bg-green-100"
                        : "bg-purple-100"
                  }`}
                >
                  <PaymentIcon
                    className={`w-8 h-8 ${
                      paymentColor === "blue"
                        ? "text-blue-600"
                        : paymentColor === "green"
                          ? "text-green-600"
                          : "text-purple-600"
                    }`}
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">${paymentData.amount.toFixed(2)} Paid</h2>
                <p className="text-gray-600 capitalize">{paymentData.type} Payment</p>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-sm">{paymentData.transactionId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Date
                  </span>
                  <span className="font-medium">{new Date(paymentData.timestamp).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Time
                  </span>
                  <span className="font-medium">{new Date(paymentData.timestamp).toLocaleTimeString()}</span>
                </div>

                <Separator />

                {/* Payment Type Specific Details */}
                {paymentData.type === "bus" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Route</span>
                      <span className="font-medium">{paymentData.route}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Destination</span>
                      <span className="font-medium">{paymentData.station}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Operator</span>
                      <span className="font-medium">{paymentData.operator}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bus Number</span>
                      <span className="font-medium">{paymentData.busNumber}</span>
                    </div>
                  </>
                )}

                {paymentData.type === "taxi" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Driver</span>
                      <span className="font-medium">{paymentData.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">License</span>
                      <span className="font-medium">{paymentData.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Vehicle</span>
                      <span className="font-medium">{paymentData.vehicleDetails}</span>
                    </div>
                  </>
                )}

                {paymentData.type === "retail" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Merchant</span>
                      <span className="font-medium">{paymentData.merchantName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Branch</span>
                      <span className="font-medium">{paymentData.branchName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">{paymentData.category}</span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Total Paid
                  </span>
                  <span className="text-green-600">${paymentData.amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Receipt */}
          <Card className="mb-6 bg-gray-50 border-2 border-dashed border-gray-300">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center mb-4">
                <QrCode className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Digital Receipt</h3>
              <p className="text-sm text-gray-600 mb-4">QR code for verification and record keeping</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                PAYMENT CONFIRMED
              </Badge>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <Button onClick={shareReceipt} variant="outline" className="w-full bg-transparent">
              <Share className="w-4 h-4 mr-2" />
              Share Receipt
            </Button>

            <Button variant="outline" className="w-full bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full bg-transparent">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link href="/unified-scanner">
              <Button className="w-full">
                <QrCode className="w-4 h-4 mr-2" />
                Scan Again
              </Button>
            </Link>
          </div>

          {/* Success Message */}
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-green-900 mb-2">🎉 Payment Complete!</h3>
              <p className="text-sm text-green-800">
                Your {paymentData.type} payment has been processed successfully.
                {paymentData.type === "bus" && " Show this receipt to the conductor when boarding."}
                {paymentData.type === "taxi" && " Thank you for using PayPass for your taxi ride."}
                {paymentData.type === "retail" && " Your purchase has been confirmed."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
