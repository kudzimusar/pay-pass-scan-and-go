"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"

export default function SendMoneyPage() {
  const { token } = useAuth()
  const [formData, setFormData] = useState({
    phone: "",
    amount: "",
    currency: "USD" as "USD" | "ZWL",
    note: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("Please sign in first")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      // This would call a P2P transfer API endpoint
      // For now, we'll simulate success
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setMessage(
        `Successfully sent ${formData.currency === "USD" ? "$" : "Z$"}${formData.amount} to +263${formData.phone}`,
      )
      setFormData({ phone: "", amount: "", currency: "USD", note: "" })
    } catch (e: any) {
      setError(e?.message || "Transfer failed")
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
              <Send className="h-5 w-5" />
              Send Money
            </h1>
            <p className="text-emerald-100 text-sm">Transfer to friends & family</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Recipient Phone</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    +263
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="771234567"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <Label>Currency</Label>
                <RadioGroup
                  value={formData.currency}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, currency: v as "USD" | "ZWL" }))}
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
                <Label>Note (Optional)</Label>
                <Input
                  value={formData.note}
                  onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="What's this for?"
                />
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
                {loading ? "Sending..." : `Send ${formData.currency === "USD" ? "$" : "Z$"}${formData.amount || "0"}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Transfers are instant and secure. Recipients will be notified immediately.
          </p>
        </div>
      </div>
    </main>
  )
}
