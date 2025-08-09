"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useState } from "react"
import { apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, Wallet, CreditCard } from "lucide-react"

const TOP_UP_METHODS = [
  { id: "ecocash", name: "EcoCash", icon: "📱" },
  { id: "telecash", name: "TeleCash", icon: "📞" },
  { id: "onemoney", name: "OneMoney", icon: "💰" },
  { id: "mukuru", name: "Mukuru", icon: "🌍" },
  { id: "worldremit", name: "WorldRemit", icon: "🌎" },
]

export default function TopUpPage() {
  const { token } = useAuth()
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<"USD" | "ZWL">("USD")
  const [method, setMethod] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("Please sign in first")
      return
    }
    if (!amount || !method) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await apiPost<{ success: boolean; message: string }>(
        "/api/wallet/topup",
        {
          amount: Number.parseFloat(amount),
          currency,
          method,
        },
        token,
      )
      setMessage(response.message || "Top-up successful!")
      setAmount("")
      setMethod("")
    } catch (e: any) {
      setError(e?.message || "Top-up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-14 pb-8 px-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Top Up Wallet
            </h1>
            <p className="text-emerald-100 text-sm">Add money to your account</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <Label>Currency</Label>
                <RadioGroup
                  value={currency}
                  onValueChange={(v) => setCurrency(v as "USD" | "ZWL")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="usd" value="USD" />
                    <Label htmlFor="usd">USD ($)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="zwl" value="ZWL" />
                    <Label htmlFor="zwl">ZWL (Z$)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOP_UP_METHODS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="flex items-center gap-2">
                          <span>{m.icon}</span>
                          {m.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Processing..." : `Top Up ${currency === "USD" ? "$" : "Z$"}${amount || "0"}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full bg-transparent">
              Back to Wallet
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant="ghost" className="w-full">
              View History
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
