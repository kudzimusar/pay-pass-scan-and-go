"use client"

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeGeneratorProps {
  data: string
  size?: number
  className?: string
}

export default function QRCodeGenerator({ data, size = 128, className = "" }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(url)
        setError('')
      } catch (err) {
        console.error('Error generating QR code:', err)
        setError('Failed to generate QR code')
      }
    }

    if (data) {
      generateQRCode()
    }
  }, [data, size])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <div className="text-center text-gray-500">
          <div className="text-xs">QR Code Error</div>
        </div>
      </div>
    )
  }

  if (!qrCodeUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <img 
      src={qrCodeUrl} 
      alt="QR Code for boarding" 
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
