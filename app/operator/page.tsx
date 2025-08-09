"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, TrendingUp, Bus, LogOut, Plus } from 'lucide-react';
import { useAuth } from "@/components/auth-provider";

const loginSchema = z.object({
  phone: z.string().min(9),
  pin: z.string().min(4),
});
type OperatorLogin = z.infer<typeof loginSchema>;

export default function OperatorPage() {
  const { operator, loginOperator, logout, token } = useAuth();

  if (!operator) {
    return <OperatorLoginForm onSubmit={loginOperator} />;
  }

  return <OperatorDashboard onLogout={logout} token={token!} />;
}

function OperatorLoginForm({
  onSubmit,
}: {
  onSubmit: (phone: string, pin: string) => Promise<void>;
}) {
  const form = useForm<OperatorLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", pin: "" },
  });

  const handleSubmit = async (values: OperatorLogin) => {
    await onSubmit(values.phone, values.pin);
  };

  return (
    <main className="min-h-svh bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white pt-16 pb-8">
        <div className="max-w-md mx-auto px-6 text-center">
          <QrCode className="h-12 w-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">PayPass</h1>
          <p className="text-emerald-100">Operator Portal</p>
        </div>
      </div>
      <div className="max-w-md mx-auto px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Operator Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div>
                <Label>Phone</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    +263
                  </span>
                  <Input
                    placeholder="771234567"
                    {...form.register("phone")}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <Label>PIN</Label>
                <Input type="password" {...form.register("pin")} />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function OperatorDashboard({
  onLogout,
  token,
}: {
  onLogout: () => void;
  token: string;
}) {
  const routesQuery = useQuery({
    queryKey: ["operator-routes"],
    queryFn: () => apiGet("/api/operator/routes", token),
  });

  const txQuery = useQuery({
    queryKey: ["operator-transactions"],
    queryFn: () => apiGet("/api/operator/transactions", token),
  });

  const today = new Date().toDateString();
  const todays = Array.isArray(txQuery.data)
    ? txQuery.data.filter((tx: any) => new Date(tx.createdAt).toDateString() === today)
    : [];
  const todaysRevenue = todays
    .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0)
    .toFixed(2);

  return (
    <div className="flex flex-col min-h-svh">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 pt-12 pb-6 px-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold">Operator Dashboard</h1>
            <p className="text-emerald-100 text-sm">Real-time insights</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-emerald-100 text-sm">Today's Revenue</p>
            <p className="text-2xl font-bold">${todaysRevenue}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-emerald-100 text-sm">Total Trips</p>
            <p className="text-2xl font-bold">{todays.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 bg-gray-50 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Active Routes</h2>
          {routesQuery.isLoading ? (
            <div className="grid gap-3">
              <div className="h-20 bg-white rounded-xl shadow-sm border" />
              <div className="h-20 bg-white rounded-xl shadow-sm border" />
            </div>
          ) : Array.isArray(routesQuery.data) && routesQuery.data.length > 0 ? (
            <div className="space-y-3">
              {routesQuery.data.map((route: any) => {
                const rTx = todays.filter((tx: any) => tx.routeId === route.id);
                const rRevenue = rTx
                  .reduce((s: number, tx: any) => s + parseFloat(tx.amount), 0)
                  .toFixed(2);
                return (
                  <Card key={route.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {route.name}
                        </h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {route.description}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Today's Revenue</p>
                          <p className="font-semibold">${rRevenue}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Trips</p>
                          <p className="font-semibold">{rTx.length}</p>
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
                <p className="text-gray-500 text-sm mb-4">
                  Create your first route to start accepting payments
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Route
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
          {Array.isArray(txQuery.data) && txQuery.data.length > 0 ? (
            <div className="space-y-3">
              {txQuery.data.slice(0, 5).map((tx: any) => {
                const minutes = Math.floor(
                  (Date.now() - new Date(tx.createdAt).getTime()) / 60000
                );
                return (
                  <Card key={tx.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {tx.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {minutes < 1 ? "Just now" : `${minutes} minutes ago`}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-600">
                        +${tx.amount}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No payments yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Payments will appear here once customers start using your
                  routes
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
