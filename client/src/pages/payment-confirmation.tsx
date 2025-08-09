import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import MobileHeader from "@/components/mobile-header";
import { Bus, Shield, Fingerprint } from "lucide-react";

export default function PaymentConfirmation() {
  const [, setLocation] = useLocation();
  const [scanResult, setScanResult] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ['/api/user/wallet'],
    enabled: !!token,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('scanResult');
    if (stored) {
      setScanResult(JSON.parse(stored));
    } else {
      // Fallback mock data for demo
      setScanResult({
        route: {
          id: 'demo-route',
          name: 'City Bus Route 2A',
          description: 'Standard Fare',
          fareUsd: '1.50',
          fareZwl: '3000.00'
        },
        operator: {
          companyName: 'City Transport Co.'
        }
      });
    }
  }, []);

  if (!scanResult) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader title="Payment Confirmation" showBack backTo="/qr-scanner" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  const fare = selectedCurrency === 'USD' 
    ? parseFloat(scanResult.route.fareUsd)
    : parseFloat(scanResult.route.fareZwl);

  const balance = selectedCurrency === 'USD'
    ? parseFloat(wallet?.usdBalance || '0')
    : parseFloat(wallet?.zwlBalance || '0');

  const hasSufficientBalance = balance >= fare;

  const handlePayment = async () => {
    if (!hasSufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: `Your ${selectedCurrency} balance is too low for this payment.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const amount = selectedCurrency === 'USD' ? scanResult.route.fareUsd : scanResult.route.fareZwl;
      
      const response = await apiRequest('POST', '/api/payment/process', {
        routeId: scanResult.route.id,
        currency: selectedCurrency,
        amount: amount,
        paymentMethod: 'wallet'
      });

      const result = await response.json();
      
      if (result.success) {
        // Store transaction result for success page
        sessionStorage.setItem('paymentResult', JSON.stringify({
          transaction: result.transaction,
          route: scanResult.route,
          operator: scanResult.operator
        }));
        
        toast({
          title: "Payment Successful!",
          description: `Your ${scanResult.route.name} fare has been paid.`,
        });
        
        setLocation('/payment-success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Confirm Payment" showBack backTo="/qr-scanner" />
      
      <div className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
        {/* Merchant Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-paypass-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bus className="text-paypass-blue h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{scanResult.route.name}</h2>
            <p className="text-gray-600">{scanResult.route.description}</p>
          </div>
          
          {/* Payment Amount */}
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-paypass-blue">
              {selectedCurrency === 'USD' ? '$' : 'ZWL '}
              {selectedCurrency === 'USD' ? scanResult.route.fareUsd : scanResult.route.fareZwl}
            </p>
            <p className="text-gray-600 text-sm">Single Journey</p>
          </div>
        </div>
        
        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Pay with</h3>
          <RadioGroup value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <div className="space-y-2">
              <div className={`flex items-center p-4 bg-white rounded-lg border-2 shadow-sm ${selectedCurrency === 'USD' ? 'border-paypass-blue' : 'border-gray-200'}`}>
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd" className="ml-3 flex-1 cursor-pointer">
                  <p className="font-medium text-gray-900">USD Balance</p>
                  <p className={`text-sm ${hasSufficientBalance && selectedCurrency === 'USD' ? 'text-gray-600' : 'text-red-500'}`}>
                    Available: ${wallet?.usdBalance || '0.00'}
                  </p>
                </Label>
              </div>
              
              <div className={`flex items-center p-4 bg-white rounded-lg border-2 shadow-sm ${selectedCurrency === 'ZWL' ? 'border-paypass-blue' : 'border-gray-200'}`}>
                <RadioGroupItem value="ZWL" id="zwl" />
                <Label htmlFor="zwl" className="ml-3 flex-1 cursor-pointer">
                  <p className="font-medium text-gray-900">ZWL Balance</p>
                  <p className={`text-sm ${hasSufficientBalance && selectedCurrency === 'ZWL' ? 'text-gray-600' : 'text-red-500'}`}>
                    Available: ZWL {wallet?.zwlBalance || '0.00'}
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {/* Security Notice */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <Shield className="text-paypass-blue mt-0.5 mr-3 h-5 w-5" />
            <div>
              <p className="text-sm font-medium text-paypass-blue">Secure Payment</p>
              <p className="text-sm text-gray-700">This payment is protected by PayPass security</p>
            </div>
          </div>
        </div>

        {/* Low Balance Warning */}
        {!hasSufficientBalance && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-200">
            <p className="text-sm font-medium text-red-800">Insufficient Balance</p>
            <p className="text-sm text-red-700">You need to top up your {selectedCurrency} wallet to make this payment.</p>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="px-6 pb-6 bg-white">
        <Button 
          onClick={handlePayment}
          disabled={isProcessing || !hasSufficientBalance}
          className="w-full bg-paypass-blue text-white py-4 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 mb-3"
        >
          <div className="flex items-center justify-center">
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-5 w-5" />
                Pay {selectedCurrency === 'USD' ? '$' : 'ZWL '}
                {selectedCurrency === 'USD' ? scanResult.route.fareUsd : scanResult.route.fareZwl}
              </>
            )}
          </div>
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => setLocation('/qr-scanner')}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium"
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
