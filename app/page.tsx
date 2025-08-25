"use client"
import { useState, useEffect } from "react"
import type React from "react"
<<<<<<< HEAD
=======
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
>>>>>>> origin/main

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Smartphone, Shield, AlertCircle, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, login, isLoading: authLoading } = useAuth()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

<<<<<<< HEAD
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Format as needed - just return the digits for now
    return digits
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
=======
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
>>>>>>> origin/main
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("Attempting login with phone:", phone)

      // Get all possible phone number formats
      const phoneFormats = normalizePhoneNumber(phone)
      console.log("Trying phone formats:", phoneFormats)

<<<<<<< HEAD
      console.log("Login response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Login error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Login successful:", data.user?.fullName)

      if (data.success && data.token) {
        // Store auth token and user data
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user_data", JSON.stringify(data.user))

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "Connection error. Please try again.")
=======
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
>>>>>>> origin/main
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PayPass</h1>
          <p className="text-gray-600">Secure mobile payments made simple</p>
        </div>

        {/* Demo Credentials Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Demo Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Phone:</span>
                <Badge variant="secondary" className="font-mono">
                  +263771234567
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">PIN:</span>
                <Badge variant="secondary" className="font-mono">
                  1234
                </Badge>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">Use these credentials to explore the demo</p>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your phone number and PIN to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Number Input */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="771234567 or +263771234567"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="text-lg"
                  required
                />
                <p className="text-xs text-gray-500">Enter your phone number with or without country code</p>
              </div>

              {/* PIN Input */}
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium text-gray-700">
                  PIN
                </label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    placeholder="Enter your 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-lg pr-10"
                    maxLength={4}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

<<<<<<< HEAD
              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Secure & Private</h3>
                <p className="text-xs text-green-700 mt-1">
                  Your data is encrypted and stored securely. We never share your personal information.
                </p>
=======
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
>>>>>>> origin/main
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <button className="hover:text-blue-600">Need Help?</button>
            <span>•</span>
            <button className="hover:text-blue-600">Privacy Policy</button>
          </div>
          <p className="text-xs text-gray-500">© 2024 PayPass. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
