"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const [phone, setPhone] = useState("+263 772630634")
  const [pin, setPin] = useState("1234")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!phone || !pin) {
      setError("Please enter both phone and PIN")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\s/g, ""), pin }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.account))

        // Route based on role
        if (data.role === "operator") {
          router.push("/operator")
        } else if (data.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-paypass px-8 py-16 text-center">
        {/* PayPass Logo */}
        <div className="paypass-logo mx-auto mb-6">
          <div className="paypass-logo-square"></div>
          <div className="paypass-logo-square"></div>
          <div className="paypass-logo-square"></div>
          <div className="paypass-logo-square"></div>
        </div>

        {/* Brand Text */}
        <h1 className="text-4xl font-bold text-white mb-2">PayPass</h1>
        <p className="text-xl text-white/80 font-light">Scan and Go</p>
      </div>

      {/* Login Form Section */}
      <div className="px-8 py-12">
        {/* Welcome Text */}
        <div className="text-center mb-12">
          <h2 className="paypass-heading mb-3">Welcome Back</h2>
          <p className="paypass-subheading">Enter your phone number to continue</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Phone Number Input */}
          <div>
            <label className="paypass-label">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="paypass-input"
              placeholder="+263 772630634"
            />
          </div>

          {/* PIN Input */}
          <div>
            <label className="paypass-label">PIN</label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="paypass-input"
              placeholder="••••"
              maxLength={4}
            />
          </div>

          {/* Error Message */}
          {error && <div className="status-error p-4 rounded-xl text-sm font-medium">{error}</div>}

          {/* Sign In Button */}
          <Button onClick={handleLogin} disabled={isLoading} className="paypass-btn-primary mt-8">
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>

          {/* Forgot PIN Link */}
          <div className="text-center mt-6">
            <Link href="/forgot-pin" className="paypass-link">
              Forgot PIN?
            </Link>
          </div>

          {/* Create Account Section */}
          <div className="text-center mt-12 pt-6">
            <p className="text-gray-600 mb-2">New to PayPass?</p>
            <Link href="/signup" className="paypass-link text-lg">
              Create Account
            </Link>
          </div>

          {/* Demo Credentials Link */}
          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <Link href="/demo-credentials" className="text-sm text-gray-500 hover:text-gray-700">
              View Demo Credentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
