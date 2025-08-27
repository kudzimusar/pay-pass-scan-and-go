'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionChartProps {
  data: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    trend: number;
  };
}

export function TransactionChart({ data }: TransactionChartProps) {
  const successRate = data.total > 0 ? (data.successful / data.total) * 100 : 0;
  const isTrendingUp = data.trend > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Transaction Overview
          <div className={`flex items-center ${isTrendingUp ? 'text-green-600' : 'text-red-600'}`}>
            {isTrendingUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            <span className="text-sm font-medium">{Math.abs(data.trend)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Transactions</span>
            <span className="font-semibold">{data.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Successful</span>
            <span className="text-green-600 font-semibold">{data.successful.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Failed</span>
            <span className="text-red-600 font-semibold">{data.failed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pending</span>
            <span className="text-yellow-600 font-semibold">{data.pending.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="font-semibold">{successRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}