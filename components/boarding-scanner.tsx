"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Camera, QrCode } from "lucide-react"

interface BoardingResult {
  success: boolean
  message: string
  data?: {
    ticketNumber: string
    boardingTime: string
    deviceId: string
    status: string
  }
}

export default function BoardingScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<BoardingResult | null>(null)
  const [testQRData, setTestQRData] = useState("")

  const simulateScan = async () => {
    setIsScanning(true)
    setScanResult(null)

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      // Simulate scanning a QR code
      const mockQRData = "PAYPASS_TICKET:TKT-123456:1756175768595:2024-01-27T00:00:00.000Z"
      
      const response = await fetch('/api/boarding/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: 'TKT-123456',
          qrData: mockQRData,
          timestamp: new Date().toISOString(),
          deviceId: 'demo-scanner-001'
        })
      })

      const result = await response.json()
      setScanResult(result)
      setTestQRData(mockQRData)
    } catch (error) {
      console.error('Scanning error:', error)
      setScanResult({
        success: false,
        message: 'Failed to scan QR code'
      })
    } finally {
      setIsScanning(false)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setTestQRData("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Boarding Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Point scanner at passenger's QR code to validate boarding
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={simulateScan} 
              className="flex-1" 
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Scan QR Code
                </>
              )}
            </Button>
            
            {scanResult && (
              <Button onClick={resetScanner} variant="outline">
                Reset
              </Button>
            )}
          </div>

          {scanResult && (
            <Card className={scanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {scanResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h4 className="font-medium">
                    {scanResult.success ? "Boarding Validated" : "Validation Failed"}
                  </h4>
                </div>
                
                <p className="text-sm mb-3">
                  {scanResult.message}
                </p>

                {scanResult.success && scanResult.data && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket:</span>
                      <span className="font-mono">{scanResult.data.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Boarding Time:</span>
                      <span>{new Date(scanResult.data.boardingTime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="outline" className="text-green-600">
                        {scanResult.data.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {testQRData && (
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                    <strong>QR Data:</strong> {testQRData}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
