"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface VerificationResult {
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

interface RedisVerification {
  url_format: VerificationResult
  token_format: VerificationResult
  connectivity: VerificationResult
  ping_test: VerificationResult
  write_test: VerificationResult
  environment: {
    upstash_url: boolean
    upstash_token: boolean
    kv_url: boolean
    kv_token: boolean
  }
}

export default function RedisVerifyPage() {
  const router = useRouter()
  const [verification, setVerification] = useState<RedisVerification | null>(null)
  const [loading, setLoading] = useState(false)

  const runVerification = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/redis/verify")
      const data = await response.json()
      setVerification(data)
    } catch (error) {
      console.error("Verification failed:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runVerification()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  const overallStatus = verification
    ? Object.values(verification)
        .slice(0, -1)
        .every((check: any) => check.status === "success")
      ? "success"
      : Object.values(verification)
            .slice(0, -1)
            .some((check: any) => check.status === "error")
        ? "error"
        : "warning"
    : "unknown"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-paypass text-white px-6 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-white hover:bg-white/20 p-2 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Redis Verification</h1>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Upstash Redis Status</h2>
              <p className="text-white/80 text-sm">Verify connection and environment configuration</p>
            </div>
            <Button
              onClick={runVerification}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Running verification tests...</p>
            </CardContent>
          </Card>
        ) : verification ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <Card
              className={`border-2 ${
                overallStatus === "success"
                  ? "border-green-200 bg-green-50"
                  : overallStatus === "error"
                    ? "border-red-200 bg-red-50"
                    : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(overallStatus)}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {overallStatus === "success"
                        ? "Redis Connected Successfully"
                        : overallStatus === "error"
                          ? "Redis Connection Failed"
                          : "Redis Partially Connected"}
                    </h3>
                    <p className="text-sm opacity-80">
                      {overallStatus === "success"
                        ? "All tests passed. Redis is ready for use."
                        : overallStatus === "error"
                          ? "Critical issues detected. Check configuration."
                          : "Some issues detected. Review warnings below."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Environment Variables</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">UPSTASH_REDIS_REST_URL</span>
                    <Badge variant={verification.environment.upstash_url ? "default" : "secondary"}>
                      {verification.environment.upstash_url ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">UPSTASH_REDIS_REST_TOKEN</span>
                    <Badge variant={verification.environment.upstash_token ? "default" : "secondary"}>
                      {verification.environment.upstash_token ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">KV_REST_API_URL</span>
                    <Badge variant={verification.environment.kv_url ? "default" : "secondary"}>
                      {verification.environment.kv_url ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">KV_REST_API_TOKEN</span>
                    <Badge variant={verification.environment.kv_token ? "default" : "secondary"}>
                      {verification.environment.kv_token ? "Set" : "Missing"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Tests */}
            <div className="space-y-4">
              {[
                { key: "url_format", title: "URL Format Check" },
                { key: "token_format", title: "Token Format Check" },
                { key: "connectivity", title: "Network Connectivity" },
                { key: "ping_test", title: "Redis PING Test" },
                { key: "write_test", title: "Read/Write Test" },
              ].map(({ key, title }) => {
                const result = verification[key as keyof RedisVerification] as VerificationResult
                return (
                  <Card key={key} className={`border ${getStatusColor(result.status)} border-opacity-50`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <h4 className="font-semibold">{title}</h4>
                          <p className="text-sm mt-1">{result.message}</p>
                          {result.details && <p className="text-xs mt-2 opacity-75">{result.details}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Troubleshooting */}
            {overallStatus !== "success" && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Troubleshooting Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 text-sm space-y-2">
                  <p>
                    <strong>Missing Environment Variables:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel Project Settings</li>
                    <li>Copy values exactly from your Upstash Redis database REST tab</li>
                    <li>Redeploy after adding environment variables</li>
                  </ul>

                  <p className="mt-4">
                    <strong>Connection Issues:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Verify the REST URL starts with https:// and ends with .upstash.io</li>
                    <li>Ensure the token matches the specific database (not account token)</li>
                    <li>Check if the Upstash database is active and not paused</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load verification results</p>
              <Button onClick={runVerification} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
