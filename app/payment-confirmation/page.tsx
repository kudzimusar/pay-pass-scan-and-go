"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  QrCode,
  Download,
  Share,
  ArrowLeft,
  Clock,
  Bus,
  Ticket,
  DollarSign,
  Calendar,
  User,
  Navigation,
  Smartphone,
} from "lucide-react"

interface TicketData {
  id: string
  passengerName: string
  route: string
  fromStation: string
  toStation: string
  busNumber: string
  operator: string
  fare: number
  currency: string
  timestamp: string
  estimatedTime: number
  distance: number
  qrCode: string
  status: "active" | "used" | "expired"
}

export default function PaymentConfirmationPage() {
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    // Simulate ticket generation
    setTimeout(() => {
      setTicketData({
        id: "TKT-" + Date.now(),
        passengerName: "John Doe",
        route: "Harare CBD - Borrowdale",
        fromStation: "Harare CBD",
        toStation: "Mount Pleasant",
        busNumber: "ZE-4521",
        operator: "ZUPCO Express",
        fare: 3.75,
        currency: "USD",
        timestamp: new Date().toISOString(),
        estimatedTime: 25,
        distance: 12.3,
        qrCode: "QR_CODE_DATA_HERE",
        status: "active",
      })
      setIsLoading(false)
    }, 2000)
  }, [])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-ZW", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-ZW", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const shareTicket = async () => {
    if (navigator.share && ticketData) {
      try {
        await navigator.share({
          title: "PayPass Bus Ticket",
          text: `Bus ticket from ${ticketData.fromStation} to ${ticketData.toStation}`,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${ticketData.id}`,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your digital ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error loading ticket data</p>
          <Link href="/dashboard">
            <Button className="mt-4">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Payment Successful!</h1>
              <p className="text-green-100">Your digital ticket is ready</p>
            </div>
          </div>

          {/* Success Icon */}
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <p className="text-green-100">Ticket generated successfully</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Digital Ticket */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5" />
                  <span className="font-semibold">Digital Ticket</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {ticketData.status.toUpperCase()}
                </Badge>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold mb-1">{ticketData.route}</h2>
                <p className="text-blue-100">Ticket ID: {ticketData.id}</p>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Journey Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Passenger
                  </span>
                  <span className="font-medium">{ticketData.passengerName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Bus className="w-4 h-4 mr-2" />
                    Bus
                  </span>
                  <span className="font-medium">
                    {ticketData.operator} • {ticketData.busNumber}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-medium">{ticketData.fromStation}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium">{ticketData.toStation}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Navigation className="w-4 h-4 mr-2" />
                    Distance
                  </span>
                  <span className="font-medium">{ticketData.distance} km</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Est. Time
                  </span>
                  <span className="font-medium">{ticketData.estimatedTime} minutes</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Fare Paid
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(ticketData.fare, ticketData.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Issued
                  </span>
                  <span className="font-medium text-sm">{formatDateTime(ticketData.timestamp)}</span>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center">
                <Button onClick={() => setShowQR(!showQR)} variant="outline" className="w-full mb-4">
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? "Hide QR Code" : "Show QR Code for Conductor"}
                </Button>

                {showQR && (
                  <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
                    <CardContent className="p-6">
                      <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center mb-4">
                        <div className="text-center">
                          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">QR Code</p>
                          <p className="text-xs text-gray-400">{ticketData.id}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Show this QR code to the conductor when boarding</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <Button onClick={shareTicket} variant="outline" className="w-full bg-transparent">
              <Share className="w-4 h-4 mr-2" />
              Share Ticket
            </Button>

            <Button variant="outline" className="w-full bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Save to Wallet
            </Button>
          </div>

          {/* Important Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Present this QR code to the conductor when boarding</li>
                <li>• Ticket is valid for the selected route and destination only</li>
                <li>• Keep your phone charged and accessible during the journey</li>
                <li>• Contact support if you need to change your destination</li>
              </ul>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full bg-transparent">
                <Smartphone className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link href="/transactions">
              <Button variant="outline" className="w-full bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
