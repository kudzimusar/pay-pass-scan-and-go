"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { Smartphone, CreditCard, QrCode, Users, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react"

// Multiple phone number normalization strategies
function normalizePhoneNumber(phone: string): string[] {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "")
  const formats: string[] = []

  console.log("Normalizing phone:", phone, "-> cleaned:", cleaned)

  // Strategy 1: If it already starts with 263, use as is
  if (cleaned.startsWith("263")) {
    formats.push("+" + cleaned)
  }

  // Strategy 2: If it starts with 0, replace with +263
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    formats.push("+263" + cleaned.slice(1))
  }

  // Strategy 3: If it's 9 digits, assume it's missing the 0
  if (cleaned.length === 9) {
    formats.push("+263" + cleaned)
  }

  // Strategy 4: If it's 12 digits starting with 263
  if (cleaned.length === 12 && cleaned.startsWith("263")) {
    formats.push("+" + cleaned)
  }

  // Strategy 5: Add the original cleaned number with +263 prefix
  if (!cleaned.startsWith("263")) {
    formats.push("+263" + cleaned)
  }

  console.log("Generated formats:", formats)
  return formats
}

export default function Home() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPin, setShowPin] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Try multiple phone number formats
      const phoneFormats = normalizePhoneNumber(phone)
      let success = false
      let lastError = ""

      for (const phoneFormat of phoneFormats) {
        try {
          console.log("Trying login with phone format:", phoneFormat)
          await login(phoneFormat, pin)
          success = true
          break
        } catch (err: any) {
          console.log("Login failed for format:", phoneFormat, "Error:", err.message)
          lastError = err.message
          continue
        }
      }

      if (!success) {
        throw new Error(lastError || "Login failed with all phone number formats")
      }

      // Success - redirect handled by auth provider
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const quickLoginData = [
    { phone: "+263771234567", pin: "1234", name: "John Doe (Diaspora User)" },
    { phone: "+263772345678", pin: "2345", name: "Jane Smith (Local User)" },
    { phone: "+263773456789", pin: "3456", name: "Mike Johnson (Merchant)" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PayPass
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Seamless payments for everyone, everywhere. Send money to friends and family across borders with ease.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Login Form */}
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your PayPass account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    data-testid="phone"
                    type="tel"
                    placeholder="+263 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      data-testid="pin"
                      type={showPin ? "text" : "password"}
                      placeholder="Enter your 4-digit PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={4}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  data-testid="login-button"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    Sign up here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features & Quick Login */}
          <div className="space-y-6">
            {/* Quick Login */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Quick Demo Login</CardTitle>
                <CardDescription className="text-green-700">
                  Try PayPass with these demo accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickLoginData.map((demo, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">{demo.name}</p>
                        <p className="text-xs text-green-600">
                          Phone: {demo.phone} | PIN: {demo.pin}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhone(demo.phone)
                          setPin(demo.pin)
                        }}
                        className="shrink-0 border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold text-sm">Pay for Friends</h3>
                <p className="text-xs text-gray-600 mt-1">Send money to family abroad</p>
              </Card>
              <Card className="text-center p-4">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-sm">QR Payments</h3>
                <p className="text-xs text-gray-600 mt-1">Quick scan and pay</p>
              </Card>
              <Card className="text-center p-4">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-sm">Multi-Currency</h3>
                <p className="text-xs text-gray-600 mt-1">USD, ZWL, EUR support</p>
              </Card>
              <Card className="text-center p-4">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold text-sm">Mobile Money</h3>
                <p className="text-xs text-gray-600 mt-1">EcoCash integration</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <button className="hover:text-blue-600">Need Help?</button>
            <button className="hover:text-blue-600">Contact Support</button>
            <button className="hover:text-blue-600">Privacy Policy</button>
          </div>
          <p className="text-xs text-gray-500">© 2024 PayPass. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}