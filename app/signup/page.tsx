"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { UserPlus, ArrowLeft, AlertCircle } from "lucide-react"

// Phone number normalization for signup
function normalizePhoneForSignup(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.startsWith("263")) {
    return "+" + cleaned
  } else if (cleaned.startsWith("0")) {
    return "+263" + cleaned.substring(1)
  } else if (cleaned.length === 9 && cleaned.startsWith("7")) {
    return "+263" + cleaned
  } else {
    return "+263" + cleaned
  }
}

export default function SignupPage() {
  const { signup } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validation
      if (!name.trim()) {
        throw new Error("Full name is required")
      }

      if (!phone.trim()) {
        throw new Error("Phone number is required")
      }

      if (pin.length < 4) {
        throw new Error("PIN must be at least 4 digits")
      }

      if (pin !== confirmPin) {
        throw new Error("PINs do not match")
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneForSignup(phone)
      console.log("Signup with normalized phone:", normalizedPhone)

      await signup(name.trim(), normalizedPhone, pin, biometricEnabled)

      // Success - user will be automatically logged in and redirected
      console.log("Signup successful, redirecting to dashboard")
      router.push("/dashboard")
    } catch (e: any) {
      console.error("Signup error:", e)
      setError(e?.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-16 pb-10">
          <div className="px-6">
            <Link href="/" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-3" />
              <h1 className="text-3xl font-bold">Create Account</h1>
              <p className="text-emerald-100">Join PayPass Scan & Go</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="772160634"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your phone number (e.g., 772160634, 0772160634, or +263772160634)
                  </p>
                </div>

                <div>
                  <Label>PIN</Label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="4-digit PIN"
                    minLength={4}
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <Label>Confirm PIN</Label>
                  <Input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Confirm your PIN"
                    minLength={4}
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biometric"
                    checked={biometricEnabled}
                    onCheckedChange={(checked) => setBiometricEnabled(!!checked)}
                  />
                  <Label htmlFor="biometric" className="text-sm">
                    Enable biometric authentication
                  </Label>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <p className="text-sm text-gray-600 mt-4 text-center">
                Already have an account?{" "}
                <Link href="/" className="text-emerald-700 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
