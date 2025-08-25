"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, QrCode, Camera, Home, History, User, AlertCircle, CheckCircle } from "lucide-react"

export default function QRScannerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const demoQRCodes = [
    {
      id: "bus_ticket_250",
      title: "Bus Ticket - Route 1A",
      description: "City Center to Avondale",
      amount: 2.5,
      type: "bus_ticket",
      merchant: "City Transport",
    },
    {
      id: "grocery_1575",
      title: "Grocery Payment",
      description: "SuperMart Weekly Shopping",
      amount: 15.75,
      type: "grocery",
      merchant: "SuperMart",
    },
    {
      id: "electricity_4520",
      title: "Electricity Bill",
      description: "ZESA Monthly Bill",
      amount: 45.2,
      type: "electricity",
      merchant: "ZESA Holdings",
    },
    {
      id: "water_2850",
      title: "Water Bill",
      description: "Harare Water Monthly",
      amount: 28.5,
      type: "water",
      merchant: "Harare Water",
    },
  ]

  const handleQRCodeSelect = (qrCode: any) => {
    setSelectedDemo(qrCode.id)
    setError("")

    // Check balance before proceeding
    if (!user) {
      setError("Please sign in first")
      return
    }

    if (user.walletBalance < qrCode.amount) {
      setError(
        `Insufficient balance. You need $${(qrCode.amount - user.walletBalance).toFixed(2)} more to complete this payment.`,
      )
      return
    }

    // Navigate to payment confirmation
    router.push(
      `/payment-confirmation?qrId=${qrCode.id}&amount=${qrCode.amount}&merchant=${encodeURIComponent(qrCode.merchant)}&description=${encodeURIComponent(qrCode.description)}&type=${qrCode.type}`,
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Scan & Pay</h1>
              <p className="text-blue-100">Quick QR code payments</p>
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
            <div className="text-center">
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-2xl font-bold">${user.walletBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="px-6 py-6 pb-24">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                  {error.includes("Insufficient balance") && (
                    <Link href="/top-up" className="text-red-600 text-sm underline mt-1 block">
                      Top Up Wallet
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Camera Scanner Placeholder */}
          <div className="mb-8">
            <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
              <Camera className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center mb-2">Point camera at QR code</p>
              <p className="text-gray-500 text-sm text-center">Camera access required for scanning</p>
            </div>
          </div>

          {/* Demo QR Codes */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo QR Codes</h3>
            <p className="text-sm text-gray-600 mb-4">Try these sample payments to test the system</p>

            <div className="space-y-3">
              {demoQRCodes.map((qrCode) => (
                <div
                  key={qrCode.id}
                  onClick={() => handleQRCodeSelect(qrCode)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    user.walletBalance >= qrCode.amount
                      ? "border-gray-200 hover:border-blue-300 hover:shadow-md"
                      : "border-red-200 bg-red-50 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{qrCode.title}</h4>
                        <p className="text-sm text-gray-600">{qrCode.description}</p>
                        <p className="text-xs text-gray-500">{qrCode.merchant}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          user.walletBalance >= qrCode.amount ? "text-gray-900" : "text-red-600"
                        }`}
                      >
                        ${qrCode.amount.toFixed(2)}
                      </p>
                      {user.walletBalance < qrCode.amount && <p className="text-xs text-red-600">Insufficient</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">💡 How to Use</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Point your camera at any QR code to scan</li>
                <li>• Try the demo codes above to test payments</li>
                <li>• Ensure you have sufficient balance</li>
                <li>• Payments are instant and secure</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">🔒 Security</h3>
              <p className="text-sm text-green-700">
                All QR payments are encrypted and processed securely. Your balance is protected with bank-level
                security.
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
