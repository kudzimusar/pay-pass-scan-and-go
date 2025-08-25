'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TransactionChartProps {
  dateRange: { from: Date; to: Date };
}

interface TransactionData {
  date: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
}

export function TransactionChart({ dateRange }: TransactionChartProps) {
  const [data, setData] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchTransactionData();
  }, [dateRange, period]);

  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/transactions', {
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
      console.error('Error fetching transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTransactions = data.reduce((sum, item) => sum + item.total, 0);
  const successfulTransactions = data.reduce((sum, item) => sum + item.successful, 0);
  const failedTransactions = data.reduce((sum, item) => sum + item.failed, 0);
  const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

  // Calculate trend (simple comparison with previous period)
  const currentPeriodTotal = data.slice(-7).reduce((sum, item) => sum + item.total, 0);
  const previousPeriodTotal = data.slice(-14, -7).reduce((sum, item) => sum + item.total, 0);
  const trend = previousPeriodTotal > 0 
    ? ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Overview</CardTitle>
          <CardDescription>Loading transaction data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Activity className="h-8 w-8 animate-spin" />
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
            <CardTitle>Transaction Overview</CardTitle>
            <CardDescription>
              Transaction volume and success rates over time
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
            <div className="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {successfulTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {failedTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
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
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <p>Transaction Chart Visualization</p>
            <p className="text-sm">Chart library integration required</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Recent Transactions</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.slice(-5).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.date}</span>
                <div className="flex gap-4">
                  <span className="text-green-600">{item.successful}</span>
                  <span className="text-red-600">{item.failed}</span>
                  <span className="text-blue-600">{item.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}