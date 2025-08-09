"use client"

import { useAuth } from "@/components/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import { BalanceCard } from "@/components/balance-card"
import { TransactionItem } from "@/components/transaction-item"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const { token, user } = useAuth()
  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiGet("/api/user/wallet", token || undefined),
    enabled: !!token,
  })
  const txQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiGet("/api/user/transactions", token || undefined),
    enabled: !!token,
  })

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 pt-14 pb-8 px-6 text-white">
        <h1 className="text-xl font-semibold">
          {user ? `Hi, ${user.fullName.split(" ")[0]}` : "Wallet"}
        </h1>
        <p className="text-emerald-100 text-sm">Your balances and activity</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        <BalanceCard
          usd={walletQuery.data?.usdBalance || "0.00"}
          zwl={walletQuery.data?.zwlBalance || "0.00"}
        />
        <div className="grid grid-cols-2 gap-3">
          <Link href="/qr-scanner"><Button className="w-full bg-emerald-600 hover:bg-emerald-700">Scan & Pay</Button></Link>
          <Link href="/top-up"><Button variant="secondary" className="w-full">Top Up</Button></Link>
          <Link href="/transactions"><Button variant="outline" className="w-full">Transactions</Button></Link>
          <Link href="/"><Button variant="ghost" className="w-full">Home</Button></Link>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {Array.isArray(txQuery.data) && txQuery.data.length > 0 ? (
              txQuery.data.slice(0, 5).map((t: any) => (
                <TransactionItem
                  key={t.id}
                  id={t.id}
                  description={t.description}
                  amount={t.amount}
                  currency={t.currency}
                  createdAt={t.createdAt}
                  type={t.type}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
