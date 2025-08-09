"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from 'lucide-react'
import Link from "next/link"

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-svh grid place-items-center bg-gray-50 px-6">
      <div className="max-w-md w-full text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">Your fare has been paid. Have a safe trip!</p>
        <Link href="/dashboard">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Back to Dashboard</Button>
        </Link>
      </div>
    </main>
  )
}
