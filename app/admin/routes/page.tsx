"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, MapPin, Edit, Trash2, Clock, DollarSign, Bus } from "lucide-react"

interface Route {
  route_id: string
  route_name: string
  base_fare_usd: number
  base_fare_zig: number
  station_count: number
  is_active: boolean
}

interface Station {
  station_id: string
  station_name: string
  order_on_route: number
}

interface PricingRule {
  rule_id: string
  rule_name: string
  start_time: string
  end_time: string
  fare_adjustment_value_usd: number
  status: string
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [activeTab, setActiveTab] = useState<"routes" | "stations" | "pricing">("routes")
  const [isLoading, setIsLoading] = useState(false)

  // Demo data
  const demoRoutes: Route[] = [
    {
      route_id: "HAR-CBD-AVENUE",
      route_name: "CBD to Avondale",
      base_fare_usd: 1.0,
      base_fare_zig: 2.5,
      station_count: 5,
      is_active: true,
    },
    {
      route_id: "HAR-CBD-BORROWDALE",
      route_name: "CBD to Borrowdale",
      base_fare_usd: 1.5,
      base_fare_zig: 3.75,
      station_count: 4,
      is_active: true,
    },
  ]

  const demoStations: Station[] = [
    { station_id: "CBD-S01", station_name: "CBD Rank (Start)", order_on_route: 1 },
    { station_id: "CBD-S02", station_name: "Simon Muzenda Street", order_on_route: 2 },
    { station_id: "CBD-S03", station_name: "Fourth Street", order_on_route: 3 },
    { station_id: "AVENUE-S01", station_name: "Five Avenue Shopping Centre", order_on_route: 4 },
    { station_id: "AVENUE-S02", station_name: "Avondale Shops (End)", order_on_route: 5 },
  ]

  const demoPricingRules: PricingRule[] = [
    {
      rule_id: "PEAK-MORNING-CBD-AVE",
      rule_name: "Morning Peak Surcharge",
      start_time: "06:00",
      end_time: "09:00",
      fare_adjustment_value_usd: 0.5,
      status: "ACTIVE",
    },
    {
      rule_id: "PEAK-EVENING-CBD-AVE",
      rule_name: "Evening Peak Surcharge",
      start_time: "16:00",
      end_time: "19:00",
      fare_adjustment_value_usd: 0.5,
      status: "ACTIVE",
    },
  ]

  useEffect(() => {
    // Load demo data
    setRoutes(demoRoutes)
    if (demoRoutes.length > 0) {
      setSelectedRoute(demoRoutes[0])
      setStations(demoStations)
      setPricingRules(demoPricingRules)
    }
  }, [])

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route)
    // In real app, this would fetch stations and pricing rules for the selected route
    if (route.route_id === "HAR-CBD-AVENUE") {
      setStations(demoStations)
      setPricingRules(demoPricingRules)
    } else {
      setStations([
        { station_id: "CBD-B01", station_name: "CBD Rank (Start)", order_on_route: 1 },
        { station_id: "CBD-B02", station_name: "Samora Machel Avenue", order_on_route: 2 },
        { station_id: "BORROWDALE-B01", station_name: "Borrowdale Shopping Centre", order_on_route: 3 },
        { station_id: "BORROWDALE-B02", station_name: "Borrowdale Race Course", order_on_route: 4 },
      ])
      setPricingRules([
        {
          rule_id: "PEAK-MORNING-CBD-BOR",
          rule_name: "Morning Peak Surcharge",
          start_time: "06:00",
          end_time: "09:00",
          fare_adjustment_value_usd: 0.75,
          status: "ACTIVE",
        },
      ])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-sm mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/admin" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Route Management</h1>
              <p className="text-blue-100">Configure routes, stations & pricing</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("routes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "routes" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Routes
            </button>
            <button
              onClick={() => setActiveTab("stations")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "stations" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Stations
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "pricing" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pricing
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 pb-24">
          {activeTab === "routes" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Routes</h2>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {routes.map((route) => (
                  <div
                    key={route.route_id}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
                      selectedRoute?.route_id === route.route_id
                        ? "border-blue-300 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleRouteSelect(route)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{route.route_name}</h3>
                          <p className="text-sm text-gray-500">{route.route_id}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Base Fare</p>
                        <p className="font-medium">${route.base_fare_usd.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stations</p>
                        <p className="font-medium">{route.station_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            route.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {route.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "stations" && selectedRoute && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Stations</h2>
                  <p className="text-sm text-gray-500">{selectedRoute.route_name}</p>
                </div>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {stations.map((station, index) => (
                  <div
                    key={station.station_id}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{station.order_on_route}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{station.station_name}</h3>
                          <p className="text-sm text-gray-500">{station.station_id}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <MapPin className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pricing" && selectedRoute && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Pricing Rules</h2>
                  <p className="text-sm text-gray-500">{selectedRoute.route_name}</p>
                </div>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Base Fare Card */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Base Fare</h3>
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">USD</p>
                    <p className="text-xl font-bold text-green-600">${selectedRoute.base_fare_usd.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ZiG</p>
                    <p className="text-xl font-bold text-green-600">ZiG {selectedRoute.base_fare_zig.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Rules */}
              <div className="space-y-3">
                {pricingRules.map((rule) => (
                  <div
                    key={rule.rule_id}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{rule.rule_name}</h3>
                          <p className="text-sm text-gray-500">
                            {rule.start_time} - {rule.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Surcharge:</span>
                        <span className="font-semibold text-orange-600">
                          +${rule.fare_adjustment_value_usd.toFixed(2)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          rule.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {rule.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
