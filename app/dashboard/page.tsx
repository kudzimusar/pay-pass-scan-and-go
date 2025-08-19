"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  DollarSign,
  Send,
  QrCode,
  CreditCard,
  History,
  Settings,
  Bell,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react"

interface PaymentRequest {
  id: string
  senderId: string
  receiverId: string
  amount: number
  description: string
  billType: string
  status: "pending" | "accepted" | "declined" | "expired"
  linkedTransactionId?: string
  expiresAt: string
  createdAt: string
  senderName: string
  senderPhone: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user_data")
    if (!userData) {
      router.push("/demo-login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchPendingRequests(parsedUser.id)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/demo-login")
    }
  }, [router])

  const fetchPendingRequests = async (userId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/requests/pending?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setPendingRequests(data.requests || [])
      } else {
        setError(data.error || "Failed to fetch requests")
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error)
      setError("Failed to load pending requests")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestResponse = async (requestId: string, action: "accept" | "decline") => {
    if (!user) return

    setProcessingRequest(requestId)
    setError("")

    try {
      const response = await fetch(`/api/requests/${requestId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Remove the processed request from the list
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId))

        // If accepted, update user balance in localStorage
        if (action === "accept") {
          const request = pendingRequests.find((req) => req.id === requestId)
          if (request) {
            const updatedUser = {
              ...user,
              walletBalance: user.walletBalance - request.amount,
            }
            setUser(updatedUser)
            localStorage.setItem("user_data", JSON.stringify(updatedUser))
          }
        }
      } else {
        setError(data.error || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      setError(`Failed to ${action} request`)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    router.push("/demo-login")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link href="/demo-login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold ml-2">PayPass</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2" onClick={handleLogout}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold">{user.fullName}</p>
              <p className="text-purple-100 text-sm">{user.phone}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Balance Card */}
          <Card className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Wallet Balance</p>
                  <p className="text-3xl font-bold">${user.walletBalance.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          {isLoading ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Loading Requests...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : pendingRequests.length > 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Pending Requests
                  <Badge variant="destructive" className="ml-2">
                    {pendingRequests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold text-gray-900">{request.senderName}</p>
                          <Badge variant="outline" className="text-xs">
                            {request.billType}
                          </Badge>
                          {request.linkedTransactionId && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Pay For Friend
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                        <p className="text-lg font-bold text-green-600">${request.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestResponse(request.id, "accept")}
                        disabled={processingRequest === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processingRequest === request.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestResponse(request.id, "decline")}
                        disabled={processingRequest === request.id}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {processingRequest === request.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No pending payment requests</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link href="/unpaid-transactions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900">Ask Friend to Pay</p>
                  <p className="text-xs text-blue-600 mt-1">Primary Feature</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/request-money">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Send className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Custom Request</p>
                  <p className="text-xs text-gray-500 mt-1">Manual request</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/qr-scanner">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <QrCode className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Scan QR</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/top-up">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <CreditCard className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Top Up</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-4">No recent transactions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
