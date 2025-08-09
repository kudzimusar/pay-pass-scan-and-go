import { Card, CardContent } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

interface BalanceCardProps {
  usd: string
  zwl: string
}

export function BalanceCard({ usd, zwl }: BalanceCardProps) {
  return (
    <div className="space-y-3">
      <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">USD Balance</p>
              <p className="text-2xl font-bold">${usd}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">ZWL Balance</p>
              <p className="text-2xl font-bold">Z${zwl}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
