"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Bell,
  Palette,
  Globe,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Smartphone,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Share2,
  RotateCcw,
  Trash2,
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
    biometricLogin: true,
    autoLock: true,
    autoLockTime: 5,
    pushNotifications: true,
    smsAlerts: false,
    transactionNotifications: true,
    theme: "auto",
    language: "en",
    currency: "USD",
    hideBalance: false,
    soundEffects: true,
    dataSharing: false,
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) })
    }
  }, [user, router])

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    localStorage.setItem("appSettings", JSON.stringify(newSettings))
  }

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }

  const resetSettings = () => {
    const defaultSettings = {
      biometricLogin: true,
      autoLock: true,
      autoLockTime: 5,
      pushNotifications: true,
      smsAlerts: false,
      transactionNotifications: true,
      theme: "auto",
      language: "en",
      currency: "USD",
      hideBalance: false,
      soundEffects: true,
      dataSharing: false,
    }
    saveSettings(defaultSettings)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "auto", label: "Auto", icon: Monitor },
  ]

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "sn", label: "Shona" },
    { value: "nd", label: "Ndebele" },
  ]

  const currencyOptions = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "ZWL", label: "Zimbabwe Dollar (Z$)" },
    { value: "ZAR", label: "South African Rand (R)" },
  ]

  const autoLockOptions = [
    { value: 1, label: "1 minute" },
    { value: 5, label: "5 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Container */}
      <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/profile" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-blue-100">Customize your app experience</p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="px-6 py-6 pb-24 space-y-6">
          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Security
            </h3>
            <div className="space-y-3">
              {/* Biometric Login */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Fingerprint className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Biometric Login</p>
                    <p className="text-sm text-gray-600">Use fingerprint or face ID</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("biometricLogin", !settings.biometricLogin)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.biometricLogin ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.biometricLogin ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Auto Lock */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Auto Lock</p>
                    <p className="text-sm text-gray-600">Lock app when inactive</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("autoLock", !settings.autoLock)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.autoLock ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.autoLock ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Auto Lock Time */}
              {settings.autoLock && (
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Auto Lock Timer</p>
                      <p className="text-sm text-gray-600">Time before auto lock</p>
                    </div>
                  </div>
                  <select
                    value={settings.autoLockTime}
                    onChange={(e) => updateSetting("autoLockTime", Number.parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {autoLockOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Change PIN */}
              <Link
                href="/change-pin"
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Change PIN</p>
                    <p className="text-sm text-gray-600">Update your security PIN</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-green-600" />
              Notifications
            </h3>
            <div className="space-y-3">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">App notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("pushNotifications", !settings.pushNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.pushNotifications ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.pushNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* SMS Alerts */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">SMS Alerts</p>
                    <p className="text-sm text-gray-600">Text message notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("smsAlerts", !settings.smsAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.smsAlerts ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.smsAlerts ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Transaction Notifications */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Transaction Alerts</p>
                    <p className="text-sm text-gray-600">Payment confirmations</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("transactionNotifications", !settings.transactionNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.transactionNotifications ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.transactionNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* App Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-purple-600" />
              Preferences
            </h3>
            <div className="space-y-3">
              {/* Theme */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Palette className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Theme</p>
                    <p className="text-sm text-gray-600">App appearance</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSetting("theme", option.value)}
                      className={`p-3 rounded-lg border transition-all ${
                        settings.theme === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <option.icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-600">App language</p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting("language", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Currency</p>
                    <p className="text-sm text-gray-600">Display currency</p>
                  </div>
                </div>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting("currency", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-orange-600" />
              Privacy
            </h3>
            <div className="space-y-3">
              {/* Hide Balance */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  {settings.hideBalance ? (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Hide Balance by Default</p>
                    <p className="text-sm text-gray-600">Start with balance hidden</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("hideBalance", !settings.hideBalance)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.hideBalance ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.hideBalance ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  {settings.soundEffects ? (
                    <Volume2 className="w-5 h-5 text-gray-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Sound Effects</p>
                    <p className="text-sm text-gray-600">App sounds and feedback</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("soundEffects", !settings.soundEffects)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.soundEffects ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.soundEffects ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Data Sharing */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Share2 className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Data Sharing</p>
                    <p className="text-sm text-gray-600">Share usage analytics</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting("dataSharing", !settings.dataSharing)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.dataSharing ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.dataSharing ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>
            <div className="space-y-3">
              {/* Reset Settings */}
              <button
                onClick={resetSettings}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 hover:border-red-300 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <p className="font-medium text-red-600">Reset Settings</p>
                    <p className="text-sm text-gray-600">Restore default settings</p>
                  </div>
                </div>
              </button>

              {/* Delete Account */}
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 hover:border-red-300 transition-all">
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <p className="font-medium text-red-600">Delete Account</p>
                    <p className="text-sm text-gray-600">Permanently delete your account</p>
                  </div>
                </div>
              </button>
            </div>
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
