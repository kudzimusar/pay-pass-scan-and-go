"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Send,
  Users,
  Trash2,
} from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem("user_data")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      fetchNotifications(user.id)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/")
    }
  }, [router])

  const fetchNotifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications || [])
      } else {
        setError("Failed to load notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)),
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_request":
        return <Users className="w-5 h-5 text-purple-600" />
      case "payment_completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "payment_failed":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "request_accepted":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "request_declined":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "money_sent":
        return <Send className="w-5 h-5 text-blue-600" />
      case "money_received":
        return <CreditCard className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "payment_request":
        return "bg-purple-100"
      case "payment_completed":
        return "bg-green-100"
      case "payment_failed":
        return "bg-red-100"
      case "request_accepted":
        return "bg-green-100"
      case "request_declined":
        return "bg-red-100"
      case "money_sent":
        return "bg-blue-100"
      case "money_received":
        return "bg-green-100"
      default:
        return "bg-gray-100"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Notifications</h1>
          </div>
          <p className="text-blue-100 text-sm">Stay updated with your account activity</p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`hover:shadow-md transition-shadow ${
                    !notification.isRead ? "border-blue-300 bg-blue-50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.isRead && <Badge className="bg-blue-500 text-white text-xs">New</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" className="text-gray-600 bg-transparent">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Notifications
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
