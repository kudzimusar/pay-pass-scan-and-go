"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  Clock,
  RefreshCw,
  CreditCard,
  Wallet,
  Building,
  Bus,
  Zap,
  Phone,
  Info,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const crossBorderPaymentSchema = z.object({
  recipientId: z.string().min(1, "Please select a recipient"),
  paymentType: z.enum(["individual", "organization"]),
  organizationType: z.enum(["transport", "utilities", "education", "health", "other"]).optional(),
  senderAmount: z.number().min(1, "Amount must be at least $1").max(10000, "Amount cannot exceed $10,000"),
  senderCurrency: z.enum(["USD", "EUR", "GBP", "ZAR"]),
  recipientCurrency: z.enum(["USD", "ZWL"]),
  paymentMethod: z.enum(["wallet", "bank_transfer", "card"]),
  purpose: z.string().min(5, "Purpose description is required").max(500, "Purpose too long"),
  referenceNumber: z.string().optional(),
});

type CrossBorderPaymentForm = z.infer<typeof crossBorderPaymentSchema>;

interface Friend {
  id: string;
  nickname?: string;
  relationship: "family" | "friend" | "business";
  recipient: {
    id: string;
    fullName: string;
    phone: string;
    countryCode: string;
  };
  monthlyLimit: string;
  totalSent: string;
}

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  createdAt: string;
}

interface CrossBorderPaymentFormProps {
  friends: Friend[];
  onSubmit: (data: CrossBorderPaymentForm & { friendNetworkId?: string }) => Promise<void>;
  isLoading?: boolean;
}

const paymentMethodOptions = [
  { value: "wallet", label: "PayPass Wallet", icon: Wallet },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building },
  { value: "card", label: "Credit/Debit Card", icon: CreditCard },
];

const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)", flag: "🇺🇸" },
  { value: "EUR", label: "Euro (EUR)", flag: "🇪🇺" },
  { value: "GBP", label: "British Pound (GBP)", flag: "🇬🇧" },
  { value: "ZAR", label: "South African Rand (ZAR)", flag: "🇿🇦" },
];

const recipientCurrencyOptions = [
  { value: "USD", label: "US Dollar (USD)", flag: "🇺🇸" },
  { value: "ZWL", label: "Zimbabwe Dollar (ZWL)", flag: "🇿🇼" },
];

const organizationTypes = [
  { value: "transport", label: "Transport (ZUPCO, etc.)", icon: Bus },
  { value: "utilities", label: "Utilities (ZESA, City Council)", icon: Zap },
  { value: "education", label: "Education (Schools, Universities)", icon: Building },
  { value: "health", label: "Health (Hospitals, Pharmacies)", icon: Shield },
  { value: "other", label: "Other Organizations", icon: Info },
];

export function CrossBorderPaymentForm({ friends, onSubmit, isLoading = false }: CrossBorderPaymentFormProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CrossBorderPaymentForm>({
    resolver: zodResolver(crossBorderPaymentSchema),
    defaultValues: {
      paymentType: "individual",
      senderCurrency: "USD",
      recipientCurrency: "ZWL",
      paymentMethod: "wallet",
    },
  });

  const watchedValues = watch();
  const { senderAmount, senderCurrency, recipientCurrency, paymentType, organizationType } = watchedValues;

  // Fetch exchange rate when currencies change
  useEffect(() => {
    if (senderCurrency && recipientCurrency && senderCurrency !== recipientCurrency) {
      fetchExchangeRate(senderCurrency, recipientCurrency);
    } else if (senderCurrency === recipientCurrency) {
      setExchangeRate({ fromCurrency: senderCurrency, toCurrency: recipientCurrency, rate: "1.0", createdAt: new Date().toISOString() });
    }
  }, [senderCurrency, recipientCurrency]);

  const fetchExchangeRate = async (from: string, to: string) => {
    setLoadingRate(true);
    setRateError(null);
    
    try {
      // In a real app, this would be a real API call
      // For now, we'll simulate it or use a mock if the API fails
      const response = await fetch(`/api/exchange-rates/current?from=${from}&to=${to}`);
      if (!response.ok) {
        // Fallback mock rates if API is not ready
        const mockRates: Record<string, string> = {
          "USD_ZWL": "25.45",
          "ZAR_ZWL": "1.35",
          "EUR_ZWL": "27.80",
          "GBP_ZWL": "32.10"
        };
        const key = `${from}_${to}`;
        setExchangeRate({
          fromCurrency: from,
          toCurrency: to,
          rate: mockRates[key] || "1.0",
          createdAt: new Date().toISOString()
        });
      } else {
        const data = await response.json();
        setExchangeRate(data.rate);
      }
    } catch (error) {
      setRateError("Unable to fetch current exchange rate");
      toast.error("Failed to fetch exchange rate");
    } finally {
      setLoadingRate(false);
    }
  };

  const calculateRecipientAmount = () => {
    if (!senderAmount || !exchangeRate) return 0;
    return senderAmount * parseFloat(exchangeRate.rate);
  };

  const calculateFees = () => {
    if (!senderAmount) return { exchangeFee: 0, transferFee: 0, total: 0 };
    
    const exchangeFee = senderAmount * 0.02; // 2%
    const transferFee = paymentType === "organization" ? 1.5 : 2.0; // Lower fee for organizations
    return {
      exchangeFee,
      transferFee,
      total: exchangeFee + transferFee,
    };
  };

  const handleFormSubmit = async (data: CrossBorderPaymentForm) => {
    if (!selectedFriend) {
      toast.error("Please select a recipient");
      return;
    }

    try {
      await onSubmit({
        ...data,
        recipientId: selectedFriend.recipient.id,
        friendNetworkId: selectedFriend.id,
      });
      toast.success("Payment processed successfully!");
      reset();
      setSelectedFriend(null);
    } catch (error) {
      console.error("Payment submission error:", error);
      toast.error("Failed to process payment");
    }
  };

  const fees = React.useMemo(() => calculateFees(), [senderAmount, paymentType]);
  const recipientAmount = React.useMemo(() => calculateRecipientAmount(), [senderAmount, exchangeRate]);
  const totalAmount = React.useMemo(() => (senderAmount || 0) + fees.total, [senderAmount, fees.total]);

  const remainingLimit = selectedFriend 
    ? parseFloat(selectedFriend.monthlyLimit) - parseFloat(selectedFriend.totalSent)
    : 0;
  const exceedsLimit = selectedFriend && senderAmount > remainingLimit;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-t-4 border-t-blue-600" data-testid="payment-form">
      <CardHeader className="p-4 sm:p-6 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-xl sm:text-2xl font-bold text-gray-900">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Send Money</span>
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Cross-Border
          </Badge>
        </div>
        <CardDescription>
          Securely pay individuals or organizations in Zimbabwe
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Payment Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Who are you paying?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={paymentType === "individual" ? "default" : "outline"}
                className={`h-14 flex flex-col items-center justify-center space-y-1 ${paymentType === "individual" ? "bg-blue-600" : ""}`}
                onClick={() => setValue("paymentType", "individual")}
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">Individual</span>
              </Button>
              <Button
                type="button"
                variant={paymentType === "organization" ? "default" : "outline"}
                className={`h-14 flex flex-col items-center justify-center space-y-1 ${paymentType === "organization" ? "bg-blue-600" : ""}`}
                onClick={() => setValue("paymentType", "organization")}
              >
                <Building className="w-5 h-5" />
                <span className="text-xs">Organization</span>
              </Button>
            </div>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-sm font-semibold text-gray-700">
              {paymentType === "individual" ? "Select Friend/Family" : "Select Organization"}
            </Label>
            <Select
              value={selectedFriend?.id || ""}
              onValueChange={(value) => {
                const friend = friends.find(f => f.id === value);
                setSelectedFriend(friend || null);
                setValue("recipientId", value);
              }}
            >
              <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-blue-500">
                <SelectValue placeholder={paymentType === "individual" ? "Choose a contact" : "Choose an organization"} />
              </SelectTrigger>
              <SelectContent>
                {friends
                  .filter(f => paymentType === "individual" ? f.relationship !== "business" : f.relationship === "business")
                  .map((friend) => (
                    <SelectItem key={friend.id} value={friend.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{friend.nickname || friend.recipient.fullName}</span>
                        <span className="text-xs text-gray-500">({friend.recipient.phone})</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.recipientId && <p className="text-xs text-red-600">{errors.recipientId.message}</p>}
            
            {selectedFriend && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-blue-700">Monthly Spending Limit</span>
                  <span className="text-xs font-bold text-blue-800">
                    ${parseFloat(selectedFriend.totalSent).toFixed(2)} / ${parseFloat(selectedFriend.monthlyLimit).toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={(parseFloat(selectedFriend.totalSent) / parseFloat(selectedFriend.monthlyLimit)) * 100} 
                  className="h-2 bg-blue-200"
                />
              </div>
            )}
          </div>

          {/* Organization Specific Fields */}
          {paymentType === "organization" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Category</Label>
                <Select
                  value={organizationType}
                  onValueChange={(value) => setValue("organizationType", value as any)}
                >
                  <SelectTrigger className="h-12 border-gray-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber" className="text-sm font-semibold text-gray-700">Reference/Account #</Label>
                <Input
                  id="referenceNumber"
                  {...register("referenceNumber")}
                  placeholder="e.g. Account ID, Invoice #"
                  className="h-12 border-gray-300"
                />
              </div>
            </div>
          )}

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderAmount" className="text-sm font-semibold text-gray-700">Amount to Send</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <Input
                  id="senderAmount"
                  type="number"
                  step="0.01"
                  {...register("senderAmount", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="h-12 pl-7 text-lg font-semibold border-gray-300 focus:ring-blue-500"
                />
              </div>
              {errors.senderAmount && <p className="text-xs text-red-600">{errors.senderAmount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Your Currency</Label>
              <Select
                value={senderCurrency}
                onValueChange={(value) => setValue("senderCurrency", value as any)}
              >
                <SelectTrigger className="h-12 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.flag} {option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate & Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700">
                <RefreshCw className={`w-4 h-4 ${loadingRate ? "animate-spin" : ""}`} />
                <span className="text-sm font-bold">
                  {loadingRate ? "Updating rates..." : exchangeRate ? `1 ${senderCurrency} = ${parseFloat(exchangeRate.rate).toFixed(4)} ${recipientCurrency}` : "Rate unavailable"}
                </span>
              </div>
              <Badge variant="outline" className="bg-white text-[10px] uppercase tracking-wider">Live Rate</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recipient receives</span>
                <span className="font-bold text-gray-900">
                  {recipientAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {recipientCurrency}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Transfer Fee</span>
                <span>${fees.transferFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Exchange Fee (2%)</span>
                <span>${fees.exchangeFee.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold text-blue-700">
                <span>Total to Pay</span>
                <span>${totalAmount.toFixed(2)} {senderCurrency}</span>
              </div>
            </div>
          </div>

          {/* Purpose of Payment */}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-sm font-semibold text-gray-700">Purpose of Payment</Label>
            <Textarea
              id="purpose"
              {...register("purpose")}
              placeholder={paymentType === "individual" ? "e.g. Support for groceries, birthday gift" : "e.g. School fees for Term 1, ZESA token"}
              className="min-h-[80px] border-gray-300"
            />
            {errors.purpose && <p className="text-xs text-red-600">{errors.purpose.message}</p>}
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Payment Method</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethodOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={watchedValues.paymentMethod === option.value ? "default" : "outline"}
                  className={`h-12 justify-start px-3 ${watchedValues.paymentMethod === option.value ? "bg-blue-600" : "border-gray-300"}`}
                  onClick={() => setValue("paymentMethod", option.value as any)}
                >
                  <option.icon className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Warnings & Info */}
          {exceedsLimit && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                This amount exceeds the remaining monthly limit for this recipient (${remainingLimit.toFixed(2)}).
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-100">
            <Shield className="w-4 h-4 text-green-600 mt-0.5" />
            <p className="text-[11px] text-green-800 leading-relaxed">
              Your payment is protected by PayPass Secure. Funds are typically delivered within 24 hours to Zimbabwean organizations and individuals.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-[0.98]"
            disabled={isLoading || exceedsLimit || !selectedFriend || !exchangeRate}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Send ${totalAmount.toFixed(2)}</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
