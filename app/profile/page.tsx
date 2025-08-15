"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Edit3,
  Camera,
  Home,
  QrCode,
  History,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showBalance, setShowBalance] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
    } else {
      setEditForm({
        name: user.name,
        email: user.phone + "@paypass.zw", // Demo email
        phone: user.phone,
      })
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  const userBalance = typeof user.balance === "number" ? user.balance : 0

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile
    alert("Profile updated successfully!")
    setIsEditing(false)
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout()
      router.push("/")
    }
  }

  const profileMenuItems = [
    {
      icon: CreditCard,
      title: "Payment Methods",
      description: "Manage cards and payment options",
      action: () => alert("Payment methods coming soon"),
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage your notification preferences",
      action: () => alert("Notification settings coming soon"),
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "PIN, biometrics, and privacy settings",
      action: () => router.push("/settings"),
    },
    {
      icon: Settings,
      title: "App Settings",
      description: "Language, theme, and app preferences",
      action: () => router.push("/settings"),
    },
  ]

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-blue-100">Manage your account</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-blue-100">{user.phone}</p>
                <div className="flex items-center mt-2">
                  <span className="text-blue-100 text-sm mr-2">Balance:</span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="flex items-center space-x-1 text-white"
                  >
                    <span className="font-semibold">{showBalance ? `$${userBalance.toFixed(2)}` : "••••••"}</span>
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <h3 className="font-medium text-blue-900 mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Information */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Phone Number</p>
                <p className="text-sm text-gray-500">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Email Address</p>
                <p className="text-sm text-gray-500">{user.phone}@paypass.zw</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Account Type</p>
                <p className="text-sm text-gray-500 capitalize">{user.role} Account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-6 pb-24">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings & Preferences</h3>
          <div className="space-y-2">
            {profileMenuItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )
            })}
          </div>

          {/* Logout Button */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>

          {/* App Version */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">PayPass v1.0.0</p>
            <p className="text-xs text-gray-400">© 2024 PayPass Zimbabwe</p>
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
            <Link href="/profile" className="flex flex-col items-center py-2 px-3 text-blue-600">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
