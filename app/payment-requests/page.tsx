"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Send,
  Inbox,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PaymentRequest {
  id: string
  senderId: string
  recipientId: string
  amount: string
  currency: "USD" | "ZWL"
  billType: string
  description: string
  status: "pending" | "accepted" | "declined" | "expired"
  createdAt: string
  expiresAt: string
  sender?: {
    id: string
    fullName: string
    phone: string
  }
  recipient?: {
    id: string
    fullName: string
    phone: string
  }
}

const billTypeEmojis: Record<string, string> = {
  "Bus Ticket": "🚌",
  Groceries: "🛒",
  "Utility Bill": "⚡",
  "Shared Ride": "🚗",
  Other: "📄",
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "accepted":
      return "bg-green-100 text-green-800"
    case "declined":
      return "bg-red-100 text-red-800"
    case "expired":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />
    case "accepted":
      return <CheckCircle className="w-4 h-4" />
    case "declined":
      return <XCircle className="w-4 h-4" />
    case "expired":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

export default function PaymentRequestsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("received")
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRequests = async (type: "sent" | "received") => {
    try {
      const response = await fetch(`/api/requests/pending?type=${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setRequests([])
      }
    } catch (error) {
      console.error("Fetch requests error:", error)
      setRequests([])
    }
  }

  const loadRequests = async () => {
    setIsLoading(true)
    await fetchRequests(activeTab as "sent" | "received")
    setIsLoading(false)
  }

  const refreshRequests = async () => {
    setIsRefreshing(true)
    await fetchRequests(activeTab as "sent" | "received")
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadRequests()
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const completedRequests = requests.filter((r) => r.status !== "pending")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Payment Requests</h1>
                <p className="text-blue-100">Manage your money requests</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshRequests}
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{pendingRequests.length}</div>
                <div className="text-xs text-blue-100">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{completedRequests.length}</div>
                <div className="text-xs text-blue-100">Completed</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="flex items-center space-x-2">
                <Inbox className="w-4 h-4" />
                <span>Received</span>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Sent</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payment requests</h3>
                  <p className="text-gray-500">You haven't received any payment requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                        Pending ({pendingRequests.length})
                      </h3>
                      {pendingRequests.map((request) => (
                        <RequestCard key={request.id} request={request} type="received" onUpdate={refreshRequests} />
                      ))}
                    </div>
                  )}

                  {/* Completed Requests */}
                  {completedRequests.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        History ({completedRequests.length})
                      </h3>
                      {completedRequests.map((request) => (
                        <RequestCard key={request.id} request={request} type="received" onUpdate={refreshRequests} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
                  <p className="text-gray-500 mb-4">You haven't sent any payment requests yet</p>
                  <Link href="/request-money">
                    <Button>Send Your First Request</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <RequestCard key={request.id} request={request} type="sent" onUpdate={refreshRequests} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-6 space-y-3">
            <Link href="/request-money">
              <Button className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                Send New Request
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Request Card Component
function RequestCard({
  request,
  type,
  onUpdate,
}: {
  request: PaymentRequest
  type: "sent" | "received"
  onUpdate: () => void
}) {
  const [isResponding, setIsResponding] = useState(false)
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState("")

  const otherUser = type === "sent" ? request.recipient : request.sender
  if (!otherUser) return null

  const handleResponse = async (action: "accept" | "decline") => {
    if (action === "accept" && !showPinInput) {
      setShowPinInput(true)
      return
    }

    setIsResponding(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          action,
          pin: action === "accept" ? pin : undefined,
        }),
      })

      if (response.ok) {
        onUpdate()
        setShowPinInput(false)
        setPin("")
        if (action === "accept") {
          alert("Payment completed successfully!")
        } else {
          alert("Payment request declined")
        }
      } else {
        const error = await response.json()
        alert(error.error || `Failed to ${action} payment request`)
      }
    } catch (error) {
      console.error(`${action} request error:`, error)
      alert(`Failed to ${action} payment request`)
    } finally {
      setIsResponding(false)
    }
  }

  const isExpired = new Date() > new Date(request.expiresAt)
  const canRespond = type === "received" && request.status === "pending" && !isExpired

  return (
    <Card className={`${request.status === "pending" ? "border-yellow-300 bg-yellow-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{otherUser.fullName}</h4>
              <p className="text-sm text-gray-500">{otherUser.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-lg">{Number.parseFloat(request.amount).toFixed(2)}</span>
            </div>
            <Badge variant="secondary" className={getStatusColor(request.status)}>
              {getStatusIcon(request.status)}
              <span className="ml-1 capitalize">{request.status}</span>
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Bill Type</span>
            <span className="font-medium">
              {billTypeEmojis[request.billType]} {request.billType}
            </span>
          </div>
          {request.description && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Description</span>
              <span className="font-medium text-right max-w-48 truncate">{request.description}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(request.createdAt)}
            </span>
            {request.status === "pending" && (
              <span className="text-orange-600 text-xs">Expires {formatDate(request.expiresAt)}</span>
            )}
          </div>
        </div>

        {showPinInput && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <Label htmlFor="pin" className="text-sm font-medium">
              Enter your PIN to confirm payment
            </Label>
            <Input
              id="pin"
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1"
              maxLength={6}
            />
          </div>
        )}

        {canRespond && (
          <div className="flex space-x-2">
            {!showPinInput ? (
              <>
                <Button
                  onClick={() => handleResponse("accept")}
                  disabled={isResponding}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isResponding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept & Pay
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleResponse("decline")}
                  disabled={isResponding}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </>
            ) : (
              <div className="flex space-x-2 w-full">
                <Button
                  onClick={() => handleResponse("accept")}
                  disabled={isResponding || !pin}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isResponding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    "Confirm Payment"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPinInput(false)
                    setPin("")
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {isExpired && request.status === "pending" && (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">This payment request has expired.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
