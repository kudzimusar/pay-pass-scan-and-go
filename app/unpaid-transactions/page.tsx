"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Search, AlertCircle, Bus, ShoppingCart, Zap, Clock, DollarSign } from "lucide-react"

interface Transaction {
  id: string
  userId: string
  type: "bus_ticket" | "grocery" | "utility"
  amount: number
  description: string
  status: "pending" | "completed" | "failed"
  isPaid: boolean
  createdAt: string
}

interface User {
  id: string
  fullName: string
  phone: string
  email: string
}

export default function UnpaidTransactionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
      fetchUnpaidTransactions(parsedUser.id)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/demo-login")
    }
  }, [router])

  const fetchUnpaidTransactions = async (userId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/transactions/unpaid?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions || [])
      } else {
        setError(data.error || "Failed to fetch transactions")
      }
    } catch (error) {
      console.error("Error fetching unpaid transactions:", error)
      setError("Failed to load unpaid transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&excludeUserId=${user.id}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSearchResults(data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Error searching users:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const sendLinkedRequest = async (receiverId: string) => {
    if (!selectedTransaction || !user) return

    try {
      setIsSending(true)
      setError("")

      const response = await fetch("/api/requests/linked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId,
          linkedTransactionId: selectedTransaction.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("Payment request sent successfully!")
        setSelectedTransaction(null)
        setSearchQuery("")
        setSearchResults([])
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Failed to send request")
      }
    } catch (error) {
      console.error("Error sending linked request:", error)
      setError("Failed to send payment request")
    } finally {
      setIsSending(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "bus_ticket":
        return <Bus className="w-6 h-6 text-blue-600" />
      case "grocery":
        return <ShoppingCart className="w-6 h-6 text-green-600" />
      case "utility":
        return <Zap className="w-6 h-6 text-yellow-600" />
      default:
        return <DollarSign className="w-6 h-6 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "bus_ticket":
        return "from-blue-500 to-blue-600"
      case "grocery":
        return "from-green-500 to-green-600"
      case "utility":
        return "from-yellow-500 to-yellow-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
          <div className="flex items-center mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Ask Friend to Pay</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <p className="text-purple-100">Select a bill and choose who should pay</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {!selectedTransaction ? (
            <>
              {/* Unpaid Transactions */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Unpaid Bills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getTransactionIcon(transaction.type)}
                              <div>
                                <p className="font-medium text-gray-900">{transaction.description}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">${transaction.amount.toFixed(2)}</p>
                              <Badge variant="outline" className="text-xs">
                                {transaction.type.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No unpaid bills found</p>
                      <p className="text-sm text-gray-500 mt-1">All your transactions are up to date!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Selected Transaction */}
              <Card className={`mb-6 bg-gradient-to-r ${getTransactionColor(selectedTransaction.type)} text-white`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(selectedTransaction.type)}
                      <div>
                        <p className="font-semibold">{selectedTransaction.description}</p>
                        <p className="text-white/80 text-sm">
                          {selectedTransaction.type.replace("_", " ").toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">${selectedTransaction.amount.toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTransaction(null)}
                    className="text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Choose Different Bill
                  </Button>
                </CardContent>
              </Card>

              {/* Search Friends */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Who should pay?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by name, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {isSearching && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => sendLinkedRequest(contact.id)}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{contact.fullName}</p>
                            <p className="text-sm text-gray-600">{contact.phone}</p>
                          </div>
                          <Button size="sm" disabled={isSending}>
                            {isSending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              "Send Request"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-600">No contacts found</p>
                      <p className="text-sm text-gray-500">Try searching with a different name or phone number</p>
                    </div>
                  )}

                  {searchQuery.length < 2 && (
                    <div className="text-center py-4">
                      <p className="text-gray-600">Start typing to search for contacts</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
