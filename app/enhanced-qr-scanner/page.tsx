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

export default function EnhancedQRScannerPage() {
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

  const confirmPayment = async () => {
    setIsProcessing(true)
    setScanStep("payment")

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      // Redirect to payment confirmation
      window.location.href = "/payment-confirmation"
    }, 3000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZW", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-6 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Enhanced QR Scanner</h1>
              <p className="text-blue-100">Dynamic Route & Drop-off System</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${scanStep === "scan" ? "bg-white" : "bg-white/50"}`}></div>
            <div className={`w-3 h-3 rounded-full ${scanStep === "select" ? "bg-white" : "bg-white/50"}`}></div>
            <div className={`w-3 h-3 rounded-full ${scanStep === "confirm" ? "bg-white" : "bg-white/50"}`}></div>
            <div className={`w-3 h-3 rounded-full ${scanStep === "payment" ? "bg-white" : "bg-white/50"}`}></div>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Step 1: QR Scanner */}
          {scanStep === "scan" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Bus QR Code</h2>
                <p className="text-gray-600">Point your camera at the QR code displayed on the bus</p>
              </div>

              {!scannerActive ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Ready</h3>
                    <p className="text-gray-600 mb-4">Tap to start scanning the bus QR code</p>
                    <Button onClick={startScanner} className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Scanner
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 animate-pulse"></div>
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Processing QR Code...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-gray-600">Position QR code within the frame</p>
                  </CardContent>
                </Card>
              )}

              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Make sure the QR code is clearly visible and well-lit for best results.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Station Selection */}
          {scanStep === "select" && routeInfo && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Route Identified</h2>
                <p className="text-gray-600">Select your drop-off destination</p>
              </div>

              {/* Route Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Bus className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{routeInfo.name}</h3>
                      <p className="text-sm text-gray-600">
                        {routeInfo.operator} • {routeInfo.busNumber}
                      </p>
                    </div>
                  </div>

                  {routeInfo.isPeakHour && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Peak Hour Pricing
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Station Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Choose Drop-off Station</h3>
                <div className="space-y-2">
                  {routeInfo.stations.slice(1).map((station) => (
                    <Card
                      key={station.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedStation?.id === station.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => selectStation(station)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">{station.order}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{station.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{station.estimatedTime} min</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Navigation className="w-3 h-3" />
                                  <span>{station.distance} km</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Fare Confirmation */}
          {scanStep === "confirm" && selectedStation && fareCalculation && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Journey</h2>
                <p className="text-gray-600">Review your fare and payment details</p>
              </div>

              {/* Journey Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Journey Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">From</span>
                    <span className="font-medium">{routeInfo?.currentStation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">To</span>
                    <span className="font-medium">{selectedStation.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Distance</span>
                    <span className="font-medium">{selectedStation.distance} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Est. Time</span>
                    <span className="font-medium">{selectedStation.estimatedTime} minutes</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fare Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fare Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Base Fare</span>
                    <span>{formatCurrency(fareCalculation.baseFare)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Distance Charge</span>
                    <span>{formatCurrency(fareCalculation.distanceFare)}</span>
                  </div>
                  {fareCalculation.peakSurcharge > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        Peak Hour Surcharge
                        <Zap className="w-3 h-3 ml-1 text-orange-500" />
                      </span>
                      <span className="text-orange-600">+{formatCurrency(fareCalculation.peakSurcharge)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Fare</span>
                    <span className="text-blue-600">{formatCurrency(fareCalculation.totalFare)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Button */}
              <Button onClick={confirmPayment} className="w-full" size="lg">
                <CreditCard className="w-4 h-4 mr-2" />
                Confirm & Pay {formatCurrency(fareCalculation.totalFare)}
              </Button>

              <Button variant="outline" onClick={() => setScanStep("select")} className="w-full">
                Change Destination
              </Button>
            </div>
          )}

          {/* Step 4: Payment Processing */}
          {scanStep === "payment" && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {isProcessing ? "Processing Payment..." : "Payment Successful!"}
                </h2>
                <p className="text-gray-600">
                  {isProcessing
                    ? "Please wait while we process your payment"
                    : "Your digital ticket is being generated"}
                </p>
              </div>

              {isProcessing && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-800">Verifying payment...</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
