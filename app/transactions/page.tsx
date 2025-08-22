"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  Home,
  QrCode,
  History,
  User,
  TrendingDown,
  Calendar,
  Receipt,
} from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  createdAt: string
  merchantName?: string
  category?: string
  receiptNumber?: string
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    fetchTransactions()
    fetchMonthlyExpenses()
  }, [user, router, selectedMonth, selectedYear])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?userId=${user?.id || ""}&month=${selectedMonth}&year=${selectedYear}`)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMonthlyExpenses = async () => {
    try {
      const response = await fetch(`/api/expenses/monthly?userId=${user?.id || ""}`)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }
      const data = await response.json()

      if (data.success) {
        setMonthlyExpenses(data.totalExpenses || 0)
      }
    } catch (error) {
      console.error("Error fetching monthly expenses:", error)
    }
  }

  const handleTransactionClick = (transaction: Transaction) => {
    // Store transaction details for receipt page
    localStorage.setItem(
      "receipt_data",
      JSON.stringify({
        transactionId: transaction.id,
        provider: transaction.merchantName || "Unknown",
        category: transaction.category || transaction.type,
        amount: transaction.amount,
        date: transaction.createdAt,
        billNumber: transaction.receiptNumber || `TXN-${transaction.id.substring(0, 8)}`,
        status: transaction.status,
        description: transaction.description,
      }),
    )

    // Navigate to receipt page
    router.push("/proof-of-payment")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Ensure balance is a number with fallback; align with walletBalance used across app
  const rawBalance = (user as any).walletBalance ?? (user as any).balance
  const userBalance = typeof rawBalance === "number" ? rawBalance : 0

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.merchantName && transaction.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = selectedFilter === "all" || transaction.type === selectedFilter

    return matchesSearch && matchesFilter
  })

  const filters = [
    { key: "all", label: "All" },
    { key: "payment", label: "Payments" },
    { key: "receive", label: "Received" },
    { key: "topup", label: "Top-ups" },
  ]

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <ArrowUpRight className="w-5 h-5 text-red-600" />
      case "topup":
        return <Plus className="w-5 h-5 text-green-600" />
      case "receive":
        return <ArrowDownLeft className="w-5 h-5 text-blue-600" />
      default:
        return <ArrowUpRight className="w-5 h-5 text-gray-500" />
    }
  }

  const getAmountColor = (type: string) => {
    return type === "payment" || type === "send" ? "text-red-600" : "text-green-600"
  }

  const getAmountPrefix = (type: string) => {
    return type === "payment" || type === "send" ? "-" : "+"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Transaction History</h1>
              <p className="text-blue-100">All your payments and transfers</p>
            </div>
          </div>

          {/* Balance and Monthly Expenses Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <div className="text-center">
                <p className="text-blue-100 text-sm">Current Balance</p>
                <p className="text-xl font-bold">${userBalance.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <div className="text-center">
                <p className="text-blue-100 text-sm flex items-center justify-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Monthly Expenses
                </p>
                <p className="text-xl font-bold">${monthlyExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Month/Year Selector */}
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-200" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:ring-2 focus:ring-white/30"
            >
              {months.map((month, index) => (
                <option key={index} value={index} className="text-gray-900">
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:ring-2 focus:ring-white/30"
            >
              <option value={2025} className="text-gray-900">
                2025
              </option>
              <option value={2024} className="text-gray-900">
                2024
              </option>
              <option value={2023} className="text-gray-900">
                2023
              </option>
            </select>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFilter === filter.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Summary Card */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {months[selectedMonth]} {selectedYear} Summary
              </h3>
              <p className="text-sm text-gray-600">{filteredTransactions.length} transactions</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">-${monthlyExpenses.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total spent</p>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="px-6 py-4 pb-24">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">Try adjusting your search, filter, or date criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction)}
                  className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === "payment"
                          ? "bg-red-100"
                          : transaction.type === "topup"
                            ? "bg-green-100"
                            : transaction.type === "receive"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                      }`}
                    >
                      {getIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.merchantName || "Unknown"}</p>
                      <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                        {getAmountPrefix(transaction.type)}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <div className="flex items-center justify-end text-xs text-gray-500">
                        <Receipt className="w-3 h-3 mr-1" />
                        <span>View Receipt</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/qr-scanner" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <QrCode className="w-5 h-5 mb-1" />
              <span className="text-xs">Scan</span>
            </Link>
            <Link href="/transactions" className="flex flex-col items-center py-2 px-3 text-blue-600">
              <History className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">History</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
