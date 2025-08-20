"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Search, Users, AlertCircle, CheckCircle, Send } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Contact {
  id: string
  fullName: string
  phone: string
  email?: string
}

interface Transaction {
  id: string
  amount: number
  description: string
  category?: string
  merchantName?: string
}

export default function AskFriendToPayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transactionId")

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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

      // Get transaction details from localStorage or fetch from API
      const linkedTransaction = localStorage.getItem("linked_transaction")
      if (linkedTransaction) {
        setTransaction(JSON.parse(linkedTransaction))
      } else if (transactionId) {
        fetchTransaction(transactionId)
      } else {
        setError("No transaction selected")
        setTimeout(() => router.push("/unpaid-transactions"), 2000)
      }

      // Load contacts
      loadContacts(user.id)
    } catch (error) {
      console.error("Error initializing page:", error)
      router.push("/")
    }
  }, [router, transactionId])

  const fetchTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`)
      const data = await response.json()

      if (data.success) {
        setTransaction(data.transaction)
      } else {
        setError("Failed to load transaction details")
      }
    } catch (error) {
      console.error("Error fetching transaction:", error)
      setError("Failed to load transaction details")
    }
  }

  const loadContacts = async (userId: string) => {
    try {
      // Load mock contacts
      const mockResponse = await fetch("/api/contacts/mock")
      const mockData = await mockResponse.json()

      // Load system users (excluding current user)
      const usersResponse = await fetch(`/api/users/search?q=&exclude=${userId}`)
      const usersData = await usersResponse.json()

      let allContacts: Contact[] = []

      if (mockData.success) {
        const mockContacts = mockData.contacts.map((contact: any) => ({
          id: contact.id,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
        }))
        allContacts = [...allContacts, ...mockContacts]
      }

      if (usersData.success) {
        allContacts = [...allContacts, ...usersData.users]
      }

      setContacts(allContacts)
      setFilteredContacts(allContacts)
    } catch (error) {
      console.error("Error loading contacts:", error)
      setError("Failed to load contacts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredContacts(contacts)
      return
    }

    const filtered = contacts.filter(
      (contact) =>
        contact.fullName.toLowerCase().includes(query.toLowerCase()) ||
        contact.phone.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query.toLowerCase())),
    )

    setFilteredContacts(filtered)
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
  }

  const handleSendRequest = async () => {
    if (!transaction || !selectedContact || !currentUser) {
      setError("Missing required information")
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
          receiverId: selectedContact.id,
          amount: transaction.amount,
          description: `${transaction.description} - Requested by ${currentUser.fullName}`,
          billType: transaction.category || "Other",
          linkedTransactionId: transaction.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Payment request sent to ${selectedContact.fullName}!`)

        // Clear the stored transaction
        localStorage.removeItem("linked_transaction")

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Failed to send request")
      }
    } catch (error) {
      console.error("Error sending request:", error)
      setError("Failed to send request")
    } finally {
      setIsSending(false)
    }
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
            <Link href="/unpaid-transactions">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Ask Friend to Pay</h1>
          </div>
          <p className="text-blue-100 text-sm">Select a contact to request payment</p>
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

          {/* Transaction Details */}
          {transaction && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium text-gray-900">{transaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">${transaction.amount.toFixed(2)}</span>
                  </div>
                  {transaction.merchantName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Merchant:</span>
                      <span className="font-medium text-gray-900">{transaction.merchantName}</span>
                    </div>
                  )}
                  {transaction.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{transaction.category}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Selection */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Contact</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedContact ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedContact.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedContact(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleSelectContact(contact)}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{contact.fullName}</p>
                            <p className="text-sm text-gray-600">{contact.phone}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">No contacts found</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Request Button */}
          <Button
            onClick={handleSendRequest}
            disabled={!selectedContact || isSending}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                Send Payment Request
              </div>
            )}
          </Button>

          {/* Info Card */}
          <Card className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-indigo-900 text-sm mb-2">How It Works</h3>
              <ul className="text-xs text-indigo-800 space-y-1">
                <li>• Your friend will receive a payment request for this transaction</li>
                <li>• They can accept or decline the request</li>
                <li>• If accepted, the amount will be transferred to your wallet</li>
                <li>• You'll receive a notification when they respond</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
