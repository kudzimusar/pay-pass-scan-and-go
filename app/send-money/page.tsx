"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Send } from "lucide-react"

const SendMoneyPage = () => {
  const { user, refreshUserData } = useAuth()
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
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
    }
  }

  // Render logic here
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow">
        <div className="px-6 py-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

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
              </div>
            </CardContent>
          </Card>

          <Button onClick={(e) => handleSendMoney(e)} className="w-full">
            <Send className="w-4 h-4 mr-2" /> Send Money
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SendMoneyPage
