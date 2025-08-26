"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import BoardingScanner from "@/components/boarding-scanner"

export default function BoardingScannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile Container */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Boarding Scanner</h1>
              <p className="text-blue-100">Validate passenger tickets for boarding</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <BoardingScanner />
        </div>
      </div>
    </div>
  )
}
