"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext" // Assuming AuthContext is defined somewhere

const TopUpPage = () => {
  const { user, refreshUserData } = useAuth()
  const [amount, setAmount] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleTopUp = async () => {
    // Simulate top-up API call
    const data = { success: true } // Replace with actual API call logic

    if (data.success) {
      // Refresh user data to get updated balance
      await refreshUserData()

      setSuccess(`Successfully added $${amount} to your wallet!`)
      setAmount("")
      setError("")
    } else {
      setError(data.error || "Top-up failed. Please try again.")
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
