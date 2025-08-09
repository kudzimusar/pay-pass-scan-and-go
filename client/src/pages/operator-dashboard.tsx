import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { loginOperator } from "@/lib/auth";
import { useAuth } from "@/context/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/bottom-navigation";
import { 
  QrCode,
  TrendingUp,
  Bus,
  Settings,
  LogOut,
  BarChart3,
  Plus
} from "lucide-react";

const operatorLoginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
});

type OperatorLoginForm = z.infer<typeof operatorLoginSchema>;

function OperatorLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<OperatorLoginForm>({
    resolver: zodResolver(operatorLoginSchema),
    defaultValues: {
      phone: "",
      pin: "",
    },
  });

  async function onSubmit(values: OperatorLoginForm) {
    setIsLoading(true);
    try {
      // Format phone number
      let phone = values.phone.replace(/\D/g, '');
      if (!phone.startsWith('263')) {
        phone = '263' + phone;
      }
      phone = '+' + phone;

      const response = await loginOperator(phone, values.pin);
      login(response, 'operator');
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      
      setLocation("/operator");
    } catch (error) {
      console.error("Operator login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gradient-paypass pt-16 pb-8 px-6 text-center text-white">
        <QrCode className="h-12 w-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">PayPass</h1>
        <p className="text-blue-100 text-sm">Operator Portal</p>
      </div>
      
      {/* Login Form */}
      <div className="flex-1 px-6 py-8 bg-gray-50">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Operator Login</h2>
            <p className="text-gray-600 text-sm">Access your operator dashboard</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your PIN"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-paypass-blue hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="text-center pt-4">
            <p className="text-gray-600 text-sm">New operator?</p>
            <Button variant="ghost" className="text-paypass-blue font-medium text-sm">
              Register Company
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">Customer?</p>
            <Link href="/" className="text-paypass-green font-medium text-sm">
              Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperatorDashboardContent() {
  const { operator, token, logout } = useAuth();
  const { toast } = useToast();

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['/api/operator/routes'],
    enabled: !!token,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/operator/transactions'],
    enabled: !!token,
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  // Calculate today's revenue and trip count
  const todaysTransactions = transactions?.filter((tx: any) => {
    const txDate = new Date(tx.createdAt).toDateString();
    const today = new Date().toDateString();
    return txDate === today;
  }) || [];

  const todaysRevenue = todaysTransactions.reduce((sum: number, tx: any) => 
    sum + parseFloat(tx.amount), 0
  ).toFixed(2);

  const totalTrips = todaysTransactions.length;

  const recentTransactions = transactions?.slice(0, 5) || [];

  if (routesLoading || transactionsLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-gradient-paypass pt-12 pb-6 px-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-6 w-40 bg-white/20 mb-2" />
              <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
            <Skeleton className="h-8 w-8 rounded bg-white/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-xl bg-white/20" />
            <Skeleton className="h-20 rounded-xl bg-white/20" />
          </div>
        </div>
        <div className="flex-1 px-6 py-6">
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gradient-paypass pt-12 pb-6 px-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold">{operator?.companyName || "Transport Company"}</h1>
            <p className="text-blue-100 text-sm">Operator Dashboard</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm">Today's Revenue</p>
            <p className="text-2xl font-bold">${todaysRevenue}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm">Total Trips</p>
            <p className="text-2xl font-bold">{totalTrips}</p>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
        {/* Active Routes */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Routes</h2>
          {routes?.length > 0 ? (
            <div className="space-y-3">
              {routes.map((route: any) => {
                const routeTransactions = todaysTransactions.filter((tx: any) => tx.routeId === route.id);
                const routeRevenue = routeTransactions.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);
                
                return (
                  <Card key={route.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{route.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Today's Revenue</p>
                          <p className="font-semibold">${routeRevenue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Trips</p>
                          <p className="font-semibold">{routeTransactions.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fare</p>
                          <p className="font-semibold">${route.fareUsd}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No routes yet</h3>
                <p className="text-gray-500 text-sm mb-4">Create your first bus route to start accepting payments</p>
                <Button className="bg-paypass-blue hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Route
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md h-auto">
              <div className="text-center w-full">
                <QrCode className="text-paypass-blue h-6 w-6 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">Manage QR Codes</h3>
              </div>
            </Button>
            
            <Button variant="outline" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md h-auto">
              <div className="text-center w-full">
                <BarChart3 className="text-paypass-green h-6 w-6 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">View Reports</h3>
              </div>
            </Button>
            
            <Button variant="outline" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md h-auto">
              <div className="text-center w-full">
                <Bus className="text-orange-500 h-6 w-6 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">Fleet Status</h3>
              </div>
            </Button>
            
            <Button variant="outline" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md h-auto">
              <div className="text-center w-full">
                <Settings className="text-gray-500 h-6 w-6 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">Settings</h3>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Recent Payments */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction: any) => {
                const route = routes?.find((r: any) => r.id === transaction.routeId);
                const timeAgo = Math.floor((new Date().getTime() - new Date(transaction.createdAt).getTime()) / 60000);
                
                return (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{route?.name || 'Unknown Route'}</p>
                          <p className="text-sm text-gray-500">
                            {timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}
                          </p>
                        </div>
                        <p className="font-semibold text-paypass-green">
                          +${transaction.amount}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No payments yet</h3>
                <p className="text-gray-500 text-sm">Payments will appear here once customers start using your routes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <BottomNavigation userType="operator" />
    </div>
  );
}

export default function OperatorDashboard() {
  const { operator, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <QrCode className="h-12 w-12 text-paypass-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!operator) {
    return <OperatorLogin />;
  }

  return <OperatorDashboardContent />;
}
