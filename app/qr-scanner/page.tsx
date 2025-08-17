"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, QrCode, Zap, AlertCircle, CheckCircle } from "lucide-react"

const demoQRCodes = [
  {
    id: "merchant_001",
    name: "Coffee Shop Downtown",
    amount: 4.5,
    currency: "USD",
    description: "Cappuccino + Muffin",
    category: "Food & Beverage",
  },
  {
    id: "transport_001",
    name: "City Bus Route 1A",
    amount: 1.25,
    currency: "USD",
    description: "Single journey fare",
    category: "Transport",
  },
  {
    id: "utility_001",
    name: "ZESA Prepaid",
    amount: 25.0,
    currency: "USD",
    description: "Electricity top-up",
    category: "Utilities",
  },
]

export default function QRScannerPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState<any>(null)
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null)

  const simulateQRScan = (qrData: any) => {
    setIsScanning(true)
    setScanResult(null)

    setTimeout(() => {
      setScannedCode(qrData)
      setScanResult("success")
      setIsScanning(false)
    }, 2000)
  }

  const handlePayment = () => {
    if (scannedCode) {
      router.push(
        `/payment-confirmation?merchant=${scannedCode.id}&amount=${scannedCode.amount}&currency=${scannedCode.currency}`,
      )
    }
  }

  const resetScanner = () => {
    setScannedCode(null)
    setScanResult(null)
    setIsScanning(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-paypass text-white px-6 py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/20 mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">QR Scanner</h1>
        </div>
        <p className="text-white/80">Scan QR codes to make payments</p>
      </div>

      <div className="px-6 py-8">
        {/* Scanner Interface */}
        <Card className="paypass-card mb-6">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Scanner Animation */}
              <div className="relative mx-auto mb-6 w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                {isScanning ? (
                  <div className="relative">
                    <QrCode className="h-16 w-16 text-gray-400" />
                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse rounded-lg"></div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"></div>
                  </div>
                ) : scanResult === "success" ? (
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-semibold">QR Code Detected!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Position QR code in frame</p>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {isScanning && (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-blue-600 font-medium">Scanning...</p>
                </div>
              )}

              {scanResult === "error" && (
                <div className="flex items-center justify-center space-x-2 mb-4 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-medium">Invalid QR code. Please try again.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scanned Payment Details */}
        {scannedCode && scanResult === "success" && (
          <Card className="paypass-card mb-6">
            <CardHeader>
              <CardTitle className="text-gradient-paypass">Payment Details</CardTitle>
              <CardDescription>Review the payment information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Merchant</span>
                <span className="font-semibold">{scannedCode.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  {scannedCode.currency === "USD" ? "$" : "ZWL "}
                  {scannedCode.amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Description</span>
                <span className="font-medium">{scannedCode.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Category</span>
                <Badge variant="secondary">{scannedCode.category}</Badge>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button onClick={handlePayment} className="paypass-btn-primary flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
                <Button onClick={resetScanner} className="paypass-btn-secondary flex-1">
                  Scan Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo QR Codes */}
        {!scannedCode && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Demo QR Codes</h2>
            <p className="text-gray-600 mb-6">Tap any card below to simulate scanning that QR code</p>

            <div className="space-y-4">
              {demoQRCodes.map((qr, index) => (
                <Card
                  key={index}
                  className="paypass-card cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => simulateQRScan(qr)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <QrCode className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{qr.name}</h3>
                          <p className="text-sm text-gray-600">{qr.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {qr.currency === "USD" ? "$" : "ZWL "}
                          {qr.amount}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {qr.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Instructions */}
        <Card className="paypass-card-gradient mt-8">
          <CardHeader>
            <CardTitle className="text-gradient-paypass">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold px-1">1</span>
              </div>
              <p className="text-sm text-gray-700">Position the QR code within the scanner frame</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold px-1">2</span>
              </div>
              <p className="text-sm text-gray-700">Wait for the scanner to detect and process the code</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold px-1">3</span>
              </div>
              <p className="text-sm text-gray-700">Review payment details and confirm the transaction</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
