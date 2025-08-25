"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Route = { id: string; name: string; qrCode: string; fareUSD: number; fareZWL: number }
type Txn = { id: string; amount: number; currency: "USD" | "ZWL"; description: string; createdAt: string }

export default function OperatorPage() {
  const [phone, setPhone] = useState("771111111")
  const [pin, setPin] = useState("1234")
  const [token, setToken] = useState<string | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [txns, setTxns] = useState<Txn[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  async function login() {
    setMsg(null)
    try {
      const res = await fetch("/api/auth/operator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      })
      if (!res.ok) {
        const text = await res.text()
        try {
          const maybe = text.trim().startsWith("{") ? JSON.parse(text) : null
          setMsg(maybe?.error || text || "Login failed")
        } catch {
          setMsg(text || "Login failed")
        }
        return
      }
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        const text = await res.text()
        setMsg(text || "Invalid server response")
        return
      }
      const data = await res.json()
      localStorage.setItem("pp_op_token", data.token)
      setToken(data.token)
      setMsg("Operator login successful.")
    } catch (e: any) {
      setMsg(e?.message || "Login failed")
    }
  }

  useEffect(() => {
    const t = localStorage.getItem("pp_op_token")
    if (t) setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch("/api/operator/routes", { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      }),
      fetch("/api/operator/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      }),
    ])
      .then(([r, t]) => {
        setRoutes(Array.isArray(r) ? r : [])
        setTxns(Array.isArray(t) ? t : [])
      })
      .catch((e) => setMsg(e?.message || "Failed to load operator data"))
  }, [token])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Operator</h1>

      {!token && (
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
          <Input placeholder="Operator phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          <Button onClick={login} className="w-full">
            Sign in
          </Button>
          {msg && <p className="text-sm text-gray-700">{msg}</p>}
        </div>
      )}

      {token && (
        <>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 font-medium">Routes</div>
            <div className="space-y-2">
              {routes.map((rt) => (
                <div key={rt.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{rt.name}</div>
                    <div className="text-xs text-gray-600">QR: {rt.qrCode}</div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    USD {rt.fareUSD.toFixed(2)} • ZWL {rt.fareZWL.toFixed(2)}
                  </div>
                </div>
              ))}
              {routes.length === 0 && <div className="text-sm text-gray-600">No routes yet</div>}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 font-medium">Recent Payments</div>
            <div className="space-y-2">
              {txns.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="text-sm">{tx.description}</div>
                  <div className="text-right text-sm">
                    {tx.currency} {Number(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
              {txns.length === 0 && <div className="text-sm text-gray-600">No transactions yet</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
