import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileHeader from "@/components/mobile-header";

export default function QRScanner() {
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(true);
  const [detectedQR, setDetectedQR] = useState<string | null>(null);
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Simulate QR code detection after 3 seconds
    timeoutRef.current = setTimeout(() => {
      if (isScanning) {
        simulateQRDetection();
      }
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isScanning]);

  const simulateQRDetection = () => {
    const mockQRCode = "PP_" + Date.now() + "_ROUTE2A";
    setDetectedQR(mockQRCode);
    setIsScanning(false);
    
    // Automatically proceed to payment confirmation
    setTimeout(() => {
      processQRCode(mockQRCode);
    }, 1000);
  };

  const processQRCode = async (qrCode: string) => {
    try {
      const response = await apiRequest('POST', '/api/qr/scan', { qrCode });
      const data = await response.json();
      
      // Store scan result for payment confirmation
      sessionStorage.setItem('scanResult', JSON.stringify(data));
      setLocation('/payment-confirmation');
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "This QR code is not recognized. Please try scanning a valid PayPass QR code.",
        variant: "destructive",
      });
      setIsScanning(true);
      setDetectedQR(null);
    }
  };

  const handleManualQRInput = () => {
    // For demo purposes, simulate a bus QR code
    const mockQRCode = "PP_DEMO_ROUTE2A";
    processQRCode(mockQRCode);
  };

  return (
    <div className="relative h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/50 pt-12 pb-4 px-6">
        <div className="flex justify-between items-center text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-lg font-semibold">Scan to Pay</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Camera Viewfinder Simulation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 relative overflow-hidden">
          {/* Animated dots pattern to simulate camera feed */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              animation: 'float 3s ease-in-out infinite'
            }}
          />
          
          {/* QR Scanner Frame */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 relative">
              {/* Scanner corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-paypass-blue"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-paypass-blue"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-paypass-blue"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-paypass-blue"></div>
              
              {/* Scanning line animation */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-paypass-blue shadow-lg animate-pulse"></div>
                </div>
              )}
              
              {/* Detected QR indicator */}
              {detectedQR && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white p-2 rounded-lg animate-pulse">
                    <div className="w-full h-full bg-black opacity-30 flex items-center justify-center">
                      <svg className="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 012-2h1a1 1 0 000 2H5v1a1 1 0 01-2 0V5zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM6 18a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2H6zM13 3a1 1 0 100 2h1v1a1 1 0 102 0V5a2 2 0 00-2-2h-1zM21 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM21 15a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM18 18a1 1 0 100 2h1v1a1 1 0 102 0v-1a2 2 0 00-2-2h-1z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Instructions */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/50 p-6">
        <div className="text-center text-white">
          {isScanning ? (
            <>
              <p className="mb-4">Position QR code within the frame</p>
              <Button 
                onClick={handleManualQRInput}
                className="bg-paypass-blue text-white hover:bg-blue-700"
              >
                Simulate QR Detection
              </Button>
            </>
          ) : (
            <p className="mb-4">QR Code detected! Processing...</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
