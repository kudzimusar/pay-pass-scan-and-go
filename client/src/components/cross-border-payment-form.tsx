import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Globe, 
  ShieldCheck, 
  Bus,
  GraduationCap,
  HeartPulse,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface Recipient {
  id: string;
  name: string;
  type: "individual" | "organization";
  location: string;
  monthlyLimit: number;
  spentThisMonth: number;
}

interface CrossBorderPaymentFormProps {
  recipient: Recipient;
}

const ORG_CATEGORIES = [
  { id: "transport", label: "Transport", icon: Bus, color: "bg-blue-500" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "bg-yellow-500" },
  { id: "education", label: "Education", icon: GraduationCap, color: "bg-purple-500" },
  { id: "health", label: "Health", icon: HeartPulse, color: "bg-red-500" },
];

export function CrossBorderPaymentForm({ recipient }: CrossBorderPaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const exchangeRate = 25.42; // Mock rate USD to ZWL
  const zwlAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : "0.00";
  const fee = amount ? (parseFloat(amount) * 0.03).toFixed(2) : "0.00";
  const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : "0.00";

  const handlePayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (recipient.type === "organization" && !category) {
      toast.error("Please select a payment category");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Payment of $${amount} sent to ${recipient.name} successfully!`);
    }, 2000);
  };

  return (
    <div className="bg-white min-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="p-6 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl ${
            recipient.type === "organization" ? "bg-slate-800" : "bg-primary"
          }`}>
            {recipient.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{recipient.name}</h2>
            <p className="text-sm text-slate-500">{recipient.location}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-3 flex items-center justify-between border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm font-bold">Verified Recipient</span>
          </div>
          <Badge variant="outline" className="rounded-lg bg-slate-50 border-none text-slate-500">
            Limit: ${recipient.monthlyLimit}
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Amount Input */}
        <div className="space-y-3">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
            <Input 
              type="number" 
              placeholder="0.00" 
              className="h-20 pl-10 text-4xl font-black rounded-[1.5rem] bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <p className="text-sm font-medium text-slate-500">≈ {zwlAmount} ZWL</p>
            <p className="text-xs text-slate-400">Rate: 1 USD = {exchangeRate} ZWL</p>
          </div>
        </div>

        {/* Organization Specifics */}
        {recipient.type === "organization" && (
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Category</Label>
            <div className="grid grid-cols-2 gap-3">
              {ORG_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                    category === cat.id 
                      ? "border-primary bg-primary/5" 
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className={`${cat.color} p-2 rounded-xl text-white`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">{cat.label}</span>
                </button>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Reference / Account Number</Label>
              <Input 
                placeholder="Enter reference number" 
                className="h-14 rounded-2xl bg-slate-50 border-none"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Summary Card */}
        <Card className="rounded-[2rem] border-none bg-slate-900 text-white overflow-hidden">
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between text-sm opacity-70">
              <span>Service Fee (3%)</span>
              <span>${fee}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total to Pay</span>
              <span>${total}</span>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[10px] opacity-50 uppercase tracking-widest font-bold">
              <Globe className="w-3 h-3" />
              Instant Settlement in Zimbabwe
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        <Button 
          className="w-full h-16 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Confirm Payment"}
          {!isProcessing && <ArrowRight className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
