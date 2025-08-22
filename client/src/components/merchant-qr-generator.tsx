import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRGeneratorProps {
  merchantId: string;
  businessName: string;
}

export default function MerchantQRGenerator({ merchantId, businessName }: QRGeneratorProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateQRCode = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate QR code data in PayPass format
      const qrData = {
        type: "payment",
        merchantId: merchantId,
        businessName: businessName,
        amount: parseFloat(amount),
        description: description || "Payment",
        timestamp: new Date().toISOString(),
        currency: "USD"
      };

      const qrString = JSON.stringify(qrData);
      setQrCodeData(qrString);

      toast({
        title: "QR Code Generated",
        description: "Your payment QR code has been created successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyQRData = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData);
      toast({
        title: "Copied",
        description: "QR code data copied to clipboard.",
      });
    }
  };

  const downloadQRCode = () => {
    if (qrCodeData) {
      // Create a canvas element to generate QR code image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 300;
        canvas.height = 300;
        
        // Fill background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 300);
        
        // Add QR code placeholder (in real implementation, use a QR library)
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 150, 140);
        ctx.fillText(`Amount: $${amount}`, 150, 160);
        ctx.fillText(businessName, 150, 180);
        
        // Download the image
        const link = document.createElement('a');
        link.download = `paypass-qr-${amount}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast({
          title: "Downloaded",
          description: "QR code image downloaded successfully.",
        });
      }
    }
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setQrCodeData("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Generate Payment QR Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Payment description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={generateQRCode} 
              disabled={isGenerating || !amount}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {qrCodeData && (
        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">QR Code Preview</p>
                    <p className="text-lg font-bold">${amount}</p>
                    <p className="text-xs text-gray-500">{businessName}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">QR Code Details:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Amount:</strong> ${amount}</div>
                  <div><strong>Business:</strong> {businessName}</div>
                  <div><strong>Description:</strong> {description || "Payment"}</div>
                  <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button onClick={downloadQRCode} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
                <Button variant="outline" onClick={copyQRData}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data
                </Button>
              </div>

              {/* QR Code Data (for debugging) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  View QR Code Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(JSON.parse(qrCodeData), null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}