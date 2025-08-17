"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, FileText, Zap, Droplets, Phone } from "lucide-react"

const BILL_TYPES = [
  { id: "electricity", name: "Electricity (ZESA)", icon: Zap },
  { id: "water", name: "Water Bills", icon: Droplets },
  { id: "airtime", name: "Airtime", icon: Phone },
]

export default function PayBillsPage() {
  const [formData, setFormData] = useState({
    billType: "",
    accountNumber: "",
    amount: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      // Simulate bill payment
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setMessage(
        `Successfully paid $${formData.amount} for ${BILL_TYPES.find((b) => b.id === formData.billType)?.name}`,
      )
      setFormData({ billType: "", accountNumber: "", amount: "" })
    } catch (e: any) {
      setError(e?.message || "Payment failed")
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
              <FileText className="h-5 w-5" />
              Pay Bills
            </h1>
            <p className="text-emerald-100 text-sm">Utilities and services</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Bill Type</Label>
                <Select
                  value={formData.billType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, billType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bill type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_TYPES.map((bill) => {
                      const Icon = bill.icon
                      return (
                        <SelectItem key={bill.id} value={bill.id}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {bill.name}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account/meter number"
                  required
                />
              </div>

              <div>
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  required
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

              <Button
                type="submit"
                disabled={loading || !formData.billType}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? "Processing..." : `Pay $${formData.amount || "0"}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">Bill payments are processed instantly. Keep your receipt for records.</p>
        </div>
      </div>
    </main>
  )
}
