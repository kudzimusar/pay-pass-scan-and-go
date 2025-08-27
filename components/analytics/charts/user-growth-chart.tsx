'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

interface UserGrowthChartProps {
  data: {
    total: number;
    active: number;
    new: number;
    trend: number;
  };
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const isTrendingUp = data.trend > 0;
  const activeRate = data.total > 0 ? (data.active / data.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Growth
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
            <span className="text-sm text-muted-foreground">Total Users</span>
            <span className="font-semibold">{data.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active Users</span>
            <span className="text-green-600 font-semibold">{data.active.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">New Users</span>
            <span className="text-blue-600 font-semibold">{data.new.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Rate</span>
              <span className="font-semibold">{activeRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}