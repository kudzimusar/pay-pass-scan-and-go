"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Edit3,
  Eye,
  EyeOff,
  Camera,
  CreditCard,
  Bell,
  Shield,
  Settings,
  Home,
  QrCode,
  History,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  Globe,
} from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
    } else {
      setEditedUser({
        name: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
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

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile via API
    console.log("Saving profile:", editedUser)
    setIsEditing(false)
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getAccountAge = () => {
    // For now, return a default value since createdAt is not in the User interface
    return "30 days"
  }

  const menuItems = [
    {
      icon: CreditCard,
      title: "Payment Methods",
      subtitle: "Manage cards and accounts",
      href: "/payment-methods",
    },
    {
      icon: Bell,
      title: "Notifications",
      subtitle: "Push notifications and alerts",
      href: "/notifications",
    },
    {
      icon: Shield,
      title: "Security",
      subtitle: "PIN, biometrics, and privacy",
      href: "/settings",
    },
    {
      icon: Settings,
      title: "App Settings",
      subtitle: "Theme, language, and preferences",
      href: "/settings",
    },
  ]

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-blue-100">Manage your account</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Edit3 className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 w-full"
                    placeholder="Your name"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
                )}
                <p className="text-blue-100 text-sm">@paypass_user</p>
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold text-white">
                  {showBalance ? `$${user.walletBalance.toFixed(2)}` : "••••••"}
                </p>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {showBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <UserCheck className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium text-gray-900">{user.fullName}</p>
              </div>
            </div>

            {/* PayPass Username */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">PayPass Username</p>
                <p className="font-medium text-gray-900">@paypass_user</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <Phone className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your phone number"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user.phone}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <Mail className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your email address"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user.email}</p>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  Not provided
                </p>
              </div>
            </div>

            {/* Joined Date */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <MapPin className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium text-gray-900">January 2024</p>
                <p className="text-xs text-gray-500">Active for {getAccountAge()}</p>
              </div>
            </div>

            {/* Account Type */}
            <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
              <Shield className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="font-medium text-gray-900">Personal Account</p>
                <p className="text-xs text-gray-500">
                  PIN authentication
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="px-6 pb-24">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full mt-6 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
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
            <Link href="/pay-for-friend" className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-blue-600">
              <Globe className="w-5 h-5 mb-1" />
              <span className="text-xs">Pay Friend</span>
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
