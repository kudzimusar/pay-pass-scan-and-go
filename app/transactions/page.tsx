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
} from "lucide-react"

export default function TransactionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  // Ensure balance is a number with fallback
  const userBalance = typeof user.balance === "number" ? user.balance : 0

  const allTransactions = [
    {
      id: "1",
      type: "payment",
      description: "Bus Fare - Route 1A",
      amount: -2.5,
      date: "2024-01-15T10:30:00Z",
      status: "completed",
      merchant: "City Transport",
    },
    {
      id: "2",
      type: "topup",
      description: "Wallet Top-up",
      amount: 50.0,
      date: "2024-01-14T15:45:00Z",
      status: "completed",
      merchant: "EcoCash",
    },
    {
      id: "3",
      type: "payment",
      description: "Grocery Store",
      amount: -15.75,
      date: "2024-01-14T12:20:00Z",
      status: "completed",
      merchant: "OK Supermarket",
    },
    {
      id: "4",
      type: "receive",
      description: "Money from John Smith",
      amount: 25.0,
      date: "2024-01-13T09:15:00Z",
      status: "completed",
      merchant: "P2P Transfer",
    },
    {
      id: "5",
      type: "payment",
      description: "ZESA Electricity Bill",
      amount: -45.2,
      date: "2024-01-12T16:30:00Z",
      status: "completed",
      merchant: "ZESA Holdings",
    },
    {
      id: "6",
      type: "payment",
      description: "Mobile Airtime",
      amount: -10.0,
      date: "2024-01-11T11:20:00Z",
      status: "completed",
      merchant: "Econet",
    },
    {
      id: "7",
      type: "receive",
      description: "Refund - Cancelled Order",
      amount: 8.5,
      date: "2024-01-10T14:45:00Z",
      status: "completed",
      merchant: "Online Store",
    },
    {
      id: "8",
      type: "topup",
      description: "Bank Transfer",
      amount: 100.0,
      date: "2024-01-09T09:00:00Z",
      status: "completed",
      merchant: "CBZ Bank",
    },
    {
      id: "9",
      type: "payment",
      description: "University Fees",
      amount: -150.0,
      date: "2024-01-08T14:00:00Z",
      status: "completed",
      merchant: "University of Zimbabwe",
    },
    {
      id: "10",
      type: "payment",
      description: "Water Bill",
      amount: -25.0,
      date: "2024-01-07T11:30:00Z",
      status: "completed",
      merchant: "Harare Water",
    },
    {
      id: "11",
      type: "payment",
      description: "Internet Bill",
      amount: -35.0,
      date: "2024-01-06T16:45:00Z",
      status: "completed",
      merchant: "Liquid Telecom",
    },
    {
      id: "12",
      type: "payment",
      description: "Fuel Purchase",
      amount: -40.0,
      date: "2024-01-05T08:20:00Z",
      status: "completed",
      merchant: "Zuva Petroleum",
    },
  ]

  // Calculate monthly expenses
  const currentMonthTransactions = allTransactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date)
    return (
      transactionDate.getMonth() === selectedMonth &&
      transactionDate.getFullYear() === selectedYear &&
      transaction.amount < 0 // Only expenses (negative amounts)
    )
  })

  const monthlyExpenses = currentMonthTransactions.reduce((total, transaction) => {
    return total + Math.abs(transaction.amount)
  }, 0)

  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = selectedFilter === "all" || transaction.type === selectedFilter

    // Filter by selected month/year
    const transactionDate = new Date(transaction.date)
    const matchesDate = transactionDate.getMonth() === selectedMonth && transactionDate.getFullYear() === selectedYear

    return matchesSearch && matchesFilter && matchesDate
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
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
              <p className="text-sm text-gray-600">{currentMonthTransactions.length} expense transactions</p>
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
                  className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
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
                      {transaction.type === "payment" ? (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      ) : transaction.type === "topup" ? (
                        <Plus className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.merchant}</p>
                      <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
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
