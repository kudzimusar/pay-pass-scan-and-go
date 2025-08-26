"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  CheckCircle,
  Bus,
  Clock,
  MapPin,
  User,
  CreditCard,
  Download,
  Share2,
  QrCode,
  Calendar,
  Ticket,
  Home,
  Receipt
} from "lucide-react"
import QRCodeGenerator from "@/components/qr-code-generator"

interface TicketData {
  qrId: string
  amount: number
  merchant: string
  description: string
  type: string
  ticketNumber: string
  routeName: string
  departureTime: string
  validUntil: string
  passengerName: string
  seatNumber: number
}

export default function PaymentConfirmationPage() {
  const { user, refreshUserData } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [transactionId] = useState(`TXN-${Date.now()}`)
  const [showTicket, setShowTicket] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [boardingQRData, setBoardingQRData] = useState<string>("")

  useEffect(() => {
    // Extract ticket data from URL parameters first
    const ticketData: TicketData = {
      qrId: searchParams.get("qrId") || "route-001",
      amount: parseFloat(searchParams.get("amount") || "0"),
      merchant: decodeURIComponent(searchParams.get("merchant") || "ZUPCO Express"),
      description: decodeURIComponent(searchParams.get("description") || "Bus Ticket"),
      type: searchParams.get("type") || "bus_ticket",
      ticketNumber: searchParams.get("ticketNumber") || `TKT-${Date.now()}`,
      routeName: decodeURIComponent(searchParams.get("routeName") || "Harare CBD - Borrowdale"),
      departureTime: decodeURIComponent(searchParams.get("departureTime") || new Date().toLocaleTimeString()),
      validUntil: decodeURIComponent(searchParams.get("validUntil") || new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()),
      passengerName: decodeURIComponent(searchParams.get("passengerName") || "Demo Passenger"),
      seatNumber: parseInt(searchParams.get("seatNumber") || "1")
    }

    setTicketData(ticketData)
    setIsLoading(false)
    setShowTicket(true)

    // Generate boarding QR code data
    const qrData = `PAYPASS_TICKET:${ticketData.ticketNumber}:${Date.now()}:${ticketData.validUntil}`
    setBoardingQRData(qrData)

    // Only refresh user data if user is logged in
    if (user) {
      refreshUserData()
    }
  }, [searchParams, user, refreshUserData])

  const handleDownloadTicket = async () => {
    if (!ticketData) return

    // Create a printable version of the ticket
    const ticketContent = `
      PAYPASS DIGITAL TICKET
      =====================
      
      Ticket Number: ${ticketData.ticketNumber}
      Transaction ID: ${transactionId}
      
      Route: ${ticketData.routeName}
      Passenger: ${ticketData.passengerName}
      Seat: ${ticketData.seatNumber}
      
      Departure: ${ticketData.departureTime}
      Valid Until: ${ticketData.validUntil}
      
      Amount Paid: $${ticketData.amount.toFixed(2)}
      Payment Method: PayPass Wallet
      
      Status: CONFIRMED ✅
      
      Scan this ticket for boarding
    `

    try {
      const blob = new Blob([ticketContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ticket-${ticketData.ticketNumber}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback for mobile devices
      if (navigator.share) {
        const shareData = {
          title: 'PayPass Ticket',
          text: ticketContent,
          url: window.location.href
        }
        await navigator.share(shareData)
      }
    }
  }

  const handleShareTicket = async () => {
    if (!ticketData) return

    const shareData = {
      title: 'PayPass Digital Ticket',
      text: `Your bus ticket for ${ticketData.routeName} - Ticket #${ticketData.ticketNumber}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 3000)
      } else {
        // Fallback: copy to clipboard
        const shareText = `PayPass Ticket: ${ticketData.ticketNumber} - ${ticketData.routeName} - Amount: $${ticketData.amount.toFixed(2)}`
        await navigator.clipboard.writeText(shareText)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Share failed:', error)
      // Handle "Share canceled" error gracefully
      if (error instanceof Error && error.message.includes('canceled')) {
        // User canceled the share, don't show error
        return
      }
      // For other errors, show a user-friendly message
      alert('Sharing is not available on this device. Ticket information copied to clipboard.')
    }
  }

  const handleNavigateToDashboard = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  const handleNavigateToHome = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ Payment Failed</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/qr-scanner">
            <Button>Try Again</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Payment Confirmed</h1>
              <p className="text-green-100">Your digital ticket is ready</p>
            </div>
            <Button 
              onClick={handleNavigateToHome}
              variant="ghost" 
              className="text-white hover:bg-white/20"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h2>
              <p className="text-green-700">Your digital ticket has been generated</p>
            </CardContent>
          </Card>

          {/* Digital Ticket */}
          {ticketData && showTicket && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Ticket className="w-5 h-5" />
                  Digital Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Ticket Header */}
                <div className="text-center border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800">{ticketData.routeName}</h3>
                  <p className="text-sm text-gray-600">{ticketData.merchant}</p>
                  <Badge variant="outline" className="mt-2">
                    {ticketData.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Ticket Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ticket Number:</span>
                    <span className="font-mono font-bold">{ticketData.ticketNumber}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm">{transactionId}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Passenger:
                    </span>
                    <span className="font-medium">{ticketData.passengerName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Bus className="w-4 h-4" />
                      Seat:
                    </span>
                    <span className="font-medium">#{ticketData.seatNumber}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Departure:
                    </span>
                    <span className="font-medium">{ticketData.departureTime}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Valid Until:
                    </span>
                    <span className="font-medium text-sm">{ticketData.validUntil}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      Amount Paid:
                    </span>
                    <span className="font-bold text-lg text-green-600">${ticketData.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* QR Code for Boarding */}
                <div className="text-center pt-4 border-t">
                  {boardingQRData && (
                    <QRCodeGenerator 
                      data={boardingQRData} 
                      size={128} 
                      className="mx-auto mb-2"
                    />
                  )}
                  <p className="text-xs text-gray-500">Scan for boarding</p>
                  <p className="text-xs text-blue-600 mt-1">Valid until: {ticketData.validUntil}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleDownloadTicket} 
              className="w-full" 
              variant={downloadSuccess ? "default" : "outline"}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadSuccess ? "Downloaded Successfully!" : "Download Ticket"}
            </Button>
            
            <Button 
              onClick={handleShareTicket} 
              className="w-full" 
              variant={shareSuccess ? "default" : "outline"}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {shareSuccess ? "Shared Successfully!" : "Share Ticket"}
            </Button>

            <Button onClick={handleDownloadTicket} className="w-full" variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            
            <Button onClick={handleNavigateToDashboard} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {user ? "Back to Dashboard" : "Go to Home"}
            </Button>
          </div>

          {/* Transaction Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Transaction Summary</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>PayPass Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600 font-medium">✓ Confirmed</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Status Notice */}
          {!user && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> Sign in to save your tickets and access your payment history.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
