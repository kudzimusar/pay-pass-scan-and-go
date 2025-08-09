"use client"

import { useAuth } from "@/components/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import { TransactionItem } from "@/components/transaction-item"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, Receipt } from "lucide-react"

export default function TransactionsPage() {
  const { token } = useAuth()

  const txQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiGet("/api/user/transactions", token || undefined),
    enabled: !!token,
  })

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-14 pb-8 px-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction History
            </h1>
            <p className="text-emerald-100 text-sm">All your payment activity</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {txQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : Array.isArray(txQuery.data) && txQuery.data.length > 0 ? (
          <div className="space-y-3">
            {txQuery.data.map((tx: any) => (
              <TransactionItem
                key={tx.id}
                id={tx.id}
                description={tx.description}
                amount={tx.amount}
                currency={tx.currency}
                createdAt={tx.createdAt}
                type={tx.type}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500 text-sm mb-6">Your payment history will appear here</p>
            <Link href="/qr-scanner">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Make Your First Payment</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
