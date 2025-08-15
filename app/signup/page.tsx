"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { UserPlus, ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const { signup } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("Demo User")
  const [phone, setPhone] = useState("773333333")
  const [pin, setPin] = useState("1234")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      await signup(name, phone, pin, biometricEnabled)
      setMsg("Signed up! Go to your dashboard.")
      router.push("/dashboard")
    } catch (e: any) {
      setMsg(e?.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-16 pb-10">
        <div className="max-w-md mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-center">
            <UserPlus className="h-12 w-12 mx-auto mb-3" />
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-emerald-100">Join PayPass Scan & Go</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
              </div>

              <div>
                <Label>Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    +263
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="771234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>PIN</Label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="4-digit PIN"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="biometric"
                  checked={biometricEnabled}
                  onCheckedChange={(checked) => setBiometricEnabled(!!checked)}
                />
                <Label htmlFor="biometric" className="text-sm">
                  Enable biometric authentication
                </Label>
              </div>

              {msg && <p className="text-sm text-red-600">{msg}</p>}

              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-sm text-gray-600 mt-4 text-center">
              Already have an account?{" "}
              <Link href="/" className="text-emerald-700 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
