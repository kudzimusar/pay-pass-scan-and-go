"use client"

import type React from "react"
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
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    formats.push("+263" + cleaned.substring(1))
  }

  // Strategy 3: If it's 9 digits starting with 7, add +263
  if (cleaned.length === 9 && cleaned.startsWith("7")) {
    formats.push("+263" + cleaned)
  }

  // Strategy 4: If it's 10 digits starting with 77, remove first digit and add +263
  if (cleaned.length === 10 && cleaned.startsWith("77")) {
    formats.push("+263" + cleaned.substring(1))
  }

  // Strategy 5: Try original input as is
  if (phone.startsWith("+")) {
    formats.push(phone)
  }

  // Strategy 6: Add +263 to any remaining format
  if (!formats.some((f) => f.includes(cleaned))) {
    formats.push("+263" + cleaned)
  }

  // Remove duplicates
  return [...new Set(formats)]
}

export default function HomePage() {
  const router = useRouter()
  const { user, login, isLoading: authLoading } = useAuth()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log("User already logged in, redirecting to dashboard")
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  // Don't render if still checking auth or user is logged in
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Attempting login with:", { phone, pin: pin.length + " chars" })

      // Get all possible phone number formats
      const phoneFormats = normalizePhoneNumber(phone)
      console.log("Trying phone formats:", phoneFormats)

      let loginSuccessful = false
      let lastError = ""

      // Try each phone format until one works
      for (const phoneFormat of phoneFormats) {
        try {
          console.log("Trying phone format:", phoneFormat)

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone: phoneFormat, pin }),
          })

          console.log("Response status for", phoneFormat, ":", response.status)

          if (response.ok) {
            const data = await response.json()
            console.log("Login response data:", data)

            if (data.success && data.user && data.token) {
              console.log("Login successful with format:", phoneFormat)
              login(data.token, data.user)
              router.push("/dashboard")
              loginSuccessful = true
              break
            }
          } else {
            const errorData = await response.json()
            lastError = errorData.error || "Login failed"
            console.log("Login failed for", phoneFormat, ":", lastError)
          }
        } catch (formatError) {
          console.log("Error trying format", phoneFormat, ":", formatError)
          lastError = "Connection error"
        }
      }

      if (!loginSuccessful) {
        setError(lastError || "Invalid phone number or PIN. Please check your credentials.")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Unable to connect to server. Please check your internet connection.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-12 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PayPass</h1>
          <p className="text-blue-100">Your Digital Payment Solution</p>
        </div>

        {/* Features */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">Scan & Pay</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Digital Wallet</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium">Ask Friend to Pay</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ArrowRight className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium">Send Money</p>
            </div>
          </div>

          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your PayPass account</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="772160634"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter your phone number (e.g., 772160634, 0772160634, or +263772160634)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium">Demo Accounts Available:</p>
                  <div className="text-xs text-blue-600 mt-1 space-y-1">
                    <p>
                      Phone: <span className="font-mono">772160634</span> PIN: <span className="font-mono">1234</span>
                    </p>
                    <p>
                      Phone: <span className="font-mono">0772160634</span> PIN: <span className="font-mono">1234</span>
                    </p>
                    <p>
                      Phone: <span className="font-mono">+263772160634</span> PIN:{" "}
                      <span className="font-mono">1234</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
