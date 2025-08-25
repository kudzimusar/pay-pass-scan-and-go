'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TransactionChart } from '@/components/analytics/charts/transaction-chart';
import { RevenueChart } from '@/components/analytics/charts/revenue-chart';
import { UserGrowthChart } from '@/components/analytics/charts/user-growth-chart';
import { FraudDetectionChart } from '@/components/analytics/charts/fraud-detection-chart';
import { AnalyticsDashboard } from '@/components/analytics/dashboard/analytics-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, TrendingUp, TrendingDown, Users, DollarSign, Activity } from 'lucide-react';

interface AnalyticsData {
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    trend: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    trend: number;
  };
  performance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        console.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Analytics Unavailable</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load analytics data. Please try again later.
          </p>
          <Button onClick={fetchAnalyticsData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user activity
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-auto"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.transactions.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.transactions.trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(analyticsData.transactions.trend)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.revenue.total.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.revenue.trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(analyticsData.revenue.trend)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.users.active.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.users.trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(analyticsData.users.trend)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analyticsData.transactions.successful / analyticsData.transactions.total) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {analyticsData.transactions.successful.toLocaleString()} successful transactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
                <CardDescription>
                  Transaction volume and success rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionChart dateRange={dateRange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>
                  Revenue generation and growth patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart dateRange={dateRange} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>
                User acquisition and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserGrowthChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <AnalyticsDashboard
            type="transactions"
            dateRange={dateRange}
            data={analyticsData.transactions}
          />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <AnalyticsDashboard
            type="revenue"
            dateRange={dateRange}
            data={analyticsData.revenue}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <AnalyticsDashboard
            type="users"
            dateRange={dateRange}
            data={analyticsData.users}
          />
        </TabsContent>

        <TabsContent value="fraud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Analytics</CardTitle>
              <CardDescription>
                Fraud patterns and detection performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FraudDetectionChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>
            Platform performance and reliability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.performance.uptime.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.performance.avgResponseTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analyticsData.performance.errorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}