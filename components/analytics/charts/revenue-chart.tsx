'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RevenueChartProps {
  dateRange: { from: Date; to: Date };
}

interface RevenueData {
  date: string;
  revenue: number;
  fees: number;
  netRevenue: number;
  currency: string;
}

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange, period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/revenue', {
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
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalFees = data.reduce((sum, item) => sum + item.fees, 0);
  const netRevenue = data.reduce((sum, item) => sum + item.netRevenue, 0);
  const feePercentage = totalRevenue > 0 ? (totalFees / totalRevenue) * 100 : 0;

  // Calculate trend
  const currentPeriodRevenue = data.slice(-7).reduce((sum, item) => sum + item.revenue, 0);
  const previousPeriodRevenue = data.slice(-14, -7).reduce((sum, item) => sum + item.revenue, 0);
  const trend = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <DollarSign className="h-8 w-8 animate-spin" />
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
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>
              Revenue generation and growth patterns
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${netRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Net Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${totalFees.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Fees ({feePercentage.toFixed(1)}%)</div>
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
            <DollarSign className="h-12 w-12 mx-auto mb-2" />
            <p>Revenue Chart Visualization</p>
            <p className="text-sm">Chart library integration required</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Recent Revenue</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.slice(-5).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.date}</span>
                <div className="flex gap-4">
                  <span className="text-green-600">${item.revenue.toLocaleString()}</span>
                  <span className="text-orange-600">${item.fees.toLocaleString()}</span>
                  <span className="text-blue-600">${item.netRevenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}