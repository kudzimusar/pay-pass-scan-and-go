import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Building2, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  // Mock admin data for demonstration
  const stats = {
    totalUsers: 15420,
    totalOperators: 89,
    dailyTransactions: 2847,
    totalRevenue: 45230.50,
    dailyRevenue: 1250.30,
    systemHealth: "Good"
  };

  const recentAlerts = [
    { id: 1, type: "warning", message: "High transaction volume detected on Chitungwiza route", time: "2 mins ago" },
    { id: 2, type: "info", message: "New operator registration: Metro Peach Bus Service", time: "15 mins ago" },
    { id: 3, type: "error", message: "Failed payment attempt from mobile money integration", time: "1 hour ago" },
  ];

  const topOperators = [
    { name: "City Bus Lines", transactions: 234, revenue: 890.50 },
    { name: "ZUPCO Transport", transactions: 189, revenue: 2250.00 },
    { name: "Harare Kombis", transactions: 445, revenue: 334.80 },
    { name: "Metro Peach", transactions: 156, revenue: 468.90 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PayPass Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Platform monitoring and administration</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operators</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOperators}</div>
              <p className="text-xs text-muted-foreground">+3 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+8% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.dailyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total: ${stats.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'default' : 'secondary'}>
                      {alert.type}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Operators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Operators (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topOperators.map((operator, index) => (
                  <div key={operator.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{operator.name}</p>
                        <p className="text-xs text-muted-foreground">{operator.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${operator.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Manage Users</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-sm">Approve Operators</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Financial Reports</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Fraud Detection</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
          <h3 className="font-semibold mb-2">Demo Environment</h3>
          <p className="text-sm text-muted-foreground">
            This is a demonstration admin dashboard. In production, this would be protected by admin authentication 
            and would display real-time data from the PayPass platform monitoring systems.
          </p>
        </div>
      </div>
    </div>
  );
}
