"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, Download, Share, QrCode } from "lucide-react"

interface ReceiptData {
  transactionId: string
  provider: string
  category: string
  accountNumber?: string
  amount: number
  date: string
  billNumber: string
  status: string
  description?: string
}

export default function ProofOfPaymentPage() {
  const router = useRouter()
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem("user_data")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const user = JSON.parse(userData)
      setCurrentUser(user)

      // Get receipt data from localStorage
      const receiptDataStr = localStorage.getItem("receipt_data")
      if (receiptDataStr) {
        setReceiptData(JSON.parse(receiptDataStr))
      } else {
        router.push("/transactions")
      }
    } catch (error) {
      console.error("Error initializing page:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleDownload = () => {
    // In a real app, this would generate a PDF receipt
    alert("Receipt download functionality would be implemented here")
  }

  const handleShare = async () => {
    try {
<<<<<<< HEAD
      if (!receiptData) return
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: `PayPass Receipt - ${receiptData.provider}`,
          text: `Receipt for ${receiptData.provider} payment of $${receiptData.amount.toFixed(2)}`,
          url: window.location.href,
        })
        return
      }
      // Fallback: copy to clipboard
      const summary = `PayPass Receipt\nProvider: ${receiptData.provider}\nAmount: $${receiptData.amount.toFixed(
        2,
      )}\nBill: ${receiptData.billNumber}\nDate: ${new Date(receiptData.date).toLocaleString()}`
      await navigator.clipboard.writeText(summary)
      alert("Receipt details copied to clipboard")
    } catch (err: any) {
      console.error("Error sharing:", err)
      alert("Unable to share on this device")
=======
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: `PayPass Receipt - ${receiptData?.provider}`,
          text: `Receipt for ${receiptData?.provider} payment of $${receiptData?.amount.toFixed(2)}`,
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        if (navigator.clipboard) {
          const shareText = `PayPass Receipt - ${receiptData?.provider}\nAmount: $${receiptData?.amount.toFixed(2)}\nTransaction ID: ${receiptData?.transactionId}\nDate: ${new Date(receiptData?.date || "").toLocaleString()}`
          await navigator.clipboard.writeText(shareText)
          alert("Receipt details copied to clipboard!")
        } else {
          alert("Sharing not supported on this device. You can take a screenshot instead.")
        }
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Fallback: copy to clipboard or show alternative
      try {
        if (navigator.clipboard && receiptData) {
          const shareText = `PayPass Receipt - ${receiptData.provider}\nAmount: $${receiptData.amount.toFixed(2)}\nTransaction ID: ${receiptData.transactionId}\nDate: ${new Date(receiptData.date).toLocaleString()}`
          await navigator.clipboard.writeText(shareText)
          alert("Receipt details copied to clipboard!")
        } else {
          alert("Unable to share. You can take a screenshot of this receipt instead.")
        }
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError)
        alert("Unable to share or copy. You can take a screenshot of this receipt instead.")
      }
>>>>>>> origin/main
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">No receipt data found</p>
          <Link href="/transactions">
            <Button>Back to Transactions</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center mb-4">
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-2">Payment Receipt</h1>
          </div>
          <p className="text-blue-100 text-sm">Proof of payment for your records</p>
        </div>

        <div className="px-6 py-6">
          {/* Digital Receipt Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">PayPass Receipt</h2>
                  <p className="text-sm text-blue-100">{new Date(receiptData.date).toLocaleDateString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">P</span>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">${receiptData.amount.toFixed(2)}</h3>
                <p className="text-green-600 font-medium">Payment Successful</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-medium text-gray-900">{receiptData.transactionId.substring(0, 12)}...</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-medium text-gray-900">{receiptData.provider}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">{receiptData.category}</span>
                </div>

                {receiptData.accountNumber && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Account Number</span>
                    <span className="font-medium text-gray-900">{receiptData.accountNumber}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Bill Number</span>
                  <span className="font-medium text-gray-900">{receiptData.billNumber}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium text-gray-900">{new Date(receiptData.date).toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">{receiptData.status}</span>
                </div>

                {receiptData.description && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Description</span>
                    <span className="font-medium text-gray-900">{receiptData.description}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <QrCode className="w-24 h-24 text-gray-800" />
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 mt-3">Scan this code to verify payment</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 bg-transparent">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">This receipt serves as proof of payment. Keep it for your records.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
