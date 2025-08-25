"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Users,
  BarChart3,
  PieChart as PieChartIcon
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
  Cell,
  Legend
} from 'recharts';

interface BillingData {
  summary: {
    currentBalance: number;
    monthlySpend: number;
    lastPayment: number;
    nextBillingDate: string;
    billingCycle: string;
    status: 'current' | 'overdue' | 'pending';
  };
  usage: {
    transactions: number;
    volume: number;
    apiCalls: number;
    storageUsed: number;
    dataTransfer: number;
  };
  pricing: {
    plan: string;
    basePrice: number;
    overageCharges: number;
    discounts: number;
    totalAmount: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EnterpriseBillingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock billing data
  const mockBillingData: BillingData = {
    summary: {
      currentBalance: -2456.78,
      monthlySpend: 15678.90,
      lastPayment: 12345.67,
      nextBillingDate: '2024-02-01',
      billingCycle: 'monthly',
      status: 'current'
    },
    usage: {
      transactions: 125678,
      volume: 2345678.90,
      apiCalls: 456789,
      storageUsed: 234.5, // GB
      dataTransfer: 1234.5 // GB
    },
    pricing: {
      plan: 'Enterprise Pro',
      basePrice: 9999.00,
      overageCharges: 5679.90,
      discounts: -1000.00,
      totalAmount: 14678.90
    }
  };

  const usageHistoryData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      transactions: Math.floor(Math.random() * 50000) + 100000,
      cost: Math.floor(Math.random() * 5000) + 10000,
      volume: Math.floor(Math.random() * 1000000) + 2000000
    };
  });

  const costBredownData = [
    { name: 'Base Plan', value: 9999, color: '#0088FE' },
    { name: 'Transaction Fees', value: 3456, color: '#00C49F' },
    { name: 'API Calls', value: 1234, color: '#FFBB28' },
    { name: 'Storage', value: 567, color: '#FF8042' },
    { name: 'Data Transfer', value: 423, color: '#8884D8' }
  ];

  const invoiceHistory = [
    {
      id: 'INV-2024-001',
      date: '2024-01-01',
      amount: 14678.90,
      status: 'paid',
      dueDate: '2024-01-15'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-01',
      amount: 13456.78,
      status: 'paid',
      dueDate: '2023-12-15'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-01',
      amount: 12345.67,
      status: 'paid',
      dueDate: '2023-11-15'
    },
    {
      id: 'INV-2023-010',
      date: '2023-10-01',
      amount: 15678.90,
      status: 'paid',
      dueDate: '2023-10-15'
    }
  ];

  const paymentMethods = [
    {
      id: 'pm_1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: 'pm_2',
      type: 'bank',
      last4: '6789',
      bankName: 'Chase Bank',
      isDefault: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchBillingData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBillingData(mockBillingData);
      setIsLoading(false);
    };

    fetchBillingData();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const downloadInvoice = (invoiceId: string) => {
    // Mock download functionality
    console.log(`Downloading invoice: ${invoiceId}`);
  };

  const exportBillingData = () => {
    // Mock export functionality
    console.log('Exporting billing data...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p>Failed to load billing data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Billing</h1>
          <p className="text-muted-foreground">
            Manage your billing, invoices, and usage analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportBillingData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Math.abs(billingData.summary.currentBalance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {billingData.summary.currentBalance < 0 ? 'Credit balance' : 'Amount due'}
            </p>
            <Badge className={`mt-2 ${getStatusColor(billingData.summary.status)}`}>
              {billingData.summary.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(billingData.summary.monthlySpend)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(billingData.summary.lastPayment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid on {new Date(billingData.summary.nextBillingDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(billingData.summary.nextBillingDate).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {billingData.summary.billingCycle} cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings">Billing Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>Monthly transaction volume and costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'cost' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                      name === 'cost' ? 'Cost' : name === 'transactions' ? 'Transactions' : 'Volume'
                    ]} />
                    <Area
                      type="monotone"
                      dataKey="cost"
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
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Current month spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBredownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBredownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Plan Details</CardTitle>
              <CardDescription>Your {billingData.pricing.plan} subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Base Plan:</span>
                    <span className="font-semibold">{formatCurrency(billingData.pricing.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overage Charges:</span>
                    <span className="font-semibold">{formatCurrency(billingData.pricing.overageCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discounts:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(billingData.pricing.discounts)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(billingData.pricing.totalAmount)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Transactions Used</Label>
                    <Progress value={75} className="mt-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatNumber(billingData.usage.transactions)} of 200,000
                    </p>
                  </div>
                  <div>
                    <Label>API Calls Used</Label>
                    <Progress value={60} className="mt-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatNumber(billingData.usage.apiCalls)} of 1,000,000
                    </p>
                  </div>
                  <div>
                    <Label>Storage Used</Label>
                    <Progress value={45} className="mt-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {billingData.usage.storageUsed} GB of 500 GB
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(billingData.usage.transactions)}</div>
                <p className="text-sm text-muted-foreground">This month</p>
                <Progress value={75} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(billingData.usage.volume)}</div>
                <p className="text-sm text-muted-foreground">This month</p>
                <Progress value={82} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(billingData.usage.apiCalls)}</div>
                <p className="text-sm text-muted-foreground">This month</p>
                <Progress value={60} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historical Usage</CardTitle>
              <CardDescription>12-month usage and cost analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={usageHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="transactions" fill="#8884d8" name="Transactions" />
                  <Bar dataKey="cost" fill="#82ca9d" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and download your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoiceHistory.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => downloadInvoice(invoice.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">
                          {method.type === 'card' ? `${method.brand} ending in ${method.last4}` : `${method.bankName} ending in ${method.last4}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {method.type === 'card' ? `Expires ${method.expiryMonth}/${method.expiryYear}` : 'Bank Account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full" variant="outline">
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Configure your billing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="billing-email">Billing Email</Label>
                <Input
                  id="billing-email"
                  type="email"
                  placeholder="billing@company.com"
                  defaultValue="billing@company.com"
                />
              </div>
              <div>
                <Label htmlFor="billing-cycle">Billing Cycle</Label>
                <Select defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="auto-pay" defaultChecked />
                <Label htmlFor="auto-pay">Enable automatic payments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="invoice-email" defaultChecked />
                <Label htmlFor="invoice-email">Email invoices</Label>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
