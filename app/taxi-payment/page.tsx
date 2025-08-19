"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Car, User, DollarSign, CreditCard, CheckCircle, AlertCircle, Phone, Shield } from "lucide-react"

interface TaxiPaymentData {
  merchantId: string
  driverName: string
  licenseNumber: string
  phoneNumber: string
  vehicleDetails: string
}

export default function TaxiPaymentPage() {
  const router = useRouter()
  const [taxiData, setTaxiData] = useState<TaxiPaymentData | null>(null)
  const [negotiatedFare, setNegotiatedFare] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"negotiate" | "confirm">("negotiate")

  useEffect(() => {
    // Get scan data from session storage
    const scanData = sessionStorage.getItem("paypass_scan_data")
    if (!scanData) {
      router.push("/unified-scanner")
      return
    }

    try {
      const payload = JSON.parse(scanData)
      if (payload.merchantType !== "taxi") {
        router.push("/unified-scanner")
        return
      }

      // Simulate loading taxi data
      setTimeout(() => {
        setTaxiData({
          merchantId: payload.merchantId,
          driverName: payload.additionalParams?.driver?.replace(/_/g, " ") || "Unknown Driver",
          licenseNumber: payload.additionalParams?.license || "Unknown",
          phoneNumber: "+263 77 123 4567", // Mock phone number
          vehicleDetails: payload.merchantId.replace("TAXI-", "License: "),
        })
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      router.push("/unified-scanner")
    }
  }, [router])

  const handleFareConfirmation = () => {
    const fare = Number.parseFloat(negotiatedFare)
    if (isNaN(fare) || fare <= 0) {
      alert("Please enter a valid fare amount")
      return
    }
    if (fare > 100) {
      alert("Fare amount seems too high. Please confirm with the driver.")
      return
    }
    setStep("confirm")
  }

  const processPayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Store payment data for confirmation page
    const paymentData = {
      type: "taxi",
      merchantId: taxiData!.merchantId,
      driverName: taxiData!.driverName,
      licenseNumber: taxiData!.licenseNumber,
      fare: Number.parseFloat(negotiatedFare),
      vehicleDetails: taxiData!.vehicleDetails,
    }

    sessionStorage.setItem("paypass_payment_data", JSON.stringify(paymentData))
    router.push("/payment-success")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading taxi information...</p>
        </div>
      </div>
    )
  }

  if (!taxiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error loading taxi data</p>
          <Link href="/unified-scanner">
            <Button className="mt-4">Back to Scanner</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/unified-scanner" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Taxi Payment</h1>
              <p className="text-green-100">Negotiated Fare System</p>
            </div>
          </div>

          {/* Taxi Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Car className="w-6 h-6 text-white" />
                <div>
                  <h3 className="font-semibold text-white">{taxiData.driverName}</h3>
                  <p className="text-green-100 text-sm">{taxiData.vehicleDetails}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified Driver
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 py-6">
          {step === "negotiate" ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Negotiated Fare</h2>
                <p className="text-gray-600">Confirm the fare amount agreed with the driver</p>
              </div>

              {/* Driver Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{taxiData.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License</span>
                    <span className="font-medium">{taxiData.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact</span>
                    <span className="font-medium flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {taxiData.phoneNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle</span>
                    <span className="font-medium">{taxiData.vehicleDetails}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fare Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fare Amount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fare">Agreed Fare (USD)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fare"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        value={negotiatedFare}
                        onChange={(e) => setNegotiatedFare(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please confirm the fare amount with your driver before proceeding.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleFareConfirmation}
                disabled={!negotiatedFare || Number.parseFloat(negotiatedFare) <= 0}
                className="w-full"
                size="lg"
              >
                Confirm Fare Amount
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Taxi Payment</h2>
                <p className="text-gray-600">Review your payment details</p>
              </div>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver</span>
                    <span className="font-medium">{taxiData.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle</span>
                    <span className="font-medium">{taxiData.vehicleDetails}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License</span>
                    <span className="font-medium">{taxiData.licenseNumber}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Fare</span>
                      <span className="text-green-600">${Number.parseFloat(negotiatedFare).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      Pay ${Number.parseFloat(negotiatedFare).toFixed(2)}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStep("negotiate")}
                  className="w-full"
                  disabled={isProcessing}
                >
                  Change Fare Amount
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
