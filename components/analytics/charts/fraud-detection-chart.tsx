'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface FraudDetectionChartProps {
  data: {
    total: number;
    blocked: number;
    reviewed: number;
    allowed: number;
    riskScore: number;
  };
}

export function FraudDetectionChart({ data }: FraudDetectionChartProps) {
  const blockedRate = data.total > 0 ? (data.blocked / data.total) * 100 : 0;
  const reviewedRate = data.total > 0 ? (data.reviewed / data.total) * 100 : 0;
  const allowedRate = data.total > 0 ? (data.allowed / data.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Fraud Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Transactions</span>
            <span className="font-semibold">{data.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Blocked</span>
            <span className="text-red-600 font-semibold">{data.blocked.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Reviewed</span>
            <span className="text-yellow-600 font-semibold">{data.reviewed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Allowed</span>
            <span className="text-green-600 font-semibold">{data.allowed.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Score</span>
              <span className="font-semibold">{data.riskScore.toFixed(1)}%</span>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span>Blocked Rate</span>
                <span className="text-red-600">{blockedRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Review Rate</span>
                <span className="text-yellow-600">{reviewedRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Allow Rate</span>
                <span className="text-green-600">{allowedRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}