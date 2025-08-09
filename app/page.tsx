"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { QrCode, Wallet, Bus, LogIn } from 'lucide-react'

export default function HomePage() {
  const { user, operator, login } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(phone, pin)
      router.push("/dashboard")
    } catch (e: any) {
      setError(e?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-16 pb-10">
        <div className="max-w-md mx-auto px-6 text-center">
          <QrCode className="h-12 w-12 mx-auto mb-3" />
          <h1 className="text-3xl font-bold">PayPass Scan & Go</h1>
          <p className="text-emerald-100">Fast, secure QR payments for commuters and merchants</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Phone</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    +263
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="771234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>PIN</Label>
                <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="text-sm text-gray-600 mt-4">
              No account?{" "}
              <Link href="/signup" className="text-emerald-700 hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/qr-scanner" className="block">
            <Card>
              <CardContent className="p-4 text-center">
                <QrCode className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                <p className="font-medium">Scan & Pay</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/operator" className="block">
            <Card>
              <CardContent className="p-4 text-center">
                <Bus className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                <p className="font-medium">Operator Portal</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard" className="block">
            <Card>
              <CardContent className="p-4 text-center">
                <Wallet className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                <p className="font-medium">Wallet</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/top-up" className="block">
            <Card>
              <CardContent className="p-4 text-center">
                <Wallet className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                <p className="font-medium">Top Up</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  )
}
