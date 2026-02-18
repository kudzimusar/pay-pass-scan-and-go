import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Link, useLocation } from "wouter";
import { Store, LogIn } from "lucide-react";

const merchantLoginSchema = z.object({
  phone: z.string().min(9, "Phone number must be at least 9 digits").max(13, "Phone number is too long"),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
});

type MerchantLoginForm = z.infer<typeof merchantLoginSchema>;

async function loginMerchant(phone: string, pin: string) {
  const response = await fetch("/api/auth/merchant/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, pin }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

export default function MerchantLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<MerchantLoginForm>({
    resolver: zodResolver(merchantLoginSchema),
    defaultValues: {
      phone: "",
      pin: "",
    },
  });

  async function onSubmit(values: MerchantLoginForm) {
    setIsLoading(true);
    try {
      // Format phone number for Zimbabwe
      let phone = values.phone.replace(/\D/g, ''); // Remove all non-digits
      
      // Handle different input formats
      if (phone.startsWith('263')) {
        // Already has country code
        phone = '+' + phone;
      } else if (phone.startsWith('0')) {
        // Local format starting with 0 (e.g., 0772160634)
        phone = '+263' + phone.substring(1);
      } else if (phone.length === 9) {
        // Local format without leading 0 (e.g., 772160634)
        phone = '+263' + phone;
      } else {
        // Default: assume it needs country code
        phone = '+263' + phone;
      }

      const response = await loginMerchant(phone, values.pin);
      login(response, 'merchant');
      
      toast({
        title: "Login successful",
        description: "Welcome to your merchant dashboard",
      });

      // Redirect to merchant dashboard
      setLocation("/merchant");
    } catch (error) {
      console.error("Merchant login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">PayPass Business</CardTitle>
          <CardDescription>
            Sign in to your merchant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 711111111 or +263711111111"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your PIN" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="link" className="text-sm">
                Regular user? Sign in here
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}