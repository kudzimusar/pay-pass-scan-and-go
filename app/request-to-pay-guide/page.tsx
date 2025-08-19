"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Search,
  DollarSign,
  CheckCircle,
  Send,
  Bell,
  User,
  Clock,
  Smartphone,
  Zap,
  Shield,
  HandCoins,
} from "lucide-react"

export default function RequestToPayGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Request-to-Pay Guide</h1>
              <p className="text-purple-100">How to use the new feature</p>
            </div>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <HandCoins className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="font-semibold text-white">Request Money Instantly</h3>
              <p className="text-purple-100 text-sm">Send payment requests with real-time notifications</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 py-6">
          {/* Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-600" />
                What is Request-to-Pay?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">
                Request-to-Pay allows you to send payment requests to other PayPass users instantly. Perfect for:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="secondary" className="justify-center">
                  🚌 Bus Tickets
                </Badge>
                <Badge variant="secondary" className="justify-center">
                  🛒 Groceries
                </Badge>
                <Badge variant="secondary" className="justify-center">
                  ⚡ Utility Bills
                </Badge>
                <Badge variant="secondary" className="justify-center">
                  🚗 Shared Rides
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Journey - Requesting User */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-purple-600">👤 For Requesting User (Sender)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Find Contact</h4>
                  <p className="text-sm text-gray-600 mb-2">Search by name, phone number, or email</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Search className="w-3 h-3" />
                    <span>Real-time search results</span>
                  </div>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-gray-200 h-4"></div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Enter Details</h4>
                  <p className="text-sm text-gray-600 mb-2">Specify amount, bill type, and description</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <DollarSign className="w-3 h-3" />
                    <span>Up to $1000 per request</span>
                  </div>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-gray-200 h-4"></div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Send Request</h4>
                  <p className="text-sm text-gray-600 mb-2">Review and confirm your payment request</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Send className="w-3 h-3" />
                    <span>Instant delivery (max 10 seconds)</span>
                  </div>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-gray-200 h-4"></div>

              {/* Step 4 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Get Notified</h4>
                  <p className="text-sm text-gray-600 mb-2">Receive instant notification when responded</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Bell className="w-3 h-3" />
                    <span>Real-time status updates</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Journey - Recipient */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">👥 For Recipient (Payer)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Receive Notification</h4>
                  <p className="text-sm text-gray-600 mb-2">Get instant push notification of payment request</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Smartphone className="w-3 h-3" />
                    <span>Max 10 seconds delivery</span>
                  </div>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-gray-200 h-4"></div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Review Request</h4>
                  <p className="text-sm text-gray-600 mb-2">View amount, bill type, and sender details</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>Verified sender information</span>
                  </div>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-gray-200 h-4"></div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Make Decision</h4>
                  <p className="text-sm text-gray-600 mb-2">Accept & Pay or Decline the request</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>24 hours to respond</span>
                  </div>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-gray-200 h-4"></div>

              {/* Step 4 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Complete Payment</h4>
                  <p className="text-sm text-gray-600 mb-2">Enter PIN to confirm and complete payment</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Shield className="w-3 h-3" />
                    <span>Secure PIN verification</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">🔑 Key Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Real-time notifications (max 10 seconds)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">24-hour request expiration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Unified user search (name, phone, email)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Predefined bill types for easy categorization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Secure PIN verification for payments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Complete transaction history and receipts</span>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg text-green-800 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-green-800">✅ All requests require PIN verification for payment</p>
              <p className="text-sm text-green-800">✅ Automatic balance checking before payment</p>
              <p className="text-sm text-green-800">✅ Complete audit trail for all transactions</p>
              <p className="text-sm text-green-800">✅ Requests expire automatically after 24 hours</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Link href="/request-money">
              <Button className="w-full" size="lg">
                <HandCoins className="w-4 h-4 mr-2" />
                Try Request-to-Pay Now
              </Button>
            </Link>
            <Link href="/payment-requests">
              <Button variant="outline" className="w-full bg-transparent">
                <Bell className="w-4 h-4 mr-2" />
                View My Requests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
