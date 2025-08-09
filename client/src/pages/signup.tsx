import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { registerUser } from "@/lib/auth";
import MobileHeader from "@/components/mobile-header";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number must be at least 9 digits").max(13, "Phone number is too long"),
  email: z.string().email("Invalid email address"),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
  confirmPin: z.string().min(4, "Please confirm your PIN"),
  biometricEnabled: z.boolean().default(false),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      pin: "",
      confirmPin: "",
      biometricEnabled: false,
      agreeToTerms: false,
    },
  });

  async function onSubmit(values: SignupForm) {
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

      const response = await registerUser({
        fullName: values.fullName,
        phone,
        email: values.email,
        pin: values.pin,
        biometricEnabled: values.biometricEnabled,
      });

      login(response, 'user');
      
      toast({
        title: "Account created successfully!",
        description: "Welcome to PayPass. Your account is ready to use.",
      });
      
      setLocation("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader
        title="Create Account"
        showBack
        backTo="/"
        subtitle="Join thousands using PayPass"
      />
      
      <div className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Phone Number</FormLabel>
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
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
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
                  <FormLabel className="text-sm font-medium text-gray-700">Create PIN</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter 4-digit PIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Confirm PIN</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm PIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-paypass-blue mb-2">Biometric Authentication</h3>
              <p className="text-sm text-gray-600 mb-3">Enable fingerprint or face recognition for faster and secure access.</p>
              <FormField
                control={form.control}
                name="biometricEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-gray-700">
                      Enable biometric authentication
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-gray-700">
                    I agree to the{" "}
                    <span className="text-paypass-blue font-medium">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-paypass-blue font-medium">Privacy Policy</span>
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-paypass-blue hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
