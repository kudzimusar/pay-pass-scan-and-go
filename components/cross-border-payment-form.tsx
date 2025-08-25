"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Building
} from "lucide-react";
import { toast } from "sonner";

const crossBorderPaymentSchema = z.object({
  recipientId: z.string().min(1, "Please select a recipient"),
  senderAmount: z.number().min(1, "Amount must be at least $1").max(10000, "Amount cannot exceed $10,000"),
  senderCurrency: z.enum(["USD", "EUR", "GBP", "ZAR"]),
  recipientCurrency: z.enum(["USD", "ZWL"]),
  paymentMethod: z.enum(["wallet", "bank_transfer", "card"]),
  purpose: z.string().min(5, "Purpose description is required").max(500, "Purpose too long"),
});

type CrossBorderPaymentForm = z.infer<typeof crossBorderPaymentSchema>;

interface Friend {
  id: string;
  nickname?: string;
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
      senderCurrency: "USD",
      recipientCurrency: "ZWL",
      paymentMethod: "wallet",
    },
  });

  const watchedValues = watch();
  const { senderAmount, senderCurrency, recipientCurrency } = watchedValues;

  // Fetch exchange rate when currencies change
  useEffect(() => {
    if (senderCurrency && recipientCurrency && senderCurrency !== recipientCurrency) {
      fetchExchangeRate(senderCurrency, recipientCurrency);
    }
  }, [senderCurrency, recipientCurrency]);

  const fetchExchangeRate = async (from: string, to: string) => {
    setLoadingRate(true);
    setRateError(null);
    
    try {
      const response = await fetch(`/api/exchange-rates/current?from=${from}&to=${to}`);
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      
      const data = await response.json();
      setExchangeRate(data.rate);
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
    const transferFee = 2.0; // $2 flat fee
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
      reset();
      setSelectedFriend(null);
    } catch (error) {
      console.error("Payment submission error:", error);
    }
  };

  const fees = calculateFees();
  const recipientAmount = calculateRecipientAmount();
  const totalAmount = senderAmount + fees.total;

  // Check if selected friend has enough monthly limit
  const remainingLimit = selectedFriend 
    ? parseFloat(selectedFriend.monthlyLimit) - parseFloat(selectedFriend.totalSent)
    : 0;
  const exceedsLimit = selectedFriend && senderAmount > remainingLimit;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <span>Send Money to Friend</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Select Recipient</Label>
            <Select
              value={selectedFriend?.id || ""}
              onValueChange={(value) => {
                const friend = friends.find(f => f.id === value);
                setSelectedFriend(friend || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a friend or family member" />
              </SelectTrigger>
              <SelectContent>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    <div className="flex items-center space-x-2">
                      <span>{friend.nickname || friend.recipient.fullName}</span>
                      <Badge variant="outline" className="text-xs">
                        {friend.recipient.phone}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFriend && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Limit</span>
                  <span className="font-medium">
                    ${parseFloat(selectedFriend.totalSent).toFixed(2)} / ${parseFloat(selectedFriend.monthlyLimit).toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={(parseFloat(selectedFriend.totalSent) / parseFloat(selectedFriend.monthlyLimit)) * 100} 
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderAmount">Amount to Send</Label>
              <Input
                id="senderAmount"
                type="number"
                step="0.01"
                min="1"
                max="10000"
                {...register("senderAmount", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.senderAmount && (
                <p className="text-sm text-red-600">{errors.senderAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderCurrency">Your Currency</Label>
              <Select
                value={watchedValues.senderCurrency}
                onValueChange={(value) => setValue("senderCurrency", value as any)}
              >
                <SelectTrigger>
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

          {/* Exchange Rate Display */}
          {exchangeRate && !loadingRate && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    1 {senderCurrency} = {parseFloat(exchangeRate.rate).toFixed(6)} {recipientCurrency}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchExchangeRate(senderCurrency, recipientCurrency)}
                  disabled={loadingRate}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRate ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {recipientAmount > 0 && (
                <div className="mt-2 text-lg font-semibold text-blue-700">
                  Recipient receives: {recipientAmount.toFixed(2)} {recipientCurrency}
                </div>
              )}
            </div>
          )}

          {loadingRate && (
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Fetching current exchange rate...</span>
            </div>
          )}

          {rateError && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{rateError}</AlertDescription>
            </Alert>
          )}

          {/* Recipient Currency */}
          <div className="space-y-2">
            <Label htmlFor="recipientCurrency">Recipient Currency</Label>
            <Select
              value={watchedValues.recipientCurrency}
              onValueChange={(value) => setValue("recipientCurrency", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipientCurrencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span>{option.flag} {option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={watchedValues.paymentMethod}
              onValueChange={(value) => setValue("paymentMethod", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <option.icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Payment</Label>
            <Textarea
              id="purpose"
              {...register("purpose")}
              placeholder="e.g., Family support, medical expenses, education fees..."
              rows={3}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600">{errors.purpose.message}</p>
            )}
          </div>

          {/* Fee Breakdown */}
          {senderAmount > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-semibold text-gray-800">Fee Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Amount to send:</span>
                  <span>{senderAmount.toFixed(2)} {senderCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange fee (2%):</span>
                  <span>{fees.exchangeFee.toFixed(2)} {senderCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transfer fee:</span>
                  <span>{fees.transferFee.toFixed(2)} {senderCurrency}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total to deduct:</span>
                  <span>{totalAmount.toFixed(2)} {senderCurrency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {exceedsLimit && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                This payment exceeds the monthly limit for this recipient. 
                Remaining limit: ${remainingLimit.toFixed(2)}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Security Notice:</p>
                <ul className="text-sm space-y-1">
                  <li>• All international payments are subject to fraud detection</li>
                  <li>• Payments over $1,000 require verified identity</li>
                  <li>• Estimated delivery time: 1-3 business days</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading || 
              !selectedFriend || 
              !exchangeRate || 
              exceedsLimit ||
              !senderAmount ||
              senderAmount < 1
            }
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Send {senderAmount > 0 ? `$${totalAmount.toFixed(2)}` : 'Payment'}</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}