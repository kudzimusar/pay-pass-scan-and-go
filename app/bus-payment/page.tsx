"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Bus, MapPin, Clock, Navigation, Zap, CheckCircle, CreditCard, Route } from "lucide-react"

interface BusPaymentData {
  merchantId: string
  routeId: string
  operator: string
  busNumber: string
  routeName: string
  stations: Array<{
    id: string
    name: string
    order: number
    distance: number
    estimatedTime: number
  }>
  baseFare: number
  isPeakHour: boolean
}

interface FareCalculation {
  baseFare: number
  distanceFare: number
  peakSurcharge: number
  totalFare: number
}

export default function BusPaymentPage() {
  const router = useRouter()
  const [busData, setBusData] = useState<BusPaymentData | null>(null)
  const [selectedStation, setSelectedStation] = useState<any>(null)
  const [fareCalculation, setFareCalculation] = useState<FareCalculation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Get scan data from session storage
    const scanData = sessionStorage.getItem("paypass_scan_data")
    if (!scanData) {
      router.push("/unified-scanner")
      return
    }

    try {
      const payload = JSON.parse(scanData)
      if (payload.merchantType !== "bus") {
        router.push("/unified-scanner")
        return
      }

      // Simulate loading bus route data
      setTimeout(() => {
        setBusData({
          merchantId: payload.merchantId,
          routeId: payload.routeId || "UNKNOWN",
          operator: payload.additionalParams?.operator || "Unknown Operator",
          busNumber: payload.merchantId.replace("BUS-", ""),
          routeName: "Harare CBD - Avondale",
          stations: [
            { id: "st-001", name: "Harare CBD", order: 1, distance: 0, estimatedTime: 0 },
            { id: "st-002", name: "Fourth Street", order: 2, distance: 3.2, estimatedTime: 8 },
            { id: "st-003", name: "Avondale Shops", order: 3, distance: 6.8, estimatedTime: 15 },
            { id: "st-004", name: "Avondale Flats", order: 4, distance: 8.5, estimatedTime: 20 },
          ],
          baseFare: 1.5,
          isPeakHour: new Date().getHours() >= 7 && new Date().getHours() <= 9,
        })
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      router.push("/unified-scanner")
    }
  }, [router])

  const selectStation = (station: any) => {
    setSelectedStation(station)

    // Calculate fare
    const distanceFare = station.distance * 0.2 // $0.20 per km
    const baseFare = busData!.baseFare
    const peakSurcharge = busData!.isPeakHour ? (baseFare + distanceFare) * 0.5 : 0
    const totalFare = baseFare + distanceFare + peakSurcharge

    setFareCalculation({
      baseFare,
      distanceFare,
      peakSurcharge,
      totalFare,
    })
  }

  const processPayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Store payment data for confirmation page
    const paymentData = {
      type: "bus",
      merchantId: busData!.merchantId,
      route: busData!.routeName,
      station: selectedStation.name,
      fare: fareCalculation!.totalFare,
      operator: busData!.operator,
      busNumber: busData!.busNumber,
    }

    sessionStorage.setItem("paypass_payment_data", JSON.stringify(paymentData))
    router.push("/payment-success")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bus route information...</p>
        </div>
      </div>
    )
  }

  if (!busData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error loading bus data</p>
          <Link href="/unified-scanner">
            <Button className="mt-4">Back to Scanner</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/unified-scanner" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Bus Payment</h1>
              <p className="text-blue-100">Dynamic Route & Drop-off</p>
            </div>
          </div>

          {/* Bus Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Bus className="w-6 h-6 text-white" />
                <div>
                  <h3 className="font-semibold text-white">{busData.routeName}</h3>
                  <p className="text-blue-100 text-sm">
                    {busData.operator} • {busData.busNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Route className="w-3 h-3 mr-1" />
                  {busData.routeId}
                </Badge>
                {busData.isPeakHour && (
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Peak Hour
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 py-6">
          {!selectedStation ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Select Drop-off Station</h2>
                <p className="text-gray-600">Choose where you want to get off</p>
              </div>

              <div className="space-y-3">
                {busData.stations.slice(1).map((station) => (
                  <Card
                    key={station.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
                    onClick={() => selectStation(station)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">{station.order}</span>
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
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Bus Payment</h2>
                <p className="text-gray-600">Review your journey and fare</p>
              </div>

              {/* Journey Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Journey Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From</span>
                    <span className="font-medium">Harare CBD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To</span>
                    <span className="font-medium">{selectedStation.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance</span>
                    <span className="font-medium">{selectedStation.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Time</span>
                    <span className="font-medium">{selectedStation.estimatedTime} min</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fare Breakdown */}
              {fareCalculation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fare Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Fare</span>
                      <span>${fareCalculation.baseFare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance Charge</span>
                      <span>${fareCalculation.distanceFare.toFixed(2)}</span>
                    </div>
                    {fareCalculation.peakSurcharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center">
                          Peak Hour Surcharge
                          <Zap className="w-3 h-3 ml-1 text-orange-500" />
                        </span>
                        <span className="text-orange-600">+${fareCalculation.peakSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Fare</span>
                      <span className="text-blue-600">${fareCalculation.totalFare.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                      Pay ${fareCalculation?.totalFare.toFixed(2)}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSelectedStation(null)}
                  className="w-full"
                  disabled={isProcessing}
                >
                  Change Destination
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
