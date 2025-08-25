'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, TrendingDown, Users, DollarSign, Shield } from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  transactionsPerMinute: number;
  revenuePerMinute: number;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
  }>;
}

export default function RealTimeAnalyticsPage() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (isLive) {
      fetchRealTimeMetrics();
      const interval = setInterval(fetchRealTimeMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const fetchRealTimeMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/real-time');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading real-time metrics...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics</h1>
          <p className="text-muted-foreground">
            Live monitoring of platform activity and performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isLive ? 'default' : 'secondary'} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            {isLive ? 'Live' : 'Paused'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12% from last hour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions/min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.transactionsPerMinute}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +8% from last hour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue/min</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenuePerMinute.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +15% from last hour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.systemHealth.uptime.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.systemHealth.responseTime}ms avg response
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Real-time system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm text-green-600">{metrics.systemHealth.uptime.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm">{metrics.systemHealth.responseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-red-600">{metrics.systemHealth.errorRate.toFixed(3)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {metrics.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <div>
                    <div className="text-sm font-medium">
                      ${transaction.amount.toLocaleString()} {transaction.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge 
                    variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {transaction.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
          <CardDescription>Real-time platform events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted/20 rounded">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm">
                    New transaction processed: ${(Math.random() * 1000).toFixed(2)} USD
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(Date.now() - Math.random() * 60000).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}