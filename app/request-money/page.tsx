"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Search,
  User,
  DollarSign,
  Send,
  CheckCircle,
  AlertCircle,
  Phone,
  Clock,
  Receipt,
} from "lucide-react"

interface SearchUser {
  id: string
  fullName: string
  phone: string
}

const billTypes = [
  { value: "Bus Ticket", label: "🚌 Bus Ticket", description: "Transport fare sharing" },
  { value: "Groceries", label: "🛒 Groceries", description: "Shared shopping expenses" },
  { value: "Utility Bill", label: "⚡ Utility Bill", description: "Electricity, water, internet" },
  { value: "Shared Ride", label: "🚗 Shared Ride", description: "Taxi or ride sharing" },
  { value: "Other", label: "📄 Other", description: "General payment request" },
]

export default function RequestMoneyPage() {
  const router = useRouter()
  const [step, setStep] = useState<"search" | "details" | "confirm" | "success">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [amount, setAmount] = useState("")
  const [billType, setBillType] = useState("")
  const [description, setDescription] = useState("")
  const [currency] = useState<"USD" | "ZWL">("USD")

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const selectUser = (user: SearchUser) => {
    setSelectedUser(user)
    setStep("details")
  }

  const validateForm = () => {
    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount")
      return false
    }
    if (amountNum > 1000) {
      alert("Amount cannot exceed $1000")
      return false
    }
    if (!billType) {
      alert("Please select a bill type")
      return false
    }
    return true
  }

  const handleDetailsSubmit = () => {
    if (validateForm()) {
      setStep("confirm")
    }
  }

  const sendPaymentRequest = async () => {
    if (!selectedUser || !validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          amount: Number.parseFloat(amount),
          currency,
          billType,
          description: description || `${billType} payment request`,
        }),
      })

      if (response.ok) {
        setStep("success")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to send payment request")
      }
    } catch (error) {
      console.error("Send request error:", error)
      alert("Failed to send payment request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep("search")
    setSearchQuery("")
    setSearchResults([])
    setSelectedUser(null)
    setAmount("")
    setBillType("")
    setDescription("")
  }

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
              <h1 className="text-2xl font-bold">Request Money</h1>
              <p className="text-purple-100">Send payment requests to contacts</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-2">
            {["search", "details", "confirm", "success"].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepName
                      ? "bg-white text-purple-600"
                      : index < ["search", "details", "confirm", "success"].indexOf(step)
                        ? "bg-purple-300 text-purple-800"
                        : "bg-white/20 text-white"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-0.5 bg-white/30 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Step 1: Search Users */}
          {step === "search" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Find Contact</h2>
                <p className="text-gray-600">Search by name, phone number, or email</p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Search Results</h3>
                  {searchResults.map((user) => (
                    <Card
                      key={user.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:border-purple-300"
                      onClick={() => selectUser(user)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{user.fullName}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{user.phone}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No users found matching your search.</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Payment Details */}
          {step === "details" && selectedUser && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Details</h2>
                <p className="text-gray-600">Requesting payment from {selectedUser.fullName}</p>
              </div>

              {/* Selected User */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedUser.fullName}</h4>
                      <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">Amount ({currency})</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-lg"
                  />
                </div>
              </div>

              {/* Bill Type Selection */}
              <div>
                <Label htmlFor="billType">Bill Type</Label>
                <Select value={billType} onValueChange={setBillType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select bill type" />
                  </SelectTrigger>
                  <SelectContent>
                    {billTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a note about this payment request..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleDetailsSubmit} className="w-full" size="lg">
                  Continue
                </Button>
                <Button variant="outline" onClick={() => setStep("search")} className="w-full">
                  Change Contact
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && selectedUser && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Request</h2>
                <p className="text-gray-600">Review your payment request details</p>
              </div>

              {/* Request Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Request Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requesting from</span>
                    <span className="font-medium">{selectedUser.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">{selectedUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium text-lg">${Number.parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Type</span>
                    <Badge variant="secondary">{billTypes.find((t) => t.value === billType)?.label}</Badge>
                  </div>
                  {description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description</span>
                      <span className="font-medium text-sm">{description}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Expires
                    </span>
                    <span className="font-medium">24 hours</span>
                  </div>
                </CardContent>
              </Card>

              {/* Info Alert */}
              <Alert>
                <Receipt className="h-4 w-4" />
                <AlertDescription>
                  {selectedUser.fullName} will receive an instant notification and can accept or decline your request.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={sendPaymentRequest} disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Payment Request
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setStep("details")} className="w-full" disabled={isSubmitting}>
                  Edit Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && selectedUser && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
                <p className="text-gray-600">Your payment request has been sent successfully</p>
              </div>

              {/* Success Details */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ${Number.parseFloat(amount).toFixed(2)} requested from {selectedUser.fullName}
                  </h3>
                  <p className="text-sm text-green-800 mb-4">
                    {selectedUser.fullName} will receive an instant notification and can respond within 24 hours.
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {billTypes.find((t) => t.value === billType)?.label}
                  </Badge>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Link href="/payment-requests">
                  <Button className="w-full">View All Requests</Button>
                </Link>
                <Button variant="outline" onClick={resetForm} className="w-full bg-transparent">
                  Send Another Request
                </Button>
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
