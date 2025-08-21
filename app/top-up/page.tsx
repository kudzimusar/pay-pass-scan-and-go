"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"

const TopUpPage = () => {
  const { user, refreshUserData } = useAuth()
  const [amount, setAmount] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleTopUp = async () => {
    setError("")
    setSuccess("")
    const amt = Number.parseFloat(amount)
    if (!user) {
      setError("Please sign in first")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount")
      return
    }
    try {
      const token = localStorage.getItem("auth_token") || ""
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, amount: amt, method: "wallet_topup" }),
      })
      if (!res.ok) {
        const text = await res.text()
        const maybe = text.trim().startsWith("{") ? JSON.parse(text) : null
        throw new Error(maybe?.error || text || `HTTP ${res.status}`)
      }
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        const text = await res.text()
        throw new Error(text || "Invalid server response")
      }
      const data = await res.json()
      if (data.success) {
        await refreshUserData()
        setSuccess(`Successfully added $${amt.toFixed(2)} to your wallet!`)
        setAmount("")
      } else {
        setError(data.error || "Top-up failed. Please try again.")
      }
    } catch (e: any) {
      setError(e?.message || "Top-up failed. Please try again.")
    }
  }

  return (
    <div>
      <h1>Top Up Your Wallet</h1>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      <button onClick={handleTopUp}>Top Up</button>
      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}

export default TopUpPage
