"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowRight,
  Smartphone,
  QrCode,
  MapPin,
  Calculator,
  CreditCard,
  Ticket,
  Bus,
  CheckCircle,
  User,
  Play,
  ScanLine,
  Eye,
  UserCheck,
  Monitor,
  AlertTriangle,
} from "lucide-react"

interface JourneyStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  duration: string
  details: string[]
  status: "completed" | "active" | "pending"
}

const passengerJourney: JourneyStep[] = [
  {
    id: 1,
    title: "Open PayPass App",
    description: "Launch app and authenticate",
    icon: <Smartphone className="w-6 h-6" />,
    duration: "30s",
    details: ["Biometric or PIN authentication", "Dashboard loads with wallet balance", "Recent transactions visible"],
    status: "completed",
  },
  {
    id: 2,
    title: "Scan Bus QR Code",
    description: "Scan QR code on bus to identify route",
    icon: <QrCode className="w-6 h-6" />,
    duration: "10s",
    details: ["Camera opens automatically", "QR code contains route and bus info", "Route details loaded instantly"],
    status: "completed",
  },
  {
    id: 3,
    title: "Select Drop-off Station",
    description: "Choose exact destination from route map",
    icon: <MapPin className="w-6 h-6" />,
    duration: "30s",
    details: ["Interactive route map displayed", "All stations clearly marked", "Distance and time estimates shown"],
    status: "active",
  },
  {
    id: 4,
    title: "Review Fare Calculation",
    description: "Dynamic pricing with peak hour detection",
    icon: <Calculator className="w-6 h-6" />,
    duration: "15s",
    details: ["Base fare + distance calculation", "Peak hour multiplier applied", "Total fare displayed in USD/ZWL"],
    status: "pending",
  },
  {
    id: 5,
    title: "Confirm Payment",
    description: "Secure wallet transaction",
    icon: <CreditCard className="w-6 h-6" />,
    duration: "10s",
    details: ["Wallet balance verification", "Payment processing", "Transaction confirmation"],
    status: "pending",
  },
  {
    id: 6,
    title: "Receive Digital Ticket",
    description: "QR-coded ticket with journey details",
    icon: <Ticket className="w-6 h-6" />,
    duration: "5s",
    details: ["Unique QR ticket generated", "Journey details embedded", "Ticket stored in app history"],
    status: "pending",
  },
  {
    id: 7,
    title: "Board Bus",
    description: "Conductor verification and boarding",
    icon: <Bus className="w-6 h-6" />,
    duration: "15s",
    details: ["Show ticket QR to conductor", "Conductor scans and verifies", "Boarding confirmed in system"],
    status: "pending",
  },
  {
    id: 8,
    title: "Journey Complete",
    description: "Arrival and drop-off confirmation",
    icon: <CheckCircle className="w-6 h-6" />,
    duration: "5s",
    details: ["GPS confirms arrival at station", "Journey marked as complete", "Receipt generated automatically"],
    status: "pending",
  },
]

const conductorJourney: JourneyStep[] = [
  {
    id: 1,
    title: "Login to Conductor App",
    description: "Secure authentication with ID/PIN",
    icon: <User className="w-6 h-6" />,
    duration: "45s",
    details: ["Enter conductor ID and PIN", "System verifies credentials", "Access granted to conductor dashboard"],
    status: "completed",
  },
  {
    id: 2,
    title: "Start Shift",
    description: "Route assignment and scanner activation",
    icon: <Play className="w-6 h-6" />,
    duration: "30s",
    details: ["Select assigned route and bus", "Activate QR scanner", "System ready for passenger verification"],
    status: "completed",
  },
  {
    id: 3,
    title: "Scan Passenger Ticket",
    description: "QR code verification and payment check",
    icon: <ScanLine className="w-6 h-6" />,
    duration: "5s",
    details: ["Scan passenger's digital ticket", "Verify payment status", "Check journey validity"],
    status: "active",
  },
  {
    id: 4,
    title: "Verify Journey Details",
    description: "Review passenger info and destination",
    icon: <Eye className="w-6 h-6" />,
    duration: "10s",
    details: ["View passenger destination", "Check fare amount paid", "Confirm journey route match"],
    status: "pending",
  },
  {
    id: 5,
    title: "Confirm Boarding",
    description: "Mark passenger as boarded",
    icon: <UserCheck className="w-6 h-6" />,
    duration: "5s",
    details: ["Tap confirm boarding button", "Timestamp recorded", "Passenger added to manifest"],
    status: "pending",
  },
  {
    id: 6,
    title: "Monitor Journey",
    description: "Track passenger manifest and destinations",
    icon: <Monitor className="w-6 h-6" />,
    duration: "Ongoing",
    details: ["View current passenger list", "Track upcoming drop-offs", "Monitor route progress"],
    status: "pending",
  },
  {
    id: 7,
    title: "Handle Drop-offs",
    description: "Confirm passengers reaching stations",
    icon: <MapPin className="w-6 h-6" />,
    duration: "10s each",
    details: ["GPS confirms station arrival", "Mark passengers as dropped off", "Update manifest automatically"],
    status: "pending",
  },
  {
    id: 8,
    title: "Handle Exceptions",
    description: "Manage route changes and special cases",
    icon: <AlertTriangle className="w-6 h-6" />,
    duration: "Variable",
    details: ["Process refund requests", "Handle route diversions", "Manage system offline scenarios"],
    status: "pending",
  },
]

export default function UserJourneyMap() {
  const [activeTab, setActiveTab] = useState("passenger")
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const currentJourney = activeTab === "passenger" ? passengerJourney : conductorJourney

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PayPass Dynamic Route System</h1>
          <p className="text-xl text-gray-600 mb-6">User Journey Map for Drop-off Based Charging</p>
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="secondary" className="px-4 py-2">
              🚌 Zimbabwe Public Transport
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              💳 Digital Payments
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              📱 Mobile First
            </Badge>
          </div>
        </div>

        {/* Journey Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="passenger" className="text-lg py-3">
              👤 Passenger Journey
            </TabsTrigger>
            <TabsTrigger value="conductor" className="text-lg py-3">
              👨‍✈️ Conductor Journey
            </TabsTrigger>
          </TabsList>

          <TabsContent value="passenger">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Passenger Experience Flow</h2>
              <p className="text-gray-600">Complete journey from app launch to destination arrival</p>
            </div>
          </TabsContent>

          <TabsContent value="conductor">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Conductor Operations Flow</h2>
              <p className="text-gray-600">Daily operations from shift start to passenger management</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Journey Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentJourney.map((step, index) => (
            <div key={step.id} className="relative">
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  step.status === "completed"
                    ? "bg-green-50 border-green-200"
                    : step.status === "active"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                } ${selectedStep === step.id ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-full ${
                        step.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : step.status === "active"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <Badge
                      variant={
                        step.status === "completed" ? "default" : step.status === "active" ? "secondary" : "outline"
                      }
                    >
                      {step.duration}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>

                {selectedStep === step.id && (
                  <CardContent>
                    <div className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Arrow between steps */}
              {index < currentJourney.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* System Integration Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">🔄 System Integration Flow</CardTitle>
            <CardDescription>How different components work together in the PayPass ecosystem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-4 text-center">
              <Badge variant="outline" className="px-4 py-2">
                📱 Mobile App
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="px-4 py-2">
                📷 QR Scanner
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="px-4 py-2">
                🗺️ Route System
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="px-4 py-2">
                💰 Fare Calculator
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="px-4 py-2">
                💳 Payment Engine
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="px-4 py-2">
                👨‍✈️ Conductor App
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">👤 Passenger Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Choose exact drop-off destination</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Transparent fare calculation with real-time pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Digital ticket with QR verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Secure payment from wallet balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Complete journey tracking</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">👨‍✈️ Conductor Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Instant payment verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time passenger manifest</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Automated journey logging</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Exception handling capabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Complete audit trail</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Journey Efficiency Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">📊 Journey Efficiency</CardTitle>
            <CardDescription>Average time for key user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">~2 min</div>
                <div className="text-sm text-gray-600">QR Scan to Payment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">~30s</div>
                <div className="text-sm text-gray-600">Station Selection</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">~10s</div>
                <div className="text-sm text-gray-600">Payment Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">~5s</div>
                <div className="text-sm text-gray-600">Boarding Verification</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
