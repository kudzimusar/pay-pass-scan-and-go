"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState("")
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!phone || !pin) {
      setError("Please enter both phone number and PIN")
      return
    }

    try {
      const success = await login(phone, pin)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Invalid phone number or PIN")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    }
  }

  const demoCredentials = [
    { phone: "+263 772 630 634", pin: "1234", role: "User Account" },
    { phone: "+263 773 456 789", pin: "9876", role: "Operator Account" },
    { phone: "+263 775 678 901", pin: "0000", role: "Admin Account" },
  ]

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCredential(`${type}-${text}`)
      setTimeout(() => setCopiedCredential(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const fillCredentials = (phone: string, pin: string) => {
    setPhone(phone)
    setPin(pin)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-12 text-white">
          <div className="text-center">
            {/* PayPass Logo */}
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-2 gap-1 w-12 h-12">
                <div className="bg-white rounded-sm"></div>
                <div className="bg-white/80 rounded-sm"></div>
                <div className="bg-white/60 rounded-sm"></div>
                <div className="bg-white rounded-sm"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">PayPass</h1>
            <p className="text-blue-100">Your Digital Wallet</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+263 772 630 634"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your 4-digit PIN"
                  maxLength={4}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Demo Accounts</h3>
            <div className="space-y-3">
              {demoCredentials.map((cred, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cred.role}</p>
                    <p className="text-gray-600">
                      {cred.phone} • PIN: {cred.pin}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => copyToClipboard(cred.phone, "phone")}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy phone"
                    >
                      {copiedCredential === `phone-${cred.phone}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => fillCredentials(cred.phone, cred.pin)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <Link href="/demo-credentials" className="text-blue-600 text-sm hover:underline">
              View All Demo Credentials
            </Link>
            <div className="text-xs text-gray-500">
              <p>© 2024 PayPass. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
