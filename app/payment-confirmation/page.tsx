"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type ScanInfo = {
  route: { id: string; name: string; fareUsd: string; fareZwl: string }
  operator: { id: string; companyName: string } | null
}

export default function PaymentConfirmationPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [scanInfo, setScanInfo] = useState<ScanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<"USD" | "ZWL">("USD")

  useEffect(() => {
    const run = async () => {
      const qr = sessionStorage.getItem("scanQR")
      if (!qr) {
        router.replace("/qr-scanner")
        return
      }
      try {
        const data = await apiPost<ScanInfo>("/api/qr/scan", { qrCode: qr }, token!)
        setScanInfo(data)
        setLoading(false)
      } catch {
        router.replace("/qr-scanner")
      }
    }
    run()
  }, [router, token])

  const amount = useMemo(() => {
    if (!scanInfo) return "0.00"
    return currency === "USD" ? scanInfo.route.fareUsd : scanInfo.route.fareZwl
  }, [currency, scanInfo])

  const confirm = async () => {
    if (!scanInfo) return
    await apiPost("/api/payment/process", {
      routeId: scanInfo.route.id,
      currency,
      amount,
      paymentMethod: "wallet",
    }, token!)
    router.replace("/payment-success")
  }

  if (loading) {
    return (
      <main className="min-h-svh grid place-items-center">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="max-w-md mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Confirm Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-gray-500">Operator</p>
              <p className="font-medium text-gray-900">
                {scanInfo?.operator?.companyName ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Route</p>
              <p className="font-medium text-gray-900">{scanInfo?.route.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Select currency</p>
              <RadioGroup
                value={currency}
                onValueChange={(v) => setCurrency(v as any)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="usd" value="USD" />
                  <Label htmlFor="usd">USD (${scanInfo?.route.fareUsd})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="zwl" value="ZWL" />
                  <Label htmlFor="zwl">ZWL ({scanInfo?.route.fareZwl})</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Amount</span>
              <span className="text-lg font-semibold">
                {currency === "USD" ? "$" : "ZWL "}{amount}
              </span>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={confirm}>
              Confirm and Pay
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.replace("/qr-scanner")}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
