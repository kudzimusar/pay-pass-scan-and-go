'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RevenueChartProps {
  data: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
}

export function RevenueChart({ data }: RevenueChartProps) {
  const isTrendingUp = data.trend > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Revenue Overview
          </div>
          <div className={`flex items-center ${isTrendingUp ? 'text-green-600' : 'text-red-600'}`}>
            {isTrendingUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            <span className="text-sm font-medium">{Math.abs(data.trend)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Revenue</span>
            <span className="font-semibold">${data.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">This Month</span>
            <span className="text-green-600 font-semibold">${data.thisMonth.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Month</span>
            <span className="text-blue-600 font-semibold">${data.lastMonth.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Growth</span>
              <span className={`font-semibold ${isTrendingUp ? 'text-green-600' : 'text-red-600'}`}>
                {isTrendingUp ? '+' : ''}{data.trend.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}