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
import { ArrowLeft, Search, DollarSign, Send, CheckCircle, AlertCircle, Users, Plus } from "lucide-react"

interface RequestMoneyUser {
  id: string
  fullName: string
  phone: string
  email: string
}

interface MockContact {
  id: string
  name: string
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
  const [mockContacts, setMockContacts] = useState<MockContact[]>([])
  const [allContacts, setAllContacts] = useState<RequestMoneyUser[]>([])
  const [selectedUser, setSelectedUser] = useState<RequestMoneyUser | null>(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [billType, setBillType] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAllContacts, setShowAllContacts] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    user?: string
    amount?: string
    description?: string
    billType?: string
  }>({})

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
      loadAllContacts(user.id)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/")
    }
  }, [router])

  const loadAllContacts = async (currentUserId: string) => {
    try {
      // Load mock contacts with proper error handling
      const mockResponse = await fetch("/api/contacts/mock")
<<<<<<< HEAD
      if (!mockResponse.ok) {
        const text = await mockResponse.text()
        throw new Error(text || `HTTP ${mockResponse.status}`)
      }
      const mockCt = mockResponse.headers.get("content-type") || ""
      if (!mockCt.includes("application/json")) {
        const text = await mockResponse.text()
        throw new Error(text || "Invalid contacts response format")
      }
=======

      if (!mockResponse.ok) {
        const errorText = await mockResponse.text()
        console.error("Mock contacts API error:", errorText)
        throw new Error(`Mock contacts API failed: ${errorText}`)
      }

      const contentType = mockResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await mockResponse.text()
        console.error("Mock contacts API returned non-JSON:", errorText)
        throw new Error(`Mock contacts API returned non-JSON response: ${errorText}`)
      }

>>>>>>> origin/main
      const mockData = await mockResponse.json()

      if (mockData.success) {
        setMockContacts(mockData.contacts || [])
      } else {
        console.warn("Mock contacts API returned success: false", mockData)
      }

      // Load system users (excluding current user) with proper error handling
      const usersResponse = await fetch(`/api/users/search?q=&excludeUserId=${currentUserId}`)

      if (!usersResponse.ok) {
        const errorText = await usersResponse.text()
        console.error("Users search API error:", errorText)
        throw new Error(`Users search API failed: ${errorText}`)
      }

      const usersContentType = usersResponse.headers.get("content-type")
      if (!usersContentType || !usersContentType.includes("application/json")) {
        const errorText = await usersResponse.text()
        console.error("Users search API returned non-JSON:", errorText)
        throw new Error(`Users search API returned non-JSON response: ${errorText}`)
      }

<<<<<<< HEAD
      // Load system users (excluding current user)
      const usersResponse = await fetch(`/api/users/search?q=${encodeURIComponent(" ")}&excludeUserId=${currentUserId}`)
      if (!usersResponse.ok) {
        const text = await usersResponse.text()
        throw new Error(text || `HTTP ${usersResponse.status}`)
      }
      const userCt = usersResponse.headers.get("content-type") || ""
      if (!userCt.includes("application/json")) {
        const text = await usersResponse.text()
        throw new Error(text || "Invalid users response format")
      }
=======
>>>>>>> origin/main
      const usersData = await usersResponse.json()

      if (usersData.success) {
        const systemUsers = usersData.users || []
        const mockContactsAsUsers = (mockData.contacts || []).map((contact: MockContact) => ({
          id: contact.id,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
        }))

        const combinedContacts = [...systemUsers, ...mockContactsAsUsers]
        setAllContacts(combinedContacts)
        setSearchResults(combinedContacts)
      } else {
        console.warn("Users search API returned success: false", usersData)
        // Still set mock contacts even if users search fails
        const mockContactsAsUsers = (mockData.contacts || []).map((contact: MockContact) => ({
          id: contact.id,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
        }))
        setAllContacts(mockContactsAsUsers)
        setSearchResults(mockContactsAsUsers)
      }
    } catch (error: any) {
      console.error("Error loading contacts:", error)
<<<<<<< HEAD
      setError(error?.message || "Failed to load contacts")
=======
      const errorMessage = error instanceof Error ? error.message : "Failed to load contacts"
      setError(`Failed to load contacts: ${errorMessage}`)
>>>>>>> origin/main
    }
  }

  const handleSearchFocus = () => {
    setShowAllContacts(true)
    if (allContacts.length === 0) {
      setError("No contacts available. Please add some test contacts first.")
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setShowAllContacts(true)

    if (value.trim() === "") {
      setSearchResults(allContacts)
      return
    }

    const filtered = allContacts.filter(
      (contact) =>
        contact.fullName.toLowerCase().includes(value.toLowerCase()) ||
        contact.phone.includes(value) ||
        contact.email.toLowerCase().includes(value.toLowerCase()),
    )

    setSearchResults(filtered)

    if (filtered.length === 0) {
      setError(`No contacts found for "${value}". Please check the spelling or add this contact first.`)
    } else {
      setError("")
    }
  }

  const handleUserSelect = (user: RequestMoneyUser) => {
    setSelectedUser(user)
    setSearchQuery("")
    setShowAllContacts(false)
    setError("")
    // Clear user validation error when a user is selected
    setValidationErrors((prev) => ({ ...prev, user: undefined }))
  }

  const validateForm = () => {
    const errors: {
      user?: string
      amount?: string
      description?: string
      billType?: string
    } = {}

    if (!selectedUser) {
      errors.user = "Please select a contact"
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.amount = "Please enter a valid amount"
    }

    if (!description || description.trim() === "") {
      errors.description = "Please enter a description"
    }

    if (!billType) {
      errors.billType = "Please select a category"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSendRequest = async () => {
    // Clear previous errors
    setError("")

    // Validate form
    if (!validateForm()) {
      setError("Please fill in all required fields correctly")
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser!.id,
          amount: Number(amount),
          description,
          billType,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Send request API error:", errorText)
        throw new Error(`Send request failed: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        console.error("Send request API returned non-JSON:", errorText)
        throw new Error(`Send request API returned non-JSON response: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(`Payment request sent to ${selectedUser!.fullName}!`)
        // Reset form
        setSelectedUser(null)
        setAmount("")
        setDescription("")
        setBillType("")
        setValidationErrors({})

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Failed to send request")
      }
    } catch (error) {
      console.error("Send request error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send request"
      setError(errorMessage)
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
                      <Users className="w-5 h-5 text-white" />
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
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={handleSearchFocus}
                      className={`pl-10 ${validationErrors.user ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  {validationErrors.user && <p className="text-xs text-red-500 mt-1">{validationErrors.user}</p>}

                  {/* Quick Add Contact Button */}
                  <div className="flex justify-center">
                    <Link href="/manage-contacts">
                      <Button variant="outline" size="sm" className="text-purple-600 border-purple-300 bg-transparent">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Test Contact
                      </Button>
                    </Link>
                  </div>

                  {showAllContacts && searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                      <p className="text-sm font-medium text-gray-700 px-2">
                        Available Contacts ({searchResults.length}):
                      </p>
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-600">{user.phone}</p>
                            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAllContacts && searchResults.length === 0 && allContacts.length === 0 && (
                    <div className="text-center py-4 border rounded-lg">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">No contacts available</p>
                      <Link href="/manage-contacts">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Add Your First Contact
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Request Details */}
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
                  onChange={(e) => {
                    setAmount(e.target.value)
                    if (e.target.value) {
                      setValidationErrors((prev) => ({ ...prev, amount: undefined }))
                    }
                  }}
                  className={validationErrors.amount ? "border-red-500 focus:ring-red-500" : ""}
                />
                {validationErrors.amount && <p className="text-xs text-red-500 mt-1">{validationErrors.amount}</p>}
              </div>

              <div>
                <Label htmlFor="billType">Category</Label>
                <Select
                  value={billType}
                  onValueChange={(value) => {
                    setBillType(value)
                    setValidationErrors((prev) => ({ ...prev, billType: undefined }))
                  }}
                >
                  <SelectTrigger className={validationErrors.billType ? "border-red-500 focus:ring-red-500" : ""}>
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
                {validationErrors.billType && <p className="text-xs text-red-500 mt-1">{validationErrors.billType}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this request for?"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (e.target.value) {
                      setValidationErrors((prev) => ({ ...prev, description: undefined }))
                    }
                  }}
                  rows={3}
                  className={validationErrors.description ? "border-red-500 focus:ring-red-500" : ""}
                />
                {validationErrors.description && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSendRequest}
            disabled={isSending}
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

          {/* Quick Tips */}
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Quick Tips</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Click the search box to see all available contacts</li>
                <li>• Add test contacts using the "Add Test Contact" button</li>
                <li>• Be specific in your description</li>
                <li>• Requests expire after 24 hours</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
