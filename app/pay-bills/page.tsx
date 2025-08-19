"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
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
  Plus,
  Trash2,
  Building,
  CreditCard,
  Phone,
  Fuel,
} from "lucide-react"

interface CustomProvider {
  id: string
  name: string
  accountNumber: string
  notes: string
  category: string
}

export default function PayBillsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([])
  const [newProvider, setNewProvider] = useState({
    name: "",
    accountNumber: "",
    notes: "",
    category: "",
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

  const saveCustomProviders = (providers: CustomProvider[]) => {
    setCustomProviders(providers)
    localStorage.setItem("customProviders", JSON.stringify(providers))
  }

  const addCustomProvider = () => {
    if (newProvider.name && newProvider.accountNumber && selectedCategory) {
      const provider: CustomProvider = {
        id: Date.now().toString(),
        name: newProvider.name,
        accountNumber: newProvider.accountNumber,
        notes: newProvider.notes,
        category: selectedCategory,
      }
      saveCustomProviders([...customProviders, provider])
      setNewProvider({ name: "", accountNumber: "", notes: "", category: "" })
      setShowAddProvider(false)
    }
  }

  const deleteCustomProvider = (id: string) => {
    saveCustomProviders(customProviders.filter((p) => p.id !== id))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  const billCategories = [
    {
      id: "utilities",
      name: "Utilities",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      providers: [
        { name: "ZESA Holdings", accountType: "Meter Number", icon: Zap },
        { name: "Harare Water", accountType: "Account Number", icon: Droplets },
        { name: "City of Harare", accountType: "Account Number", icon: Building },
      ],
    },
    {
      id: "internet",
      name: "Internet & TV",
      icon: Wifi,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      providers: [
        { name: "Liquid Telecom", accountType: "Account Number", icon: Wifi },
        { name: "TelOne", accountType: "Phone Number", icon: Phone },
        { name: "Utande", accountType: "Account Number", icon: Wifi },
        { name: "DStv", accountType: "Smart Card Number", icon: CreditCard },
      ],
    },
    {
      id: "mobile",
      name: "Mobile & Airtime",
      icon: Smartphone,
      color: "text-green-600",
      bgColor: "bg-green-100",
      providers: [
        { name: "Econet", accountType: "Phone Number", icon: Smartphone },
        { name: "NetOne", accountType: "Phone Number", icon: Smartphone },
        { name: "Telecel", accountType: "Phone Number", icon: Smartphone },
      ],
    },
    {
      id: "education",
      name: "Education",
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      providers: [
        { name: "University of Zimbabwe", accountType: "Student Number", icon: GraduationCap },
        { name: "NUST", accountType: "Student Number", icon: GraduationCap },
        { name: "MSU", accountType: "Student Number", icon: GraduationCap },
        { name: "Chinhoyi University", accountType: "Student Number", icon: GraduationCap },
      ],
    },
    {
      id: "transport",
      name: "Transport & Fuel",
      icon: Car,
      color: "text-red-600",
      bgColor: "bg-red-100",
      providers: [
        { name: "Zuva Petroleum", accountType: "Card Number", icon: Fuel },
        { name: "Puma Energy", accountType: "Card Number", icon: Fuel },
        { name: "Total Energies", accountType: "Card Number", icon: Fuel },
        { name: "ZUPCO", accountType: "Card Number", icon: Car },
      ],
    },
    {
      id: "insurance",
      name: "Insurance & Medical",
      icon: Shield,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      providers: [
        { name: "Old Mutual", accountType: "Policy Number", icon: Shield },
        { name: "CIMAS", accountType: "Member Number", icon: Heart },
        { name: "Premier Medical Aid", accountType: "Member Number", icon: Heart },
        { name: "Econet Life", accountType: "Policy Number", icon: Shield },
      ],
    },
  ]

  const getCustomProvidersForCategory = (categoryId: string) => {
    return customProviders.filter((provider) => provider.category === categoryId)
  }

  if (selectedCategory) {
    const category = billCategories.find((cat) => cat.id === selectedCategory)
    const customProvidersForCategory = getCustomProvidersForCategory(selectedCategory)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{category?.name}</h1>
                <p className="text-blue-100">Select a provider to pay</p>
              </div>
              <button
                onClick={() => setShowAddProvider(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Add Custom Provider Modal */}
          {showAddProvider && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">Add Custom Provider</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                    <input
                      type="text"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., My University"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={newProvider.accountNumber}
                      onChange={(e) => setNewProvider({ ...newProvider, accountNumber: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Your account/student number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <input
                      type="text"
                      value={newProvider.notes}
                      onChange={(e) => setNewProvider({ ...newProvider, notes: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddProvider(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomProvider}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Add Provider
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Providers List */}
          <div className="px-6 py-6 pb-24">
            {/* Custom Providers */}
            {customProvidersForCategory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Custom Providers</h3>
                <div className="space-y-3">
                  {customProvidersForCategory.map((provider) => (
                    <div
                      key={provider.id}
                      className="bg-green-50 border border-green-200 p-4 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            {category && <category.icon className="w-5 h-5 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{provider.name}</p>
                            <p className="text-sm text-gray-600">Account: {provider.accountNumber}</p>
                            {provider.notes && <p className="text-xs text-gray-500">{provider.notes}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCustomProvider(provider.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Providers */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Providers</h3>
            <div className="space-y-3">
              {category?.providers.map((provider, index) => (
                <Link
                  key={index}
                  href={`/payment-confirmation?provider=${encodeURIComponent(provider.name)}&category=${encodeURIComponent(category.name)}`}
                  className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${category.bgColor} rounded-lg`}>
                      <provider.icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{provider.name}</p>
                      <p className="text-sm text-gray-600">{provider.accountType}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200">
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
      <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pay Bills</h1>
              <p className="text-blue-100">Choose a category to get started</p>
            </div>
          </div>
        </div>

        {/* Bill Categories */}
        <div className="px-6 py-6 pb-24">
          <div className="grid grid-cols-2 gap-4">
            {billCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className={`p-3 ${category.bgColor} rounded-lg mb-3`}>
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">{category.name}</span>
                {getCustomProvidersForCategory(category.id).length > 0 && (
                  <span className="text-xs text-green-600 mt-1">
                    {getCustomProvidersForCategory(category.id).length} custom
                  </span>
                )}
              </button>
            ))}
          </div>
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
