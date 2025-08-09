import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Share, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = sessionStorage.getItem('paymentResult');
    if (stored) {
      setPaymentResult(JSON.parse(stored));
    } else {
      // Fallback mock data
      setPaymentResult({
        transaction: {
          id: 'PP2024001234',
          amount: '1.50',
          currency: 'USD',
          createdAt: new Date(),
        },
        route: {
          name: 'City Bus Route 2A'
        },
        operator: {
          companyName: 'City Transport Co.'
        }
      });
    }
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'PayPass Receipt',
        text: `Payment successful for ${paymentResult?.route?.name}`,
        url: window.location.href,
      });
    } else {
      toast({
        title: "Receipt copied",
        description: "Payment details have been copied to your clipboard.",
      });
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!paymentResult) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Success Animation */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle className="text-green-600 h-12 w-12" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Payment Successful!</h1>
        <p className="text-gray-600 text-center mb-8">Your bus fare has been paid</p>
        
        {/* Receipt */}
        <div className="w-full bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-gray-900">Receipt</h2>
            <p className="text-sm text-gray-600">Transaction #{paymentResult.transaction.id}</p>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Merchant</span>
              <span className="font-medium">{paymentResult.route.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">
                {paymentResult.transaction.currency === 'USD' ? '$' : 'ZWL '}
                {paymentResult.transaction.amount}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium">{formatDateTime(paymentResult.transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">{paymentResult.transaction.currency} Balance</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-paypass-green">Completed</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <Button 
            onClick={() => setLocation('/dashboard')}
            className="w-full bg-paypass-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleShare}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
          >
            <Share className="mr-2 h-4 w-4" />
            Share Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
