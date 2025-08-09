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
import Link from "next/link"
import { UserPlus, ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    pin: "",
    confirmPin: "",
    biometricEnabled: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match")
      return
    }
    if (formData.pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await register({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        pin: formData.pin,
        biometricEnabled: formData.biometricEnabled,
      })
      router.push("/dashboard")
    } catch (e: any) {
      setError(e?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-16 pb-10">
        <div className="max-w-md mx-auto px-6">
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

      <div className="max-w-md mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label>Phone Number</Label>
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
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label>PIN</Label>
                <Input
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pin: e.target.value }))}
                  placeholder="4-digit PIN"
                  required
                />
              </div>

              <div>
                <Label>Confirm PIN</Label>
                <Input
                  type="password"
                  value={formData.confirmPin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPin: e.target.value }))}
                  placeholder="Confirm your PIN"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="biometric"
                  checked={formData.biometricEnabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, biometricEnabled: !!checked }))}
                />
                <Label htmlFor="biometric" className="text-sm">
                  Enable biometric authentication
                </Label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

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
    </main>
  )
}
