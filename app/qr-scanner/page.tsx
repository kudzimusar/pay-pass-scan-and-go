"use client"

import { useAuth } from "@/components/auth-provider"
import { useState } from "react"
import { apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { QrCode } from 'lucide-react'

type ScanResult = {
  route: { id: string; name: string; fareUsd: string; fareZwl: string }
  operator: { id: string; companyName: string } | null
}

export default function QRScannerPage() {
  const { token } = useAuth()
  const [qr, setQr] = useState("PP_DEMO_ROUTE_A")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [currency, setCurrency] = useState<"USD" | "ZWL">("USD")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onScan = async () => {
    if (!token) {
      setError("Please sign in first.")
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await apiPost<ScanResult>("/api/qr/scan", { qrCode: qr }, token)
      setResult(res)
    } catch (e: any) {
      setError(e?.message || "Scan failed")
    } finally {
      setLoading(false)
    }
  }

  const onPay = async () => {
    if (!token || !result) return
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const amount = currency === "USD" ? result.route.fareUsd : result.route.fareZwl
      const resp = await apiPost<{ success: boolean; message: string }>(
        "/api/payment/process",
        { routeId: result.route.id, currency, amount, paymentMethod: "wallet" },
        token
      )
      setMessage(resp.message || "Payment successful")
      setResult(null)
    } catch (e: any) {
      setError(e?.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-14 pb-8 px-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan & Pay
        </h1>
        <p className="text-emerald-100 text-sm">Enter or scan a QR code to pay</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulate QR Scan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>QR Code</Label>
              <Input value={qr} onChange={(e) => setQr(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Try PP_DEMO_ROUTE_A or PP_DEMO_ROUTE_B</p>
            </div>
            <Button onClick={onScan} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Scanning..." : "Scan"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{result.route.name}</p>
                <p className="text-sm text-gray-500">Operator: {result.operator?.companyName || "Unknown"}</p>
              </div>
              <div>
                <Label>Currency</Label>
                <RadioGroup value={currency} onValueChange={(v) => setCurrency(v as "USD" | "ZWL")} className="flex gap-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="usd" value="USD" />
                    <Label htmlFor="usd">USD (${result.route.fareUsd})</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="zwl" value="ZWL" />
                    <Label htmlFor="zwl">ZWL (Z${result.route.fareZwl})</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button onClick={onPay} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Processing..." : "Pay Now"}
              </Button>
            </CardContent>
          </Card>
        )}

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </main>
  )
}
