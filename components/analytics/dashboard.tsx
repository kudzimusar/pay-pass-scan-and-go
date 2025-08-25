"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  DollarSign, 
  Shield,
  Activity,
  Globe,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Legend
} from 'recharts';

interface AnalyticsData {
  transactions: {
    total: number;
    volume: number;
    successRate: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  revenue: {
    total: number;
    growth: number;
    averageTransaction: number;
  };
  fraud: {
    rate: number;
    blocked: number;
    saved: number;
  };
}

interface ChartData {
  name: string;
  transactions: number;
  revenue: number;
  users: number;
  fraud: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data - replace with actual API calls
  const mockData: AnalyticsData = {
    transactions: {
      total: 12543,
      volume: 2845670,
      successRate: 99.2,
      growth: 15.3
    },
    users: {
      total: 8934,
      active: 3456,
      new: 234,
      retention: 78.5
    },
    revenue: {
      total: 56912.45,
      growth: 23.1,
      averageTransaction: 226.78
    },
    fraud: {
      rate: 0.8,
      blocked: 102,
      saved: 23456.78
    }
  };

  const mockChartData: ChartData[] = [
    { name: 'Mon', transactions: 120, revenue: 2400, users: 45, fraud: 2 },
    { name: 'Tue', transactions: 190, revenue: 3800, users: 67, fraud: 1 },
    { name: 'Wed', transactions: 150, revenue: 3000, users: 52, fraud: 3 },
    { name: 'Thu', transactions: 220, revenue: 4400, users: 78, fraud: 1 },
    { name: 'Fri', transactions: 280, revenue: 5600, users: 89, fraud: 4 },
    { name: 'Sat', transactions: 340, revenue: 6800, users: 95, fraud: 2 },
    { name: 'Sun', transactions: 200, revenue: 4000, users: 61, fraud: 1 }
  ];

  const fraudDistributionData = [
    { name: 'Low Risk', value: 85, color: '#00C49F' },
    { name: 'Medium Risk', value: 12, color: '#FFBB28' },
    { name: 'High Risk', value: 3, color: '#FF8042' }
  ];

  const currencyData = [
    { name: 'USD', value: 45, color: '#0088FE' },
    { name: 'EUR', value: 25, color: '#00C49F' },
    { name: 'GBP', value: 15, color: '#FFBB28' },
    { name: 'ZWL', value: 10, color: '#FF8042' },
    { name: 'Others', value: 5, color: '#8884D8' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setData(mockData);
        setChartData(mockChartData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const refreshData = () => {
    setData(null);
    setIsLoading(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setData(mockData);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = "default" 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: number;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color === 'success' ? 'text-green-600' : color === 'warning' ? 'text-yellow-600' : color === 'danger' ? 'text-red-600' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center pt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-xs ml-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trendValue}% from last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p>Failed to load analytics data</p>
          <Button onClick={refreshData} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Transactions"
          value={formatNumber(data.transactions.total)}
          subtitle={`${formatCurrency(data.transactions.volume)} volume`}
          icon={CreditCard}
          trend="up"
          trendValue={data.transactions.growth}
          color="success"
        />
        <MetricCard
          title="Active Users"
          value={formatNumber(data.users.active)}
          subtitle={`${data.users.new} new users`}
          icon={Users}
          trend="up"
          trendValue={data.users.retention}
          color="success"
        />
        <MetricCard
          title="Revenue"
          value={formatCurrency(data.revenue.total)}
          subtitle={`${formatCurrency(data.revenue.averageTransaction)} avg`}
          icon={DollarSign}
          trend="up"
          trendValue={data.revenue.growth}
          color="success"
        />
        <MetricCard
          title="Fraud Rate"
          value={`${data.fraud.rate}%`}
          subtitle={`${data.fraud.blocked} blocked`}
          icon={Shield}
          trend="down"
          trendValue={0.2}
          color="success"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
                <CardDescription>Daily transaction volume and count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="transactions"
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
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue by currency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPieChart>
                    <Pie
                      data={currencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {currencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Analytics</CardTitle>
                <CardDescription>Detailed transaction metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.transactions.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <Progress value={data.transactions.successRate} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.transactions.volume / data.transactions.total)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Transaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(data.transactions.total / 7)}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Average</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection</CardTitle>
                <CardDescription>Risk assessment and fraud prevention metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Fraud Rate</span>
                    <Badge variant={data.fraud.rate < 1 ? 'default' : 'destructive'}>
                      {data.fraud.rate}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Blocked Transactions</span>
                    <span className="font-semibold">{data.fraud.blocked}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Amount Saved</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.fraud.saved)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Transaction risk levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={fraudDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {fraudDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
