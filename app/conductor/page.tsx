"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Camera,
  QrCode,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  DollarSign,
  Clock,
  Bus,
  Navigation,
  AlertTriangle,
} from "lucide-react"

interface TicketDetails {
  ticket_id: string
  user_name: string
  user_phone: string
  route_name: string
  station_name: string
  total_fare: number
  currency: string
  boarding_confirmed?: boolean
  dropoff_confirmed?: boolean
  boarding_time?: string
  dropoff_time?: string
}

export default function ConductorPage() {
  const [step, setStep] = useState<"login" | "scan" | "verify" | "success" | "error">("login")
  const [conductorId, setConductorId] = useState("")
  const [pin, setPin] = useState("")
  const [scannedTicket, setScannedTicket] = useState<string>("")
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null)
  const [selectedAction, setSelectedAction] = useState<"CONFIRM_BOARDING" | "CONFIRM_DROPOFF" | "CHANGE_DROPOFF">(
    "CONFIRM_BOARDING",
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Demo conductor credentials
  const demoConductor = {
    id: "COND_001",
    pin: "1234",
    name: "John Conductor",
    route: "CBD to Avondale",
  }

  // Demo tickets for testing
  const demoTickets = [
    {
      qr_code: "TICKET_1234567890_ABC123",
      ticket_id: "TXN_1692123456",
      user_name: "Tendai Moyo",
      user_phone: "+263772222222",
      route_name: "CBD to Avondale",
      station_name: "Five Avenue Shopping Centre",
      total_fare: 1.5,
      currency: "USD",
      boarding_confirmed: false,
      dropoff_confirmed: false,
    },
    {
      qr_code: "TICKET_0987654321_XYZ789",
      ticket_id: "TXN_1692123457",
      user_name: "Rudo Chikafu",
      user_phone: "+263773333333",
      route_name: "CBD to Borrowdale",
      station_name: "Borrowdale Shopping Centre",
      total_fare: 2.25,
      currency: "USD",
      boarding_confirmed: true,
      dropoff_confirmed: false,
      boarding_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    },
  ]

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate login
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (conductorId === demoConductor.id && pin === demoConductor.pin) {
        setIsLoggedIn(true)
        setStep("scan")
      } else {
        setError("Invalid conductor ID or PIN")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanDemo = (ticket: any) => {
    setScannedTicket(ticket.qr_code)
    setTicketDetails(ticket)
    setStep("verify")
    setError(null)

    // Set default action based on ticket status
    if (!ticket.boarding_confirmed) {
      setSelectedAction("CONFIRM_BOARDING")
    } else if (!ticket.dropoff_confirmed) {
      setSelectedAction("CONFIRM_DROPOFF")
    }
  }

  const handleVerifyAction = async () => {
    if (!ticketDetails) return

    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update ticket details based on action
      const updatedTicket = { ...ticketDetails }

      if (selectedAction === "CONFIRM_BOARDING") {
        updatedTicket.boarding_confirmed = true
        updatedTicket.boarding_time = new Date().toISOString()
      } else if (selectedAction === "CONFIRM_DROPOFF") {
        updatedTicket.dropoff_confirmed = true
        updatedTicket.dropoff_time = new Date().toISOString()
      }

      setTicketDetails(updatedTicket)
      setStep("success")
    } catch (err) {
      setError("Verification failed. Please try again.")
      setStep("error")
    } finally {
      setIsLoading(false)
    }
  }

  const resetScanner = () => {
    setStep("scan")
    setScannedTicket("")
    setTicketDetails(null)
    setError(null)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setStep("login")
    setConductorId("")
    setPin("")
    resetScanner()
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Bus className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Conductor Login</h1>
              <p className="text-blue-100">PayPass Verification System</p>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="conductorId" className="block text-sm font-medium text-gray-700 mb-2">
                  Conductor ID
                </label>
                <input
                  id="conductorId"
                  type="text"
                  value={conductorId}
                  onChange={(e) => setConductorId(e.target.value)}
                  placeholder="Enter your conductor ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your PIN"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading || !conductorId || !pin}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>

              {/* Demo Credentials */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials</h3>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>ID:</strong> {demoConductor.id}
                  </p>
                  <p>
                    <strong>PIN:</strong> {demoConductor.pin}
                  </p>
                  <p>
                    <strong>Route:</strong> {demoConductor.route}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConductorId(demoConductor.id)
                    setPin(demoConductor.pin)
                  }}
                  className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Use Demo Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === "success" && ticketDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Action Completed!</h1>
            <p className="text-gray-600 text-center mb-6">
              {selectedAction === "CONFIRM_BOARDING"
                ? "Passenger boarding confirmed"
                : selectedAction === "CONFIRM_DROPOFF"
                  ? "Passenger drop-off confirmed"
                  : "Drop-off location updated"}
            </p>

            {/* Updated Ticket Details */}
            <div className="w-full bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Passenger:</span>
                  <span className="font-medium">{ticketDetails.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{ticketDetails.route_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drop-off:</span>
                  <span className="font-medium">{ticketDetails.station_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fare:</span>
                  <span className="font-bold text-green-600">
                    {ticketDetails.currency} {ticketDetails.total_fare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Boarding:</span>
                  <span
                    className={`font-medium ${ticketDetails.boarding_confirmed ? "text-green-600" : "text-gray-400"}`}
                  >
                    {ticketDetails.boarding_confirmed ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drop-off:</span>
                  <span
                    className={`font-medium ${ticketDetails.dropoff_confirmed ? "text-green-600" : "text-gray-400"}`}
                  >
                    {ticketDetails.dropoff_confirmed ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={resetScanner}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Scan Another Ticket
              </button>
              <button
                onClick={logout}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="w-full space-y-3">
              <button
                onClick={resetScanner}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Try Again
              </button>
              <button
                onClick={logout}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === "verify" && ticketDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
            <div className="flex items-center mb-4">
              <button onClick={resetScanner} className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Verify Ticket</h1>
                <p className="text-blue-100">Conductor: {demoConductor.name}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Ticket Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{ticketDetails.user_name}</h3>
                  <p className="text-sm text-gray-500">{ticketDetails.user_phone}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    Route
                  </span>
                  <span className="font-medium">{ticketDetails.route_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Drop-off
                  </span>
                  <span className="font-medium">{ticketDetails.station_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Fare Paid
                  </span>
                  <span className="font-bold text-green-600">
                    {ticketDetails.currency} {ticketDetails.total_fare.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-lg text-center ${
                    ticketDetails.boarding_confirmed
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      ticketDetails.boarding_confirmed ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {ticketDetails.boarding_confirmed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      ticketDetails.boarding_confirmed ? "text-green-700" : "text-gray-500"
                    }`}
                  >
                    Boarding
                  </p>
                  <p className={`text-xs ${ticketDetails.boarding_confirmed ? "text-green-600" : "text-gray-400"}`}>
                    {ticketDetails.boarding_confirmed ? "Confirmed" : "Pending"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    ticketDetails.dropoff_confirmed
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      ticketDetails.dropoff_confirmed ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {ticketDetails.dropoff_confirmed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Navigation className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      ticketDetails.dropoff_confirmed ? "text-green-700" : "text-gray-500"
                    }`}
                  >
                    Drop-off
                  </p>
                  <p className={`text-xs ${ticketDetails.dropoff_confirmed ? "text-green-600" : "text-gray-400"}`}>
                    {ticketDetails.dropoff_confirmed ? "Confirmed" : "Pending"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Action:</label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedAction("CONFIRM_BOARDING")}
                  disabled={ticketDetails.boarding_confirmed}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedAction === "CONFIRM_BOARDING"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  } ${ticketDetails.boarding_confirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Confirm Boarding</span>
                    {ticketDetails.boarding_confirmed && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Passenger has boarded the bus</p>
                </button>

                <button
                  onClick={() => setSelectedAction("CONFIRM_DROPOFF")}
                  disabled={!ticketDetails.boarding_confirmed || ticketDetails.dropoff_confirmed}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedAction === "CONFIRM_DROPOFF"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  } ${!ticketDetails.boarding_confirmed || ticketDetails.dropoff_confirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Confirm Drop-off</span>
                    {ticketDetails.dropoff_confirmed && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Passenger has reached destination</p>
                </button>

                <button
                  onClick={() => setSelectedAction("CHANGE_DROPOFF")}
                  disabled={ticketDetails.dropoff_confirmed}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedAction === "CHANGE_DROPOFF"
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  } ${ticketDetails.dropoff_confirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Change Drop-off</span>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Update passenger destination</p>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-3">
              <button
                onClick={handleVerifyAction}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading
                  ? "Processing..."
                  : selectedAction === "CONFIRM_BOARDING"
                    ? "Confirm Boarding"
                    : selectedAction === "CONFIRM_DROPOFF"
                      ? "Confirm Drop-off"
                      : "Change Drop-off"}
              </button>
              <button
                onClick={resetScanner}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default scan screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Conductor Scanner</h1>
              <p className="text-blue-100">
                {demoConductor.name} • {demoConductor.route}
              </p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="text-center">
            <div className="w-64 h-64 mx-auto mb-8 bg-gray-100 rounded-2xl flex items-center justify-center border-4 border-dashed border-gray-300">
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Scan passenger ticket</p>
              </div>
            </div>
            <button
              onClick={() => {
                /* In real app, this would start camera */
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 mb-6"
            >
              Start Ticket Scanner
            </button>
          </div>

          {/* Demo Tickets */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Tickets</h3>
            <p className="text-sm text-gray-600 mb-4">Try these sample tickets for verification:</p>
            <div className="space-y-3">
              {demoTickets.map((ticket, index) => (
                <button
                  key={ticket.qr_code}
                  onClick={() => handleScanDemo(ticket)}
                  className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ticket.user_name}</p>
                      <p className="text-sm text-gray-600">{ticket.route_name}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.currency} {ticket.total_fare.toFixed(2)} • {ticket.station_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {ticket.boarding_confirmed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        {ticket.dropoff_confirmed ? (
                          <Navigation className="w-4 h-4 text-green-600" />
                        ) : (
                          <Navigation className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">🎫 Conductor Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Scan passenger QR tickets to verify payment</li>
              <li>• Confirm boarding when passenger enters bus</li>
              <li>• Confirm drop-off when passenger exits</li>
              <li>• Change drop-off if passenger extends journey</li>
              <li>• All actions are logged for audit purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
