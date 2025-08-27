'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticsDashboardProps {
  data: {
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
  };
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Performance Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.performance.avgResponseTime}ms</div>
          <p className="text-xs text-muted-foreground">
            Average API response time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.performance.uptime}%</div>
          <p className="text-xs text-muted-foreground">
            System availability
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.performance.errorRate}%</div>
          <p className="text-xs text-muted-foreground">
            Transaction error rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.transactions.total > 0 
              ? ((data.transactions.successful / data.transactions.total) * 100).toFixed(1)
              : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Transaction success rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}