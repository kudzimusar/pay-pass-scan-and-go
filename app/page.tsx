"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { QrCode, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

const loginSchema = z.object({
  phone: z.string().min(9, "Phone number must be at least 9 digits").max(15, "Phone number is too long"),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      pin: "",
    },
  })

  async function onSubmit(values: LoginForm) {
    setIsLoading(true)
    try {
      console.log("Attempting login with phone:", values.phone)

      // Format phone number for Zimbabwe
      let phone = values.phone.replace(/\D/g, "") // Remove all non-digits

      // Handle different input formats
      if (phone.startsWith("263")) {
        // Already has country code
        phone = `+${phone}`
      } else if (phone.startsWith("0")) {
        // Local format starting with 0 (e.g., 0772160634)
        phone = `+263${phone.substring(1)}`
      } else if (phone.length === 9) {
        // Local format without leading 0 (e.g., 772160634)
        phone = `+263${phone}`
      } else {
        // Default: assume it needs country code
        phone = `+263${phone}`
      }

      console.log("Formatted phone:", phone)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          pin: values.pin,
        }),
      })

      console.log("Login response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Login failed:", errorData)
        throw new Error(errorData.error || "Login failed")
      }

      const data = await response.json()
      console.log("Login successful:", data)

      if (data.success && data.user && data.token) {
        login(data.token, data.user)

        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        })

        router.push("/dashboard")
      } else {
        throw new Error("Invalid login response")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Logo */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 pt-16 pb-8 px-6 text-center text-white">
        <QrCode className="h-12 w-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">PayPass</h1>
        <p className="text-blue-100 text-sm">Scan and Go</p>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-6 py-8 bg-gray-50">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Enter your phone number and PIN to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">+263</span>
                        </div>
                        <Input type="tel" placeholder="77 123 4567" className="pl-12" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">PIN</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPin ? "text" : "password"} placeholder="Enter your PIN" {...field} />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <button className="text-blue-600 text-sm font-medium">Forgot PIN?</button>
          </div>

          <div className="text-center pt-4">
            <p className="text-gray-600 text-sm">New to PayPass?</p>
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-600 font-medium text-sm hover:underline"
            >
              Create Account
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Business Owner?</p>
            <button
              onClick={() => router.push("/operator")}
              className="text-green-600 font-medium text-sm hover:underline"
            >
              Operator Login
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <h3 className="font-medium text-blue-800 mb-2">Demo Credentials</h3>
            <p className="text-sm text-blue-700 mb-2">Use these credentials to test the app:</p>
            <div className="text-sm text-blue-600">
              <p>Phone: +263771234567</p>
              <p>PIN: 1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
