"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Bell,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Lock,
  Eye,
  Fingerprint,
  Key,
  AlertTriangle,
  Home,
  QrCode,
  History,
  User,
  ChevronRight,
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      sms: true,
      email: false,
      transactions: true,
      promotions: false,
    },
    security: {
      biometric: false,
      autoLock: true,
      autoLockTime: 5, // minutes
      transactionPin: true,
    },
    privacy: {
      showBalance: false,
      shareData: false,
      analytics: true,
    },
    app: {
      theme: "light", // light, dark, auto
      language: "en",
      currency: "USD",
    },
  })
  const [showPinChange, setShowPinChange] = useState(false)
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("userSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  const updateSettings = (category: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category as keyof typeof settings],
        [key]: value,
      },
    }
    setSettings(newSettings)
    localStorage.setItem("userSettings", JSON.stringify(newSettings))
  }

  const handlePinChange = () => {
    if (pinForm.newPin !== pinForm.confirmPin) {
      alert("New PIN and confirmation don't match")
      return
    }
    if (pinForm.newPin.length !== 4) {
      alert("PIN must be 4 digits")
      return
    }
    // In a real app, this would verify current PIN and update
    alert("PIN changed successfully!")
    setPinForm({ currentPin: "", newPin: "", confirmPin: "" })
    setShowPinChange(false)
  }

  const languages = [
    { code: "en", name: "English" },
    { code: "sn", name: "Shona" },
    { code: "nd", name: "Ndebele" },
  ]

  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "ZWL", name: "Zimbabwe Dollar" },
    { code: "ZAR", name: "South African Rand" },
  ]

  const autoLockTimes = [
    { value: 1, label: "1 minute" },
    { value: 5, label: "5 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 0, label: "Never" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-blue-100">Customize your PayPass experience</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 pb-24 space-y-8">
          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Security & Privacy
            </h3>
            <div className="space-y-4">
              {/* Biometric Authentication */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Fingerprint className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Biometric Login</p>
                    <p className="text-sm text-gray-500">Use fingerprint or face ID</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings("security", "biometric", !settings.security.biometric)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.security.biometric ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.security.biometric ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Auto Lock */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">Auto Lock</p>
                      <p className="text-sm text-gray-500">Lock app when inactive</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings("security", "autoLock", !settings.security.autoLock)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.security.autoLock ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.security.autoLock ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {settings.security.autoLock && (
                  <select
                    value={settings.security.autoLockTime}
                    onChange={(e) => updateSettings("security", "autoLockTime", Number.parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {autoLockTimes.map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Change PIN */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <button
                  onClick={() => setShowPinChange(!showPinChange)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-red-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Change PIN</p>
                      <p className="text-sm text-gray-500">Update your 4-digit PIN</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {showPinChange && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <input
                      type="password"
                      placeholder="Current PIN"
                      maxLength={4}
                      value={pinForm.currentPin}
                      onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="New PIN"
                      maxLength={4}
                      value={pinForm.newPin}
                      onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New PIN"
                      maxLength={4}
                      value={pinForm.confirmPin}
                      onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePinChange}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        Update PIN
                      </button>
                      <button
                        onClick={() => setShowPinChange(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Hide Balance</p>
                    <p className="text-sm text-gray-500">Hide balance on dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings("privacy", "showBalance", !settings.privacy.showBalance)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.privacy.showBalance ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.privacy.showBalance ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">App notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings("notifications", "push", !settings.notifications.push)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications.push ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.push ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Transaction Alerts</p>
                  <p className="text-sm text-gray-500">Get notified of all transactions</p>
                </div>
                <button
                  onClick={() => updateSettings("notifications", "transactions", !settings.notifications.transactions)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications.transactions ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.transactions ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive SMS alerts</p>
                </div>
                <button
                  onClick={() => updateSettings("notifications", "sms", !settings.notifications.sms)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications.sms ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.sms ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* App Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              App Preferences
            </h3>
            <div className="space-y-4">
              {/* Theme */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  {settings.app.theme === "light" ? (
                    <Sun className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Theme</p>
                    <p className="text-sm text-gray-500">Choose app appearance</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["light", "dark", "auto"].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateSettings("app", "theme", theme)}
                      className={`p-2 rounded-lg border text-sm capitalize ${
                        settings.app.theme === theme
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {theme === "auto" ? "System" : theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Globe className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-500">App display language</p>
                  </div>
                </div>
                <select
                  value={settings.app.language}
                  onChange={(e) => updateSettings("app", "language", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">$</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Default Currency</p>
                    <p className="text-sm text-gray-500">Primary currency display</p>
                  </div>
                </div>
                <select
                  value={settings.app.currency}
                  onChange={(e) => updateSettings("app", "currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to reset all settings to default?")) {
                    localStorage.removeItem("userSettings")
                    window.location.reload()
                  }
                }}
                className="w-full p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
              >
                Reset All Settings
              </button>
              <button
                onClick={() => {
                  if (
                    confirm("This will permanently delete your account and all data. This action cannot be undone.")
                  ) {
                    alert("Account deletion would be processed here")
                  }
                }}
                className="w-full p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* App Information */}
          <div className="text-center text-gray-500 text-sm">
            <p>PayPass v1.0.0</p>
            <p>Build 2024.01.15</p>
            <p className="mt-2">© 2024 PayPass Zimbabwe Ltd.</p>
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
