'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';

interface FraudDetectionChartProps {
  dateRange: { from: Date; to: Date };
}

interface FraudData {
  date: string;
  totalTransactions: number;
  flaggedTransactions: number;
  blockedTransactions: number;
  falsePositives: number;
  riskScore: number;
}

export function FraudDetectionChart({ dateRange }: FraudDetectionChartProps) {
  const [data, setData] = useState<FraudData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchFraudData();
  }, [dateRange, period]);

  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/fraud', {
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
      console.error('Error fetching fraud data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTransactions = data.reduce((sum, item) => sum + item.totalTransactions, 0);
  const flaggedTransactions = data.reduce((sum, item) => sum + item.flaggedTransactions, 0);
  const blockedTransactions = data.reduce((sum, item) => sum + item.blockedTransactions, 0);
  const falsePositives = data.reduce((sum, item) => sum + item.falsePositives, 0);
  const avgRiskScore = data.reduce((sum, item) => sum + item.riskScore, 0) / data.length || 0;
  
  const flagRate = totalTransactions > 0 ? (flaggedTransactions / totalTransactions) * 100 : 0;
  const blockRate = totalTransactions > 0 ? (blockedTransactions / totalTransactions) * 100 : 0;
  const falsePositiveRate = flaggedTransactions > 0 ? (falsePositives / flaggedTransactions) * 100 : 0;

  // Calculate trend
  const currentPeriodFlagged = data.slice(-7).reduce((sum, item) => sum + item.flaggedTransactions, 0);
  const previousPeriodFlagged = data.slice(-14, -7).reduce((sum, item) => sum + item.flaggedTransactions, 0);
  const trend = previousPeriodFlagged > 0 
    ? ((currentPeriodFlagged - previousPeriodFlagged) / previousPeriodFlagged) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fraud Detection Analytics</CardTitle>
          <CardDescription>Loading fraud detection data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Shield className="h-8 w-8 animate-spin" />
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
            <CardTitle>Fraud Detection Analytics</CardTitle>
            <CardDescription>
              Fraud patterns and detection performance
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
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {flaggedTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Flagged ({flagRate.toFixed(2)}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {blockedTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Blocked ({blockRate.toFixed(2)}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {falsePositives.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">False Positives ({falsePositiveRate.toFixed(2)}%)</div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-blue-600">
            {avgRiskScore.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Average Risk Score</div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center mb-4">
          <Badge variant={trend <= 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
            {trend <= 0 ? (
              <Shield className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {Math.abs(trend).toFixed(1)}% {trend <= 0 ? 'decrease' : 'increase'} in flagged transactions
          </Badge>
        </div>

        {/* Chart Placeholder */}
        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>Fraud Detection Chart Visualization</p>
            <p className="text-sm">Chart library integration required</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Recent Fraud Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.slice(-5).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.date}</span>
                <div className="flex gap-4">
                  <span className="text-orange-600">{item.flaggedTransactions}</span>
                  <span className="text-red-600">{item.blockedTransactions}</span>
                  <span className="text-yellow-600">{item.falsePositives}</span>
                  <span className="text-blue-600">{item.riskScore.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Level Indicators */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">Low Risk</div>
            <div className="text-sm text-muted-foreground">0-30</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">Medium Risk</div>
            <div className="text-sm text-muted-foreground">31-70</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">High Risk</div>
            <div className="text-sm text-muted-foreground">71-100</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}