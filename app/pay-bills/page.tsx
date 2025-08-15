"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Zap,
  Droplets,
  Wifi,
  Smartphone,
  Shield,
  Car,
  GraduationCap,
  Heart,
  Home,
  QrCode,
  History,
  User,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react"

interface CustomProvider {
  id: string
  name: string
  accountNumber: string
  categoryId: string
  notes?: string
}

export default function PayBillsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([])
  const [newProvider, setNewProvider] = useState({
    name: "",
    accountNumber: "",
    notes: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
    // Load custom providers from localStorage
    const saved = localStorage.getItem("customProviders")
    if (saved) {
      setCustomProviders(JSON.parse(saved))
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  const billCategories = [
    {
      id: "electricity",
      name: "Electricity",
      icon: Zap,
      color: "bg-yellow-100 text-yellow-600",
      providers: ["ZESA Holdings", "Solar Zimbabwe", "PowerTel"],
    },
    {
      id: "water",
      name: "Water",
      icon: Droplets,
      color: "bg-blue-100 text-blue-600",
      providers: ["Harare Water", "Bulawayo Water", "Mutare Water"],
    },
    {
      id: "internet",
      name: "Internet",
      icon: Wifi,
      color: "bg-purple-100 text-purple-600",
      providers: ["Liquid Telecom", "TelOne", "Powertel", "Utande"],
    },
    {
      id: "mobile",
      name: "Mobile",
      icon: Smartphone,
      color: "bg-green-100 text-green-600",
      providers: ["Econet", "NetOne", "Telecel"],
    },
    {
      id: "insurance",
      name: "Insurance",
      icon: Shield,
      color: "bg-red-100 text-red-600",
      providers: ["Old Mutual", "CIMAS", "Nyaradzo", "First Mutual"],
    },
    {
      id: "transport",
      name: "Transport",
      icon: Car,
      color: "bg-orange-100 text-orange-600",
      providers: ["ZINARA", "VID", "City Parking"],
    },
    {
      id: "education",
      name: "Education",
      icon: GraduationCap,
      color: "bg-indigo-100 text-indigo-600",
      providers: ["University of Zimbabwe", "NUST", "MSU", "Private Schools"],
    },
    {
      id: "health",
      name: "Health",
      icon: Heart,
      color: "bg-pink-100 text-pink-600",
      providers: ["Parirenyatwa", "CIMAS Medical", "Premier Medical"],
    },
  ]

  const filteredCategories = billCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.providers.some((provider) => provider.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleProviderSelect = (provider: string, isCustom = false, customProvider?: CustomProvider) => {
    if (isCustom && customProvider) {
      alert(`Selected ${customProvider.name} (Account: ${customProvider.accountNumber}). Payment form would open here.`)
    } else {
      alert(`Selected ${provider}. Payment form would open here.`)
    }
  }

  const handleAddCustomProvider = () => {
    if (!newProvider.name || !newProvider.accountNumber || !selectedCategory) return

    const customProvider: CustomProvider = {
      id: Date.now().toString(),
      name: newProvider.name,
      accountNumber: newProvider.accountNumber,
      categoryId: selectedCategory,
      notes: newProvider.notes,
    }

    const updated = [...customProviders, customProvider]
    setCustomProviders(updated)
    localStorage.setItem("customProviders", JSON.stringify(updated))
    setNewProvider({ name: "", accountNumber: "", notes: "" })
    setShowAddCustom(false)
  }

  const handleDeleteCustomProvider = (id: string) => {
    const updated = customProviders.filter((p) => p.id !== id)
    setCustomProviders(updated)
    localStorage.setItem("customProviders", JSON.stringify(updated))
  }

  if (selectedCategory) {
    const category = billCategories.find((cat) => cat.id === selectedCategory)
    if (!category) return null

    const categoryCustomProviders = customProviders.filter((p) => p.categoryId === selectedCategory)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        {/* Mobile Container */}
        <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{category.name} Bills</h1>
                <p className="text-blue-100">Select your service provider</p>
              </div>
              <button
                onClick={() => setShowAddCustom(!showAddCustom)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Add Custom Provider Form */}
          {showAddCustom && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">Add Custom Provider</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Provider name (e.g., UZ School Fees)"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Account/Reference number"
                  value={newProvider.accountNumber}
                  onChange={(e) => setNewProvider({ ...newProvider, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newProvider.notes}
                  onChange={(e) => setNewProvider({ ...newProvider, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddCustomProvider}
                    disabled={!newProvider.name || !newProvider.accountNumber}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Provider
                  </button>
                  <button
                    onClick={() => setShowAddCustom(false)}
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Providers */}
          {categoryCustomProviders.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Your Saved Providers</h3>
              <div className="space-y-2">
                {categoryCustomProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <button
                      onClick={() => handleProviderSelect(provider.name, true, provider)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <category.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{provider.name}</p>
                          <p className="text-sm text-gray-500">Account: {provider.accountNumber}</p>
                          {provider.notes && <p className="text-xs text-gray-400">{provider.notes}</p>}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomProvider(provider.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Providers List */}
          <div className="px-6 py-6 pb-24">
            <h3 className="font-medium text-gray-900 mb-3">Available Providers</h3>
            <div className="space-y-3">
              {category.providers.map((provider, index) => (
                <button
                  key={index}
                  onClick={() => handleProviderSelect(provider)}
                  className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <category.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{provider}</p>
                      <p className="text-sm text-gray-500">Pay your {category.name.toLowerCase()} bill</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>

            {/* Information Card */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Payment Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Payments are processed instantly</li>
                <li>• You'll receive a confirmation SMS</li>
                <li>• Keep your account number ready</li>
                <li>• Service fees may apply</li>
                <li>• Save frequently used providers for quick access</li>
              </ul>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
            <div className="flex items-center justify-around py-2">
              <Link
                href="/dashboard"
                className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600"
              >
                <Home className="w-5 h-5 mb-1" />
                <span className="text-xs">Home</span>
              </Link>
              <Link
                href="/qr-scanner"
                className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600"
              >
                <QrCode className="w-5 h-5 mb-1" />
                <span className="text-xs">Scan</span>
              </Link>
              <Link
                href="/transactions"
                className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600"
              >
                <History className="w-5 h-5 mb-1" />
                <span className="text-xs">History</span>
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
              <h1 className="text-2xl font-bold">Pay Bills</h1>
              <p className="text-blue-100">Choose a service to pay</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search bills or providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bill Categories */}
        <div className="px-6 py-6 pb-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            {filteredCategories.map((category) => {
              const IconComponent = category.icon
              const categoryCustomCount = customProviders.filter((p) => p.categoryId === category.id).length
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-3 rounded-lg ${category.color} mb-3`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-xs text-gray-500">
                      {category.providers.length} providers
                      {categoryCustomCount > 0 && ` + ${categoryCustomCount} custom`}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Quick Tips */}
          <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">💡 Quick Tips</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Add custom providers for schools, private services</li>
              <li>• Save frequently used billers for faster payments</li>
              <li>• Set up payment reminders to avoid late fees</li>
              <li>• Check your transaction history for payment records</li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">🔒 Secure Payments</h3>
            <p className="text-sm text-blue-700">
              All payments are encrypted and processed securely. Your financial information is protected with bank-level
              security.
            </p>
          </div>
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
            <Link
              href="/transactions"
              className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600"
            >
              <History className="w-5 h-5 mb-1" />
              <span className="text-xs">History</span>
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
