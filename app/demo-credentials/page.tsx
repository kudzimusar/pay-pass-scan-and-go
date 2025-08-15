"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Check, User, Briefcase, Shield } from "lucide-react"

export default function DemoCredentialsPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const demoAccounts = [
    {
      role: "User Account",
      description: "Regular customer account with wallet features",
      phone: "+263 772 630 634",
      pin: "1234",
      balance: "$250.75",
      icon: User,
      color: "bg-blue-100 text-blue-600",
      features: ["Send/Receive Money", "Pay Bills", "QR Payments", "Transaction History"],
    },
    {
      role: "Operator Account",
      description: "Transport operator for route management",
      phone: "+263 773 456 789",
      pin: "9876",
      balance: "$1,500.00",
      icon: Briefcase,
      color: "bg-green-100 text-green-600",
      features: ["Route Management", "Passenger Payments", "Revenue Tracking", "Driver Dashboard"],
    },
    {
      role: "Admin Account",
      description: "System administrator with full access",
      phone: "+263 775 678 901",
      pin: "0000",
      balance: "$5,000.00",
      icon: Shield,
      color: "bg-purple-100 text-purple-600",
      features: ["User Management", "System Analytics", "Transaction Monitoring", "Settings Control"],
    },
  ]

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(`${type}-${text}`)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Demo Credentials</h1>
              <p className="text-blue-100">Test accounts for PayPass</p>
            </div>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="px-6 py-6">
          <div className="space-y-6">
            {demoAccounts.map((account, index) => {
              const IconComponent = account.icon
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  {/* Account Header */}
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${account.color} mr-4`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.role}</h3>
                      <p className="text-sm text-gray-600">{account.description}</p>
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone Number</p>
                        <p className="text-lg font-mono">{account.phone}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(account.phone, "phone")}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy phone number"
                      >
                        {copiedItem === `phone-${account.phone}` ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">PIN</p>
                        <p className="text-lg font-mono">{account.pin}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(account.pin, "pin")}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy PIN"
                      >
                        {copiedItem === `pin-${account.pin}` ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Demo Balance</p>
                      <p className="text-lg font-semibold text-green-600">{account.balance}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Features:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {account.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">📋 How to Use</h3>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Copy the phone number and PIN from any account above</li>
              <li>Go back to the login page</li>
              <li>Paste the credentials and sign in</li>
              <li>Explore the features available for that account type</li>
            </ol>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">🔒 Demo Environment</h3>
            <p className="text-sm text-blue-700">
              These are demo accounts for testing purposes only. No real money or transactions are involved. All data is
              simulated and will reset when you refresh the application.
            </p>
          </div>

          {/* Back to Login */}
          <div className="mt-6">
            <Link
              href="/"
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
