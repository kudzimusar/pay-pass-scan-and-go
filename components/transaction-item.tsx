import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, Plus, Send } from "lucide-react"

interface TransactionItemProps {
  id: string
  description: string
  amount: string
  currency: "USD" | "ZWL"
  createdAt: string
  type: "payment" | "topup" | "send" | "receive"
}

export function TransactionItem({ description, amount, currency, createdAt, type }: TransactionItemProps) {
  const getIcon = () => {
    switch (type) {
      case "payment":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "topup":
        return <Plus className="h-4 w-4 text-green-500" />
      case "send":
        return <Send className="h-4 w-4 text-orange-500" />
      case "receive":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-500" />
    }
  }

  const getAmountColor = () => {
    return type === "payment" || type === "send" ? "text-red-600" : "text-green-600"
  }

  const getAmountPrefix = () => {
    return type === "payment" || type === "send" ? "-" : "+"
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <p className="font-medium text-gray-900 text-sm">{description}</p>
              <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${getAmountColor()}`}>
              {getAmountPrefix()}
              {currency === "USD" ? "$" : "Z$"}
              {amount}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
