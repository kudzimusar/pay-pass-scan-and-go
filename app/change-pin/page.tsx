"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ChangePinPage() {
  const router = useRouter()
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!currentPin || !newPin || !confirmPin) return setError("All fields are required")
    if (newPin !== confirmPin) return setError("New PINs do not match")
    if (newPin.length < 4) return setError("PIN must be at least 4 digits")
    try {
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch("/api/auth/pin/change", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPin, newPin }),
      })
      if (!res.ok) {
        const text = await res.text()
        try {
          const maybe = text.trim().startsWith("{") ? JSON.parse(text) : null
          throw new Error(maybe?.error || text || `HTTP ${res.status}`)
        } catch (e: any) {
          throw new Error(e?.message || text)
        }
      }
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) throw new Error("Invalid server response")
      const data = await res.json()
      if (data.success) {
        setSuccess("PIN changed successfully")
        setCurrentPin("")
        setNewPin("")
        setConfirmPin("")
        setTimeout(() => router.push("/settings"), 1200)
      } else {
        setError(data.error || "Failed to change PIN")
      }
    } catch (e: any) {
      setError(e?.message || "Failed to change PIN")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow">
        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          <Card>
            <CardContent className="p-4 space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Current PIN</label>
                  <Input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm mb-1">New PIN</label>
                  <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Confirm New PIN</label>
                  <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Change PIN</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
