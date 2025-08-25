'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Scan, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Image,
  Flashlight,
  FlashlightOff,
  ScanLine
} from 'lucide-react';

// Mobile QR Scanner Component
// Optimized for mobile devices with camera integration and real-time scanning

interface ScanResult {
  success: boolean;
  data?: any;
  error?: string;
  type?: string;
  processResult?: any;
}

interface ScanHistory {
  id: string;
  data: string;
  timestamp: string;
  type: string;
  success: boolean;
}

interface CameraState {
  isActive: boolean;
  isSupported: boolean;
  facingMode: 'user' | 'environment';
  hasFlash: boolean;
  flashEnabled: boolean;
  error?: string;
}

const MobileScannerComponent: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isSupported: false,
    facingMode: 'environment',
    hasFlash: false,
    flashEnabled: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera on component mount
  useEffect(() => {
    checkCameraSupport();
    loadScanHistory();
    
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraSupport = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraState(prev => ({ ...prev, isSupported: true }));
    } else {
      setCameraState(prev => ({ 
        ...prev, 
        isSupported: false, 
        error: 'Camera not supported on this device' 
      }));
    }
  };

  const loadScanHistory = () => {
    try {
      const stored = localStorage.getItem('paypass_scan_history');
      if (stored) {
        setScanHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const saveScanHistory = (newScan: ScanHistory) => {
    try {
      const updated = [newScan, ...scanHistory.slice(0, 19)]; // Keep last 20
      setScanHistory(updated);
      localStorage.setItem('paypass_scan_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  };

  const startCamera = async () => {
    if (!cameraState.isSupported) return;

    try {
      setIsProcessing(true);
      
      const constraints = {
        video: {
          facingMode: cameraState.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        await videoRef.current.play();
        
        // Check for flash support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        const hasFlash = 'torch' in capabilities;
        
        setCameraState(prev => ({ 
          ...prev, 
          isActive: true, 
          hasFlash,
          error: undefined 
        }));
      }
      
    } catch (error) {
      console.error('Camera start error:', error);
      setCameraState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera. Please check permissions.' 
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setCameraState(prev => ({ 
      ...prev, 
      isActive: false, 
      flashEnabled: false 
    }));
  };

  const toggleFlash = async () => {
    if (!streamRef.current || !cameraState.hasFlash) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const newFlashState = !cameraState.flashEnabled;
      
      await track.applyConstraints({
        advanced: [{ torch: newFlashState }]
      });
      
      setCameraState(prev => ({ ...prev, flashEnabled: newFlashState }));
    } catch (error) {
      console.error('Flash toggle error:', error);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = cameraState.facingMode === 'environment' ? 'user' : 'environment';
    setCameraState(prev => ({ ...prev, facingMode: newFacingMode }));
    
    if (cameraState.isActive) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  const startScanning = () => {
    if (!cameraState.isActive) {
      startCamera();
    }
    
    setIsScanning(true);
    setScanResult(null);
    
    // Start continuous scanning
    scanIntervalRef.current = setInterval(() => {
      captureAndProcess();
    }, 500); // Scan every 500ms
  };

  const stopScanning = () => {
    setIsScanning(false);
    setConfidence(0);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 for processing
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Simulate QR code detection (in real implementation, use a QR library like jsQR)
      const qrData = await simulateQRDetection(imageData);
      
      if (qrData) {
        await processQRCode(qrData);
      }
      
    } catch (error) {
      console.error('Capture and process error:', error);
    }
  };

  const simulateQRDetection = async (imageData: string): Promise<string | null> => {
    // Simulate detection confidence
    const detectionConfidence = Math.random();
    setConfidence(detectionConfidence * 100);
    
    // Simulate finding a QR code (in real implementation, use jsQR or similar)
    if (detectionConfidence > 0.7) {
      // Mock QR data for demo
      const mockQRData = {
        type: 'merchant_payment',
        id: 'qr_merchant_demo_001',
        data: {
          merchantId: 'merchant_coffee_123',
          amount: 4.50,
          currency: 'USD',
          items: [{ name: 'Latte', price: 4.50, quantity: 1 }]
        },
        version: '2.0'
      };
      
      return Buffer.from(JSON.stringify(mockQRData)).toString('base64');
    }
    
    return null;
  };

  const processQRCode = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    stopScanning();
    
    try {
      // Call mobile QR scanner API
      const response = await fetch('/api/mobile/qr-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('paypass_token')}`
        },
        body: JSON.stringify({
          action: 'scan',
          qrData,
          scanType: 'payment',
          scanContext: {
            source: 'camera',
            timestamp: new Date().toISOString(),
            confidence: confidence / 100
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setScanResult({
          success: true,
          data: result.data.qrContent,
          type: result.data.format,
          processResult: result.data.processResult
        });
        
        // Save to history
        const historyEntry: ScanHistory = {
          id: `scan_${Date.now()}`,
          data: qrData,
          timestamp: new Date().toISOString(),
          type: result.data.format,
          success: true
        };
        saveScanHistory(historyEntry);
        
        // Provide haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
      } else {
        setScanResult({
          success: false,
          error: result.error || 'Failed to process QR code'
        });
      }
      
    } catch (error) {
      console.error('QR processing error:', error);
      setScanResult({
        success: false,
        error: 'Network error. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      const qrData = await simulateQRDetection(imageData);
      
      if (qrData) {
        await processQRCode(qrData);
      } else {
        setScanResult({
          success: false,
          error: 'No QR code detected in image'
        });
      }
    };
    
    reader.readAsDataURL(file);
  };

  const clearResult = () => {
    setScanResult(null);
    setConfidence(0);
  };

  const getScanResultIcon = () => {
    if (!scanResult) return null;
    
    if (scanResult.success) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else {
      return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  const getScanResultColor = () => {
    if (!scanResult) return 'border-gray-200';
    return scanResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  const getConfidenceColor = () => {
    if (confidence > 70) return 'bg-green-500';
    if (confidence > 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-md mx-auto space-y-4 p-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">QR Scanner</h2>
        <p className="text-muted-foreground">Scan QR codes for payments and more</p>
      </div>

      {/* Camera Error */}
      {cameraState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{cameraState.error}</AlertDescription>
        </Alert>
      )}

      {/* Camera View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-square bg-black">
            {cameraState.isActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg animate-pulse">
                      <ScanLine className="w-full h-1 text-white animate-bounce mt-24" />
                    </div>
                  </div>
                )}
                
                {/* Confidence Indicator */}
                {isScanning && confidence > 0 && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-black bg-opacity-50 rounded-lg p-2">
                      <div className="flex items-center justify-between text-white text-sm mb-1">
                        <span>Detection</span>
                        <span>{confidence.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${getConfidenceColor()}`}
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Camera Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={switchCamera}
                    className="bg-black bg-opacity-50 text-white border-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  
                  {cameraState.hasFlash && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFlash}
                      className="bg-black bg-opacity-50 text-white border-white"
                    >
                      {cameraState.flashEnabled ? 
                        <FlashlightOff className="w-4 h-4" /> : 
                        <Flashlight className="w-4 h-4" />
                      }
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Camera Inactive</p>
                  <p className="text-sm opacity-75">Tap "Start Scanning" to begin</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="space-y-3">
        {!isScanning ? (
          <Button 
            onClick={startScanning} 
            className="w-full" 
            size="lg"
            disabled={!cameraState.isSupported || isProcessing}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Starting Camera...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={stopScanning} 
            variant="outline" 
            className="w-full" 
            size="lg"
          >
            Stop Scanning
          </Button>
        )}

        {/* File Upload Option */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={isProcessing}
          >
            <Image className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <Card className={getScanResultColor()}>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              {getScanResultIcon()}
              <CardTitle className="text-lg">
                {scanResult.success ? 'QR Code Detected' : 'Scan Failed'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {scanResult.success ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <Badge variant="outline">{scanResult.type}</Badge>
                  </div>
                  
                  {scanResult.processResult?.type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category:</span>
                      <Badge variant="outline">{scanResult.processResult.type}</Badge>
                    </div>
                  )}
                  
                  {scanResult.processResult?.merchant && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Merchant:</span>
                      <p className="text-sm text-muted-foreground">
                        {scanResult.processResult.merchant.name}
                      </p>
                    </div>
                  )}
                  
                  {scanResult.processResult?.payment && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Amount:</span>
                      <p className="text-lg font-bold">
                        ${scanResult.processResult.payment.amount} {scanResult.processResult.payment.currency}
                      </p>
                    </div>
                  )}
                </div>
                
                {scanResult.processResult?.nextStep === 'confirm_payment' && (
                  <Button className="w-full" size="lg">
                    <Zap className="w-4 h-4 mr-2" />
                    Proceed to Payment
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-red-600">{scanResult.error}</p>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearResult}
              className="w-full"
            >
              Scan Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Scans</CardTitle>
            <CardDescription>Your last few QR code scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 3).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    {scan.success ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> :
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    }
                    <div>
                      <p className="text-sm font-medium capitalize">{scan.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {scan.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default MobileScannerComponent;
