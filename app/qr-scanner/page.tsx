"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  DollarSign,
  Bus,
  Navigation,
  Zap,
  CheckCircle,
  Smartphone,
  QrCode,
  CreditCard,
} from "lucide-react"

interface RouteStation {
  id: string
  name: string
  order: number
  estimatedTime: number
  distance: number
}

interface RouteInfo {
  id: string
  name: string
  operator: string
  busNumber: string
  currentStation: string
  stations: RouteStation[]
  baseFare: number
  peakHourMultiplier: number
  isPeakHour: boolean
}

interface FareCalculation {
  baseFare: number
  distanceFare: number
  peakSurcharge: number
  totalFare: number
  currency: "USD" | "ZWL"
}

export default function QRScannerPage() {
  const [scannerActive, setScannerActive] = useState(false)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [selectedStation, setSelectedStation] = useState<RouteStation | null>(null)
  const [fareCalculation, setFareCalculation] = useState<FareCalculation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanStep, setScanStep] = useState<"scan" | "select" | "confirm" | "payment">("scan")
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mock route data - in real app this would come from QR scan
  const mockRouteData: RouteInfo = {
    id: "route-001",
    name: "Harare CBD - Borrowdale",
    operator: "ZUPCO Express",
    busNumber: "ZE-4521",
    currentStation: "Harare CBD",
    stations: [
      { id: "st-001", name: "Harare CBD", order: 1, estimatedTime: 0, distance: 0 },
      { id: "st-002", name: "Avondale", order: 2, estimatedTime: 15, distance: 8.5 },
      { id: "st-003", name: "Mount Pleasant", order: 3, estimatedTime: 25, distance: 12.3 },
      { id: "st-004", name: "Borrowdale", order: 4, estimatedTime: 35, distance: 18.7 },
      { id: "st-005", name: "Borrowdale Village", order: 5, estimatedTime: 40, distance: 21.2 },
    ],
    baseFare: 1.5,
    peakHourMultiplier: 1.5,
    isPeakHour: true,
  }

  const startScanner = async () => {
    setScannerActive(true)
    setIsProcessing(true)

    // Simulate QR code scanning
    setTimeout(() => {
      setRouteInfo(mockRouteData)
      setScanStep("select")
      setIsProcessing(false)
    }, 2000)
  }

  const selectStation = (station: RouteStation) => {
    setSelectedStation(station)

    // Calculate fare based on distance and peak hours
    const distanceFare = station.distance * 0.15 // $0.15 per km
    const baseFare = mockRouteData.baseFare
    const peakSurcharge = mockRouteData.isPeakHour ? (baseFare + distanceFare) * 0.5 : 0
    const totalFare = baseFare + distanceFare + peakSurcharge

    setFareCalculation({
      baseFare,
      distanceFare,
      peakSurcharge,
      totalFare,
      currency: "USD",
    })

    setScanStep("confirm")
  }

  const confirmPayment = () => {
    setScanStep("payment")
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      // Navigate to payment confirmation with ticket data
      const ticketData = {
        qrId: routeInfo?.id || "route-001",
        amount: fareCalculation?.totalFare || 0,
        merchant: routeInfo?.operator || "ZUPCO Express",
        description: `${routeInfo?.currentStation} → ${selectedStation?.name}`,
        type: "bus_ticket",
        ticketNumber: `TKT-${Date.now()}`,
        routeName: routeInfo?.name,
        departureTime: new Date().toLocaleTimeString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(), // 24 hours
        passengerName: "Demo Passenger",
        seatNumber: Math.floor(Math.random() * 50) + 1
      }
      
      // Navigate to payment confirmation with ticket data
      const queryParams = new URLSearchParams({
        qrId: ticketData.qrId,
        amount: ticketData.amount.toString(),
        merchant: encodeURIComponent(ticketData.merchant),
        description: encodeURIComponent(ticketData.description),
        type: ticketData.type,
        ticketNumber: ticketData.ticketNumber,
        routeName: encodeURIComponent(ticketData.routeName),
        departureTime: encodeURIComponent(ticketData.departureTime),
        validUntil: encodeURIComponent(ticketData.validUntil),
        passengerName: encodeURIComponent(ticketData.passengerName),
        seatNumber: ticketData.seatNumber.toString()
      })
      
      window.location.href = `/payment-confirmation?${queryParams.toString()}`
    }, 3000)
  }

  const resetScanner = () => {
    setScannerActive(false)
    setRouteInfo(null)
    setSelectedStation(null)
    setFareCalculation(null)
    setScanStep("scan")
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
              <h1 className="text-2xl font-bold">QR Scanner</h1>
              <p className="text-blue-100">Scan QR codes for payments and more</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {scanStep === "scan" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Scan QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <Camera className="w-16 h-16 text-gray-400" />
                </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Point your camera at a QR code to scan for payments, bus tickets, or other services
                    </p>
              </div>

                  <Button onClick={startScanner} className="w-full" size="lg" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Start Scanning
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      For demo purposes, this will simulate scanning a bus ticket QR code
                    </p>
              </div>
                </CardContent>
              </Card>
            </div>
          )}

          {scanStep === "select" && routeInfo && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="w-5 h-5" />
                    Select Destination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900">{routeInfo.name}</h3>
                      <p className="text-sm text-blue-700">{routeInfo.operator} - {routeInfo.busNumber}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">From: {routeInfo.currentStation}</span>
            </div>
          </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Available Stations:</h4>
                      {routeInfo.stations.slice(1).map((station) => (
                        <div
                          key={station.id}
                          onClick={() => selectStation(station)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                      <div>
                              <p className="font-medium">{station.name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {station.estimatedTime} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Navigation className="w-3 h-3" />
                                  {station.distance} km
                                </span>
                      </div>
                    </div>
                            <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
                </CardContent>
              </Card>
            </div>
          )}

          {scanStep === "confirm" && selectedStation && fareCalculation && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Confirm Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900">Trip Summary</h3>
              <p className="text-sm text-green-700">
                        {routeInfo?.currentStation} → {selectedStation.name}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Fare Breakdown:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Base Fare:</span>
                          <span>${fareCalculation.baseFare.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance Fare:</span>
                          <span>${fareCalculation.distanceFare.toFixed(2)}</span>
                        </div>
                        {fareCalculation.peakSurcharge > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Peak Hour Surcharge:</span>
                            <span>${fareCalculation.peakSurcharge.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${fareCalculation.totalFare.toFixed(2)}</span>
            </div>
          </div>
        </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetScanner} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={confirmPayment} className="flex-1">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {scanStep === "payment" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Processing Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600">Processing your payment...</p>
                    <p className="text-sm text-gray-500">Please wait while we complete your transaction</p>
                  </div>
                </CardContent>
              </Card>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
