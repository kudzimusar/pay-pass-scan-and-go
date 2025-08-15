"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Camera, QrCode, Zap, Home, History, User, CheckCircle, AlertCircle } from "lucide-react"

export default function QRScannerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")

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

  const demoQRCodes = [
    {
      id: "bus_001",
      type: "transport",
      merchant: "City Bus Route 1A",
      amount: 2.5,
      description: "Bus fare payment",
      route: "CBD to Avondale",
    },
    {
      id: "shop_001",
      type: "retail",
      merchant: "OK Supermarket",
      amount: 15.75,
      description: "Grocery purchase",
      location: "Eastgate Branch",
    },
    {
      id: "fuel_001",
      type: "fuel",
      merchant: "Zuva Petroleum",
      amount: 45.0,
      description: "Fuel purchase",
      location: "Harare Drive",
    },
  ]

  const handleScanDemo = (qrData: any) => {
    setScannedData(qrData)
    setIsScanning(false)
  }

  const handlePayment = async () => {
    if (!scannedData) return

    setPaymentStatus("processing")

    // Simulate payment processing
    setTimeout(() => {
      if (userBalance >= scannedData.amount) {
        setPaymentStatus("success")
        // In a real app, this would update the user's balance
      } else {
        setPaymentStatus("error")
      }
    }, 2000)
  }

  const resetScanner = () => {
    setScannedData(null)
    setPaymentStatus("idle")
    setIsScanning(false)
  }

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 text-center mb-6">
              Your payment of ${scannedData?.amount.toFixed(2)} to {scannedData?.merchant} has been processed.
            </p>
            <div className="w-full space-y-3">
              <Link
                href="/transactions"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              >
                View Transaction History
              </Link>
              <button
                onClick={resetScanner}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Scan Another QR Code
              </button>
              <Link
                href="/dashboard"
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 text-center mb-6">
              Insufficient balance. You need ${scannedData?.amount.toFixed(2)} but only have ${userBalance.toFixed(2)}.
            </p>
            <div className="w-full space-y-3">
              <Link
                href="/top-up"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              >
                Top Up Wallet
              </Link>
              <button
                onClick={resetScanner}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (scannedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
            <div className="flex items-center mb-4">
              <button onClick={resetScanner} className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Confirm Payment</h1>
                <p className="text-blue-100">Review transaction details</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="px-6 py-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {scannedData.type === "transport" ? (
                    <QrCode className="w-8 h-8 text-blue-600" />
                  ) : scannedData.type === "retail" ? (
                    <QrCode className="w-8 h-8 text-green-600" />
                  ) : (
                    <Zap className="w-8 h-8 text-orange-600" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{scannedData.merchant}</h2>
                <p className="text-gray-600">{scannedData.description}</p>
                {scannedData.location && <p className="text-sm text-gray-500">{scannedData.location}</p>}
                {scannedData.route && <p className="text-sm text-gray-500">{scannedData.route}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Amount</span>
                  <span className="text-2xl font-bold text-gray-900">${scannedData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Your Balance</span>
                  <span className="font-semibold text-gray-900">${userBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Balance After</span>
                  <span
                    className={`font-semibold ${userBalance >= scannedData.amount ? "text-green-600" : "text-red-600"}`}
                  >
                    ${(userBalance - scannedData.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="space-y-3">
              {userBalance >= scannedData.amount ? (
                <button
                  onClick={handlePayment}
                  disabled={paymentStatus === "processing"}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {paymentStatus === "processing" ? "Processing Payment..." : "Confirm Payment"}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-700 text-sm font-medium">Insufficient Balance</p>
                    <p className="text-red-600 text-sm">
                      You need ${(scannedData.amount - userBalance).toFixed(2)} more to complete this payment.
                    </p>
                  </div>
                  <Link
                    href="/top-up"
                    className="w-full bg-green-600 text-white py-4 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                  >
                    Top Up Wallet
                  </Link>
                </div>
              )}
              <button
                onClick={resetScanner}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
            <div className="flex items-center justify-around py-2">
              <Link
                href="/dashboard"
                className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600"
              >
                <Home className="w-5 h-5 mb-1" />
                <span className="text-xs">Home</span>
              </Link>
              <Link href="/qr-scanner" className="flex flex-col items-center py-2 px-3 text-blue-600">
                <QrCode className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Scan</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">QR Scanner</h1>
              <p className="text-blue-100">Scan to pay instantly</p>
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="px-6 py-8">
          {!isScanning ? (
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 bg-gray-100 rounded-2xl flex items-center justify-center border-4 border-dashed border-gray-300">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Tap to start scanning</p>
                </div>
              </div>
              <button
                onClick={() => setIsScanning(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 mb-6"
              >
                Start QR Scanner
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 bg-black rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
                <p className="text-white font-medium z-10">Scanning...</p>
              </div>
              <p className="text-gray-600 mb-6">Point your camera at a QR code</p>
              <button
                onClick={() => setIsScanning(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 mb-6"
              >
                Cancel Scanning
              </button>
            </div>
          )}

          {/* Demo QR Codes */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo QR Codes</h3>
            <p className="text-sm text-gray-600 mb-4">Try these sample QR codes to test payments:</p>
            <div className="space-y-3">
              {demoQRCodes.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => handleScanDemo(qr)}
                  className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{qr.merchant}</p>
                      <p className="text-sm text-gray-600">{qr.description}</p>
                      {qr.location && <p className="text-xs text-gray-500">{qr.location}</p>}
                      {qr.route && <p className="text-xs text-gray-500">{qr.route}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${qr.amount.toFixed(2)}</p>
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mt-1">
                        <QrCode className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 How to Use</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Point your camera at any PayPass QR code</li>
              <li>• Review the payment details carefully</li>
              <li>• Confirm the payment to complete the transaction</li>
              <li>• Keep your phone steady for better scanning</li>
            </ul>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/qr-scanner" className="flex flex-col items-center py-2 px-3 text-blue-600">
              <QrCode className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Scan</span>
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
