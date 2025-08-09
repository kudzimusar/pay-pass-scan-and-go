import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import MobileHeader from "@/components/mobile-header";

const sendMoneySchema = z.object({
  recipient: z.string().min(10, "Phone number must be at least 10 digits"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  currency: z.enum(["USD", "ZWL"]),
  note: z.string().optional(),
});

type SendMoneyForm = z.infer<typeof sendMoneySchema>;

export default function SendMoney() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ['/api/user/wallet'],
    enabled: !!token,
  });

  const form = useForm<SendMoneyForm>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      recipient: "",
      amount: "",
      currency: "USD",
      note: "",
    },
  });

  const selectedCurrency = form.watch("currency");
  const amount = form.watch("amount");

  const balance = selectedCurrency === "USD" 
    ? parseFloat(wallet?.usdBalance || "0")
    : parseFloat(wallet?.zwlBalance || "0");

  const transferAmount = amount ? parseFloat(amount) : 0;
  const fee = 0; // Free transfers for demo
  const totalAmount = transferAmount + fee;

  async function onSubmit(values: SendMoneyForm) {
    setIsLoading(true);
    try {
      // Format phone number
      let phone = values.recipient.replace(/\D/g, '');
      if (!phone.startsWith('263')) {
        phone = '263' + phone;
      }
      phone = '+' + phone;

      // Check balance
      if (totalAmount > balance) {
        toast({
          title: "Insufficient Balance",
          description: `Your ${values.currency} balance is too low for this transfer.`,
          variant: "destructive",
        });
        return;
      }

      // Create transfer transaction
      const response = await apiRequest('POST', '/api/wallet/topup', {
        amount: `-${values.amount}`,
        currency: values.currency,
        method: 'transfer_out'
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Transfer Successful!",
          description: `${values.currency} ${values.amount} sent to ${phone}`,
        });
        
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: "Unable to process transfer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Send Money" showBack />
      
      <div className="flex-1 px-6 py-6 bg-gray-50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient */}
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Send to</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">+263</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="77 123 4567"
                        className="pl-12"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Amount and Currency */}
            <div className="space-y-4">
              <FormLabel className="text-sm font-medium text-gray-700">Amount</FormLabel>
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ZWL">ZWL</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-gray-500">
                Available: {selectedCurrency} {selectedCurrency === "USD" ? wallet?.usdBalance || "0.00" : wallet?.zwlBalance || "0.00"}
              </p>
            </div>
            
            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Note (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="What's this for?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Fee Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Transfer amount</span>
                <span className="font-medium">
                  {selectedCurrency} {transferAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Transfer fee</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                <span className="text-gray-600 font-medium">Total amount</span>
                <span className="font-semibold">
                  {selectedCurrency} {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Balance Warning */}
            {totalAmount > balance && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Insufficient Balance</p>
                <p className="text-sm text-red-700">
                  You need {selectedCurrency} {(totalAmount - balance).toFixed(2)} more to complete this transfer.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-paypass-blue hover:bg-blue-700 py-4 font-semibold text-lg"
              disabled={isLoading || totalAmount > balance || !transferAmount}
            >
              {isLoading ? "Processing..." : "Send Money"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
