'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

interface UserGrowthChartProps {
  dateRange: { from: Date; to: Date };
}

interface UserData {
  date: string;
  total: number;
  active: number;
  new: number;
  churned: number;
}

export function UserGrowthChart({ dateRange }: UserGrowthChartProps) {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchUserData();
  }, [dateRange, period]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          period,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = data.length > 0 ? data[data.length - 1].total : 0;
  const activeUsers = data.reduce((sum, item) => sum + item.active, 0) / data.length || 0;
  const newUsers = data.reduce((sum, item) => sum + item.new, 0);
  const churnedUsers = data.reduce((sum, item) => sum + item.churned, 0);
  const retentionRate = totalUsers > 0 ? ((totalUsers - churnedUsers) / totalUsers) * 100 : 0;

  // Calculate trend
  const currentPeriodNew = data.slice(-7).reduce((sum, item) => sum + item.new, 0);
  const previousPeriodNew = data.slice(-14, -7).reduce((sum, item) => sum + item.new, 0);
  const trend = previousPeriodNew > 0 
    ? ((currentPeriodNew - previousPeriodNew) / previousPeriodNew) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Loading user data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Users className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              User acquisition and engagement metrics
            </CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7D</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
              <SelectItem value="90d">90D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(activeUsers).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Avg Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {newUsers.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">New Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {retentionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Retention</div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center mb-4">
          <Badge variant={trend >= 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend).toFixed(1)}% from previous period
          </Badge>
        </div>

        {/* Chart Placeholder */}
        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <p>User Growth Chart Visualization</p>
            <p className="text-sm">Chart library integration required</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Recent User Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.slice(-5).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.date}</span>
                <div className="flex gap-4">
                  <span className="text-blue-600">{item.active}</span>
                  <span className="text-green-600">+{item.new}</span>
                  <span className="text-red-600">-{item.churned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}