"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Search, DollarSign, Send, CheckCircle, AlertCircle } from "lucide-react"

interface RequestMoneyUser {
  id: string
  fullName: string
  phone: string
  email: string
}

const billTypes = [
  { value: "Groceries", label: "Groceries" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities", label: "Utilities" },
  { value: "Food & Dining", label: "Food & Dining" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Other", label: "Other" },
]

export default function RequestMoneyPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<RequestMoneyUser[]>([])
  const [selectedUser, setSelectedUser] = useState<RequestMoneyUser | null>(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [billType, setBillType] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem("user_data")
    if (!userData) {
      router.push("/demo-login")
      return
    }

    try {
      const user = JSON.parse(userData)
      setCurrentUser(user)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/demo-login")
    }
  }, [router])

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}&exclude=${currentUser?.id}`,
        )
        const data = await response.json()

        if (data.success) {
          setSearchResults(data.users)
        } else {
          setError("Failed to search users")
        }
      } catch (error) {
        console.error("Search error:", error)
        setError("Failed to search users")
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, currentUser?.id])

  const handleUserSelect = (user: RequestMoneyUser) => {
    setSelectedUser(user)
    setSearchQuery("")
    setSearchResults([])
    setError("")
  }

  const handleSendRequest = async () => {
    if (!selectedUser || !amount || !description || !billType) {
      setError("Please fill in all fields")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsSending(true)
    setError("")

    try {
      const response = await fetch("/api/requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          amount: amountNum,
          description,
          billType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Payment request sent to ${selectedUser.fullName}!`)
        // Reset form
        setSelectedUser(null)
        setAmount("")
        setDescription("")
        setBillType("")

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Failed to send request")
      }
    } catch (error) {
      console.error("Send request error:", error)
      setError("Failed to send request")
    } finally {
      setIsSending(false)
    }
  }

  if (!currentUser) {
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
            <h1 className="text-xl font-bold ml-2">Request Money</h1>
          </div>
          <p className="text-purple-100 text-sm">Send a payment request to someone</p>
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
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Select User */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                {selectedUser ? "Selected Contact" : "Select Contact"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedUser.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
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
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-600">{user.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No users found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Request Details */}
          {selectedUser && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="billType">Category</Label>
                  <Select value={billType} onValueChange={setBillType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {billTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this request for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send Button */}
          {selectedUser && (
            <Button
              onClick={handleSendRequest}
              disabled={isSending || !amount || !description || !billType}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              {isSending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Request...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </div>
              )}
            </Button>
          )}

          {/* Quick Tips */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Quick Tips</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Search by name, phone number, or email</li>
                <li>• Be specific in your description</li>
                <li>• Requests expire after 24 hours</li>
                <li>• The recipient will get a notification</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
