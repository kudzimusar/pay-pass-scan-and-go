"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  FileText,
  CreditCard,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Mail,
  Phone,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Import enterprise components
import EnterpriseBillingDashboard from '@/components/enterprise/billing-dashboard';
import BulkPaymentProcessing from '@/components/enterprise/bulk-payments';
import { AccountManagement as EnterpriseAccountManagement } from '@/components/enterprise/account-management';

interface DashboardData {
  summary: {
    totalRevenue: number;
    activeAccounts: number;
    transactionVolume: number;
    monthlyGrowth: number;
  };
  accountMetrics: {
    totalAccounts: number;
    activeAccounts: number;
    pendingAccounts: number;
    suspendedAccounts: number;
    averageAccountValue: number;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    accounts: number;
    transactions: number;
  }>;
  topAccounts: Array<{
    id: string;
    name: string;
    revenue: number;
    growth: number;
    status: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    account?: string;
  }>;
}

export default function EnterpriseDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Mock dashboard data
  const mockDashboardData: DashboardData = {
    summary: {
      totalRevenue: 2456789,
      activeAccounts: 247,
      transactionVolume: 45678900,
      monthlyGrowth: 12.5
    },
    accountMetrics: {
      totalAccounts: 267,
      activeAccounts: 247,
      pendingAccounts: 15,
      suspendedAccounts: 5,
      averageAccountValue: 9957.23
    },
    revenueData: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 500000) + 1500000,
        accounts: Math.floor(Math.random() * 50) + 200,
        transactions: Math.floor(Math.random() * 10000000) + 30000000
      };
    }),
    topAccounts: [
      {
        id: 'acc_001',
        name: 'TechCorp Solutions',
        revenue: 156789,
        growth: 23.5,
        status: 'active'
      },
      {
        id: 'acc_002',
        name: 'Global Finance Ltd',
        revenue: 134567,
        growth: 18.2,
        status: 'active'
      },
      {
        id: 'acc_003',
        name: 'Innovation Dynamics',
        revenue: 123456,
        growth: 15.7,
        status: 'active'
      },
      {
        id: 'acc_004',
        name: 'Enterprise Systems',
        revenue: 98765,
        growth: -2.3,
        status: 'active'
      },
      {
        id: 'acc_005',
        name: 'Digital Ventures',
        revenue: 87654,
        growth: 31.8,
        status: 'active'
      }
    ],
    alerts: [
      {
        id: 'alert_1',
        type: 'warning',
        message: 'Account TechCorp Solutions approaching monthly transaction limit',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        account: 'TechCorp Solutions'
      },
      {
        id: 'alert_2',
        type: 'info',
        message: 'New enterprise account Global Finance Ltd requires approval',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        account: 'Global Finance Ltd'
      },
      {
        id: 'alert_3',
        type: 'error',
        message: 'Payment failed for Innovation Dynamics - insufficient funds',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        account: 'Innovation Dynamics'
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboardData(mockDashboardData);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading enterprise dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p>Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Enterprise Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive enterprise account and payment management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              +{dashboardData.summary.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.summary.activeAccounts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.accountMetrics.pendingAccounts} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.summary.transactionVolume)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all enterprise accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Account Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.accountMetrics.averageAccountValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payments">Bulk Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue and account growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                      name === 'revenue' ? 'Revenue' : name === 'accounts' ? 'Accounts' : 'Transactions'
                    ]} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Distribution</CardTitle>
                <CardDescription>Enterprise account status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="font-semibold">{dashboardData.accountMetrics.activeAccounts}</span>
                  </div>
                  <Progress value={(dashboardData.accountMetrics.activeAccounts / dashboardData.accountMetrics.totalAccounts) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-semibold">{dashboardData.accountMetrics.pendingAccounts}</span>
                  </div>
                  <Progress value={(dashboardData.accountMetrics.pendingAccounts / dashboardData.accountMetrics.totalAccounts) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Suspended</span>
                    </div>
                    <span className="font-semibold">{dashboardData.accountMetrics.suspendedAccounts}</span>
                  </div>
                  <Progress value={(dashboardData.accountMetrics.suspendedAccounts / dashboardData.accountMetrics.totalAccounts) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Enterprise Accounts</CardTitle>
                <CardDescription>Highest revenue generating accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topAccounts.map((account, index) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(account.revenue)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center ${account.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {account.growth >= 0 ? 
                            <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          }
                          <span className="text-sm font-semibold">{Math.abs(account.growth)}%</span>
                        </div>
                        <Badge variant="outline">{account.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Important notifications and system alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <div key={alert.id} className={`p-3 border rounded-lg ${getAlertColor(alert.type)}`}>
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                            {alert.account && (
                              <Badge variant="outline" className="text-xs">
                                {alert.account}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <EnterpriseAccountManagement />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <EnterpriseBillingDashboard />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <BulkPaymentProcessing />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-semibold">94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Uptime</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Time</span>
                    <span className="font-semibold">&lt; 100ms</span>
                  </div>
                  <Progress value={95} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transaction Success Rate</span>
                    <span className="font-semibold">99.7%</span>
                  </div>
                  <Progress value={99.7} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button className="justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Create Enterprise Account
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Revenue Report
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Bulk Payment
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Account Notifications
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Run Compliance Check
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    API Performance Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
