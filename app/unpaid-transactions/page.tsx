"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CreditCard, Users, Calendar, Building, Receipt, AlertCircle, Clock, Share } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  isPaid: boolean
  createdAt: string
  category?: string
  merchantName?: string
  receiptNumber?: string
  dueDate?: string
}

export default function UnpaidTransactionsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user_data")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      fetchUnpaidTransactions(user.id)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/")
    }
  }, [router])

  const fetchUnpaidTransactions = async (userId: string) => {
    try {
      const response = await fetch(`/api/transactions/unpaid?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
      } else {
        setError("Failed to load transactions")
      }
    } catch (error) {
      console.error("Fetch transactions error:", error)
      setError("Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "bus_ticket":
        return "🚌"
      case "grocery":
        return "🛒"
      case "electricity":
        return "⚡"
      case "water":
        return "💧"
      case "internet":
        return "🌐"
      default:
        return "💳"
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "bus_ticket":
        return "blue"
      case "grocery":
        return "green"
      case "electricity":
        return "yellow"
      case "water":
        return "cyan"
      case "internet":
        return "purple"
      default:
        return "gray"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDaysUntilDue = (dueDateString?: string) => {
    if (!dueDateString) return null
    const dueDate = new Date(dueDateString)
    const now = new Date()
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAskFriendToPay = (transaction: Transaction) => {
    // Store transaction details in localStorage for the request money page
    localStorage.setItem(
      "linked_transaction",
      JSON.stringify({
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category || transaction.type,
        merchantName: transaction.merchantName,
      }),
    )

    // Navigate to the ask friend to pay page
    router.push(`/ask-friend-to-pay?transactionId=${transaction.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Unpaid Transactions</h1>
          </div>
          <p className="text-orange-100 text-sm">Bills and payments waiting for you</p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <Card className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-900">Total Outstanding</h3>
                  <p className="text-sm text-orange-700">{transactions.length} unpaid bills</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-900">
                    ${transactions.reduce((sum, txn) => sum + txn.amount, 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-orange-600">Amount due</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {transactions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600 mb-4">You have no unpaid transactions</p>
                <Link href="/dashboard">
                  <Button>Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const color = getTransactionColor(transaction.type)
                const daysUntilDue = getDaysUntilDue(transaction.dueDate)
                const isOverdue = daysUntilDue !== null && daysUntilDue < 0
                const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0

                return (
                  <Card
                    key={transaction.id}
                    className={`hover:shadow-md transition-shadow ${
                      isOverdue ? "border-red-300 bg-red-50" : isDueSoon ? "border-yellow-300 bg-yellow-50" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`text-2xl`}>{getTransactionIcon(transaction.type)}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {transaction.merchantName && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Building className="w-3 h-3 mr-1" />
                                  {transaction.merchantName}
                                </div>
                              )}
                              {transaction.receiptNumber && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Receipt className="w-3 h-3 mr-1" />
                                  {transaction.receiptNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">${transaction.amount.toFixed(2)}</p>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              color === "blue"
                                ? "bg-blue-100 text-blue-800"
                                : color === "green"
                                  ? "bg-green-100 text-green-800"
                                  : color === "yellow"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : color === "cyan"
                                      ? "bg-cyan-100 text-cyan-800"
                                      : color === "purple"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {transaction.category || transaction.type}
                          </Badge>
                        </div>
                      </div>

                      {/* Due Date Warning */}
                      {daysUntilDue !== null && (
                        <div
                          className={`flex items-center text-sm mb-3 ${
                            isOverdue ? "text-red-600" : isDueSoon ? "text-yellow-600" : "text-gray-600"
                          }`}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          {isOverdue
                            ? `Overdue by ${Math.abs(daysUntilDue)} days`
                            : isDueSoon
                              ? `Due in ${daysUntilDue} days`
                              : `Due in ${daysUntilDue} days`}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Clock className="w-3 h-3 mr-1" />
                        Created {formatDate(transaction.createdAt)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAskFriendToPay(transaction)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          size="sm"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Ask Friend to Pay
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Quick Actions */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Need Help?</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Ask friends to pay for your bills</li>
                <li>• Share receipts and get reimbursed</li>
                <li>• Set up payment reminders</li>
                <li>• Contact support for payment issues</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
