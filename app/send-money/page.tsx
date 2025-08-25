"use client"

<<<<<<< HEAD
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Send } from "lucide-react"
=======
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Send, User, DollarSign, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
>>>>>>> origin/main

interface Contact {
  id: string
  name: string
  phone: string
}

export default function SendMoneyPage() {
  const { user, refreshUserData } = useAuth()
  const router = useRouter()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
<<<<<<< HEAD
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [transactionId, setTransactionId] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [contacts, setContacts] = useState<Array<{ id: string; fullName: string; phone: string; email?: string }>>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoadingContacts(true)
      try {
        const currentUserId = user.id
        const [mockRes, usersRes] = await Promise.all([
          fetch("/api/contacts/mock"),
          fetch(`/api/users/search?q=${encodeURIComponent(" ")}&excludeUserId=${currentUserId}`),
        ])
        const ensureJson = async (res: Response) => {
          if (!res.ok) throw new Error(await res.text())
          const ct = res.headers.get("content-type") || ""
          if (!ct.includes("application/json")) throw new Error(await res.text())
          return res.json()
        }
        const mockData = await ensureJson(mockRes)
        const usersData = await ensureJson(usersRes)
        const mockAsUsers = (mockData.contacts || []).map((c: any) => ({ id: c.id, fullName: c.name, phone: c.phone, email: c.email }))
        const systemUsers = usersData.users || []
        setContacts([...systemUsers, ...mockAsUsers].filter((c: any) => c.id !== currentUserId))
      } catch (e: any) {
        setError(e?.message || "Failed to load contacts")
      } finally {
        setLoadingContacts(false)
      }
    }
    load()
  }, [user])

  const handleSendMoney = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    if (!user) {
      setError("You must be logged in")
      return
    }
    if (!selectedUser || !amount) {
      setError("Please select a recipient and enter amount")
      return
    }

    try {
      const token = localStorage.getItem("auth_token") || ""
      const response = await fetch("/api/money/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: user.id,
          recipientId: selectedUser,
          amount: Number.parseFloat(amount),
          description: note || "Wallet transfer",
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        const maybe = text.trim().startsWith("{") ? JSON.parse(text) : null
        throw new Error(maybe?.error || text || `HTTP ${response.status}`)
      }

      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(text || "Server returned invalid response format")
      }

      const data = await response.json()
      if (data.success) {
        await refreshUserData()
        setTransactionId(data.transactionId)
        setShowSuccess(true)
        setAmount("")
        setNote("")
        setSelectedUser(null)
        setError("")
      } else {
        setError(data.error || "Failed to send money")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send money")
=======
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [transactionId, setTransactionId] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    fetchContacts()
  }, [user, router])

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts/mock")
      const data = await response.json()
      if (data.success) {
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
>>>>>>> origin/main
    }
  }

  const handleSendMoney = async () => {
    if (!selectedContact || !amount) {
      setError("Please select a contact and enter an amount")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (amountNum > user.walletBalance) {
      setError("Insufficient balance")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/money/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          recipientId: selectedContact.id,
          amount: amountNum,
          description: note || `Money transfer to ${selectedContact.name}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully sent $${amountNum.toFixed(2)} to ${selectedContact.name}`)
        setTransactionId(data.transactionId)
        setAmount("")
        setNote("")
        setSelectedContact(null)

        // Refresh user data to get updated balance
        await refreshUserData()
      } else {
        setError(data.error || "Failed to send money")
      }
    } catch (error) {
      console.error("Send money error:", error)
      setError("Failed to send money. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow">
        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
=======
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Send Money</h1>
          </div>
          <p className="text-green-100 text-sm">Transfer money to your contacts</p>
        </div>

        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
>>>>>>> origin/main
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

<<<<<<< HEAD
          {showSuccess && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">Transaction successful: {transactionId}</AlertDescription>
            </Alert>
          )}

          <Card className="mb-4">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">Amount ($)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm mb-1">Note</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="mb-2 font-medium flex items-center"><Users className="w-4 h-4 mr-2" /> Select Contact</div>
              {loadingContacts ? (
                <div className="text-sm text-gray-600">Loading contacts...</div>
              ) : contacts.length ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedUser(c.id)}
                      className={`p-3 border rounded cursor-pointer ${selectedUser === c.id ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"}`}
                    >
                      <div className="text-sm font-medium">{c.fullName}</div>
                      <div className="text-xs text-gray-600">{c.phone}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">No contacts. Add some in Manage Contacts.</div>
              )}
              <div className="mt-3">
                <Link href="/manage-contacts">
                  <Button variant="outline" className="bg-transparent">Manage Contacts</Button>
                </Link>
=======
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
                {transactionId && <div className="mt-2 text-xs">Transaction ID: {transactionId}</div>}
              </AlertDescription>
            </Alert>
          )}

          {/* Balance Display */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">${user.walletBalance.toFixed(2)}</p>
>>>>>>> origin/main
              </div>
            </CardContent>
          </Card>

<<<<<<< HEAD
          <Button onClick={(e) => handleSendMoney(e)} className="w-full">
            <Send className="w-4 h-4 mr-2" /> Send Money
=======
          {/* Contact Selection */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2" />
                Select Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                    {selectedContact?.id === contact.id && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Amount Input */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={user.walletBalance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Note Input */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Note (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="note">Add a note</Label>
                <Input
                  id="note"
                  placeholder="What's this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSendMoney}
            disabled={isLoading || !selectedContact || !amount}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2" />
                Send Money
              </div>
            )}
>>>>>>> origin/main
          </Button>
        </div>
      </div>
    </div>
  )
}
