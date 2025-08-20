"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import {
  Bell,
  Settings,
  Eye,
  EyeOff,
  QrCode,
  Send,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface PaymentRequest {
  id: string
  senderId: string
  recipientId: string
  amount: number
  description: string
  status: string
  createdAt: string
  senderName?: string
  senderPhone?: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  amount?: number
  description?: string
  createdAt: string
  read: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, refreshUserData } = useAuth()
  const [showBalance, setShowBalance] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Get current date info
  const now = new Date()
  const currentMonth = now.toLocaleString("default", { month: "long" })
  const currentDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    fetchPendingRequests(user.id)
    fetchNotifications(user.id)
    calculateMonthlyExpenses(user.id)
    // Refresh user data to ensure we have the latest balance
    refreshUserData()
  }, [user, router, refreshUserData])

  const fetchPendingRequests = async (userId: string) => {
    try {
      const response = await fetch(`/api/requests/pending?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setPendingRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error)
    }
  }

  const fetchNotifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMonthlyExpenses = async (userId: string) => {
    try {
      const response = await fetch(`/api/expenses/monthly?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setMonthlyExpenses(data.totalExpenses || 0)
      }
    } catch (error) {
      console.error("Error calculating monthly expenses:", error)
      // Fallback calculation based on accepted requests
      const acceptedRequests = pendingRequests.filter((req) => req.status === "accepted")
      const total = acceptedRequests.reduce((sum, req) => sum + req.amount, 0)
      setMonthlyExpenses(total)
    }
  }

  const handleRequestResponse = async (requestId: string, action: "accept" | "decline") => {
    if (!user) return

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

      const data = await response.json()

      if (data.success) {
        // Refresh pending requests and user data
        fetchPendingRequests(user.id)

        if (action === "accept" && data.newBalance !== undefined) {
          // Refresh user data to get updated balance
          await refreshUserData()
          // Recalculate monthly expenses
          calculateMonthlyExpenses(user.id)
        }
      } else {
        setError(data.error || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      setError(`Failed to ${action} request`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length
  const lastMonthExpense = monthlyExpenses * 0.85 // Mock previous month data
  const expenseChange = monthlyExpenses - lastMonthExpense
  const isExpenseUp = expenseChange > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">PayPass</h1>
                <p className="text-xs text-blue-100">{currentDate}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/notifications" className="relative">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Hello, {user.fullName.split(" ")[0]}! 👋</h2>
            <p className="text-blue-100 text-sm">Ready to make payments today?</p>
          </div>

          {/* Balance Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100">Wallet Balance</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="text-3xl font-bold mb-2">
                {showBalance ? `$${user.walletBalance.toFixed(2)}` : "••••••"}
              </div>
              <div className="flex items-center text-sm text-blue-100">
                <span className="mr-2">{currentMonth} Expenses:</span>
                <span className="font-medium">${monthlyExpenses.toFixed(2)}</span>
                <div className={`flex items-center ml-2 ${isExpenseUp ? "text-red-200" : "text-green-200"}`}>
                  {isExpenseUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  <span className="text-xs">${Math.abs(expenseChange).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 pt-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

          {/* Primary Action - Ask Friend to Pay */}
          <Link href="/request-money">
            <Card className="mb-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Ask Friend to Pay</h4>
                      <p className="text-blue-100 text-sm">Request money from contacts</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Other Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/qr-scanner">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Scan & Pay</h4>
                  <p className="text-xs text-gray-600">Quick QR payments</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/send-money">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Send Money</h4>
                  <p className="text-xs text-gray-600">Transfer to contacts</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pay-bills">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Pay Bills</h4>
                  <p className="text-xs text-gray-600">Utilities & services</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/top-up">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ArrowDownLeft className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Top Up</h4>
                  <p className="text-xs text-gray-600">Add money to wallet</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.senderName}</h4>
                          <p className="text-sm text-gray-600">{request.senderPhone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">${request.amount.toFixed(2)}</p>
                        <Badge variant="secondary" className="text-xs">
                          Pending
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestResponse(request.id, "accept")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestResponse(request.id, "decline")}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link href="/transactions" className="text-blue-600 hover:underline">
              View All Transactions
            </Link>
            <Link href="/unpaid-transactions" className="text-blue-600 hover:underline">
              Unpaid Transactions
            </Link>
            <Link href="/profile" className="text-blue-600 hover:underline">
              My Profile
            </Link>
            <Link href="/manage-contacts" className="text-blue-600 hover:underline">
              Manage Test Contacts
            </Link>
            <button onClick={handleLogout} className="text-red-600 hover:underline text-left col-span-2">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
