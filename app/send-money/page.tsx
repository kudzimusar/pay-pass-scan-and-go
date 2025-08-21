"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"

const SendMoneyPage = () => {
  const { user, refreshUserData } = useAuth()
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [transactionId, setTransactionId] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")

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
    <div>
      {showSuccess && <div>Transaction successful with ID: {transactionId}</div>}
      {error && <div>Error: {error}</div>}
      {/* Form for sending money */}
      <form onSubmit={handleSendMoney}>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" required />
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
        <select value={selectedUser as any} onChange={(e) => setSelectedUser(e.target.value as any)} required>
          <option value="">Select User</option>
          {/* Options for users here */}
        </select>
        <button type="submit">Send Money</button>
      </form>
    </div>
  )
}

export default SendMoneyPage
