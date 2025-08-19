"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Camera,
  QrCode,
  Bus,
  Car,
  Store,
  Zap,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Scan,
} from "lucide-react"

interface QRPayload {
  merchantType: "bus" | "taxi" | "retail"
  merchantId: string
  routeId?: string
  merchantName?: string
  additionalParams?: Record<string, string>
}

interface ScanResult {
  success: boolean
  payload?: QRPayload
  error?: string
}

export default function UnifiedScannerPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Demo QR codes for testing
  const demoQRCodes = [
    {
      type: "bus",
      label: "ZUPCO Bus - Route CBD to Avondale",
      qrData: "paypass://bus/?id=BUS-ZE-4521&route_id=HAR-CBD-AVENUE&operator=ZUPCO",
      icon: Bus,
      color: "blue",
    },
    {
      type: "taxi",
      label: "Registered Taxi - License ABC-456",
      qrData: "paypass://taxi/?id=TAXI-ABC-456&driver=John_Mukamuri&license=ABC456ZW",
      icon: Car,
      color: "green",
    },
    {
      type: "retail",
      label: "OK Zimbabwe - Avondale Branch",
      qrData: "paypass://retail/?id=SHOP-OK-AVE789&merchant=OK_Zimbabwe&branch=Avondale",
      icon: Store,
      color: "purple",
    },
  ]

  const parseQRCode = (qrData: string): ScanResult => {
    try {
      // Parse PayPass QR format: paypass://[merchant_type]/?id=[unique_merchant_id]&[optional_params]
      const url = new URL(qrData)

      if (url.protocol !== "paypass:") {
        return {
          success: false,
          error: "Invalid QR code format. This is not a PayPass merchant code.",
        }
      }

      const merchantType = url.hostname as "bus" | "taxi" | "retail"
      const params = new URLSearchParams(url.search)
      const merchantId = params.get("id")

      if (!merchantId) {
        return {
          success: false,
          error: "Invalid QR code. Missing merchant ID.",
        }
      }

      if (!["bus", "taxi", "retail"].includes(merchantType)) {
        return {
          success: false,
          error: "Unsupported merchant type. PayPass supports bus, taxi, and retail payments.",
        }
      }

      // Extract additional parameters
      const additionalParams: Record<string, string> = {}
      params.forEach((value, key) => {
        if (key !== "id") {
          additionalParams[key] = value
        }
      })

      const payload: QRPayload = {
        merchantType,
        merchantId,
        additionalParams,
      }

      // Add specific fields based on merchant type
      if (merchantType === "bus" && params.get("route_id")) {
        payload.routeId = params.get("route_id")!
      }

      if (params.get("merchant")) {
        payload.merchantName = params.get("merchant")!.replace(/_/g, " ")
      }

      return {
        success: true,
        payload,
      }
    } catch (error) {
      return {
        success: false,
        error: "Invalid QR code format. Please scan a valid PayPass merchant code.",
      }
    }
  }

  const handleQRScan = async (qrData: string) => {
    setIsProcessing(true)

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const result = parseQRCode(qrData)
    setScanResult(result)
    setIsProcessing(false)

    if (result.success && result.payload) {
      // Auto-redirect after showing result for 2 seconds
      setTimeout(() => {
        routeToPaymentFlow(result.payload!)
      }, 2000)
    }
  }

  const routeToPaymentFlow = (payload: QRPayload) => {
    // Store scan data in session for the payment flow
    sessionStorage.setItem("paypass_scan_data", JSON.stringify(payload))

    switch (payload.merchantType) {
      case "bus":
        router.push("/bus-payment")
        break
      case "taxi":
        router.push("/taxi-payment")
        break
      case "retail":
        router.push("/retail-payment")
        break
      default:
        console.error("Unknown merchant type:", payload.merchantType)
    }
  }

  const startCamera = () => {
    setIsScanning(true)
    setScanResult(null)
  }

  const getMerchantIcon = (type: string) => {
    switch (type) {
      case "bus":
        return Bus
      case "taxi":
        return Car
      case "retail":
        return Store
      default:
        return QrCode
    }
  }

  const getMerchantColor = (type: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">PayPass Scanner</h1>
              <p className="text-blue-100">Scan & Go - Universal Payment</p>
            </div>
          </div>

          {/* Feature Badge */}
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-medium">Smart QR Detection</span>
            </div>
            <p className="text-blue-100 text-sm mt-1">Automatically detects bus, taxi, or retail payments</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Scanner Interface */}
          {!scanResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Universal QR Scanner</h2>
                <p className="text-gray-600">Scan any PayPass merchant QR code to pay instantly</p>
              </div>

              {!isScanning ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h3>
                    <p className="text-gray-600 mb-4">Point your camera at any PayPass QR code</p>
                    <Button onClick={startCamera} className="w-full" size="lg">
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

              {/* Demo QR Codes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Try Demo QR Codes</h3>
                <div className="space-y-3">
                  {demoQRCodes.map((demo, index) => {
                    const IconComponent = demo.icon
                    return (
                      <Card
                        key={index}
                        className="cursor-pointer hover:shadow-md transition-all border-l-4"
                        style={{
                          borderLeftColor:
                            demo.color === "blue" ? "#3B82F6" : demo.color === "green" ? "#10B981" : "#8B5CF6",
                        }}
                        onClick={() => handleQRScan(demo.qrData)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                demo.color === "blue"
                                  ? "bg-blue-100"
                                  : demo.color === "green"
                                    ? "bg-green-100"
                                    : "bg-purple-100"
                              }`}
                            >
                              <IconComponent
                                className={`w-5 h-5 ${
                                  demo.color === "blue"
                                    ? "text-blue-600"
                                    : demo.color === "green"
                                      ? "text-green-600"
                                      : "text-purple-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{demo.label}</h4>
                              <p className="text-sm text-gray-500 capitalize">{demo.type} Payment</p>
                            </div>
                            <QrCode className="w-5 h-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Instructions */}
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  PayPass automatically detects the merchant type and switches to the appropriate payment flow.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className="space-y-6">
              {scanResult.success && scanResult.payload ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Detected!</h2>
                  <p className="text-gray-600">Switching to payment flow...</p>

                  {/* Merchant Info */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-center space-x-2">
                        {(() => {
                          const IconComponent = getMerchantIcon(scanResult.payload.merchantType)
                          return <IconComponent className="w-6 h-6" />
                        })()}
                        <span className="capitalize">{scanResult.payload.merchantType} Payment</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Merchant ID</span>
                        <span className="font-mono text-sm">{scanResult.payload.merchantId}</span>
                      </div>

                      {scanResult.payload.merchantName && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Merchant</span>
                          <span className="font-medium">{scanResult.payload.merchantName}</span>
                        </div>
                      )}

                      {scanResult.payload.routeId && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Route</span>
                          <span className="font-medium">{scanResult.payload.routeId}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <Badge
                          variant="secondary"
                          className={`${
                            getMerchantColor(scanResult.payload.merchantType) === "blue"
                              ? "bg-blue-100 text-blue-800"
                              : getMerchantColor(scanResult.payload.merchantType) === "green"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {scanResult.payload.merchantType.toUpperCase()} PAYMENT
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auto-redirect message */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Redirecting to {scanResult.payload.merchantType} payment flow...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h2>
                  <p className="text-gray-600 mb-6">{scanResult.error}</p>

                  <Button onClick={() => setScanResult(null)} className="w-full">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
