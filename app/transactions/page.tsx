"use client"

import { useAuth } from "@/components/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TransactionsPage() {
  const { token } = useAuth()
  const txQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiGet<any[]>("/api/user/transactions", token || undefined),
    enabled: !!token,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <Link href="/dashboard">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {Array.isArray(txQuery.data) && txQuery.data.length > 0 ? (
          txQuery.data.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {t.currency} {Number(t.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{t.status}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No transactions found.</p>
        )}
      </div>
    </div>
  )
}
