'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';

interface RiskIndicatorProps {
  riskScore: number;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    amountRisk: number;
    locationRisk: number;
    timeRisk: number;
    userHistoryRisk: number;
    deviceRisk: number;
    velocityRisk: number;
  };
  recommendations: string[];
  transactionId: string;
}

export default function RiskIndicator({
  riskScore,
  riskLevel,
  riskFactors,
  recommendations,
  transactionId,
}: RiskIndicatorProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'bg-green-500';
      case 'low':
        return 'bg-blue-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'minimal':
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'high':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRiskDescription = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'Very low risk - proceed normally';
      case 'low':
        return 'Low risk - standard processing';
      case 'medium':
        return 'Medium risk - monitor closely';
      case 'high':
        return 'High risk - manual review recommended';
      case 'critical':
        return 'Critical risk - immediate action required';
      default:
        return 'Risk level unknown';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getRiskIcon(riskLevel)}
              Risk Assessment
            </CardTitle>
            <CardDescription>
              Transaction ID: {transactionId}
            </CardDescription>
          </div>
          <Badge 
            variant={riskLevel === 'critical' || riskLevel === 'high' ? 'destructive' : 'secondary'}
            className="text-sm"
          >
            {riskLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Risk Score</span>
            <span className="font-medium">{Math.round(riskScore * 100)}%</span>
          </div>
          <Progress value={riskScore * 100} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {getRiskDescription(riskLevel)}
          </p>
        </div>

        {/* Risk Factors */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Risk Factors</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Amount Risk</span>
                <span>{Math.round(riskFactors.amountRisk * 100)}%</span>
              </div>
              <Progress value={riskFactors.amountRisk * 100} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Location Risk</span>
                <span>{Math.round(riskFactors.locationRisk * 100)}%</span>
              </div>
              <Progress value={riskFactors.locationRisk * 100} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Time Risk</span>
                <span>{Math.round(riskFactors.timeRisk * 100)}%</span>
              </div>
              <Progress value={riskFactors.timeRisk * 100} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>History Risk</span>
                <span>{Math.round(riskFactors.userHistoryRisk * 100)}%</span>
              </div>
              <Progress value={riskFactors.userHistoryRisk * 100} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Device Risk</span>
                <span>{Math.round(riskFactors.deviceRisk * 100)}%</span>
              </div>
              <Progress value={riskFactors.deviceRisk * 100} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Velocity Risk</span>
                <span>{Math.round(riskFactors.velocityRisk * 100)}%</span>
              </div>
              <Progress value={riskFactors.velocityRisk * 100} className="h-1" />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0 ${getRiskColor(riskLevel)}`} />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {riskLevel === 'critical' && (
            <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
              Block Transaction
            </button>
          )}
          {riskLevel === 'high' && (
            <button className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors">
              Flag for Review
            </button>
          )}
          {riskLevel === 'medium' && (
            <button className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors">
              Monitor Closely
            </button>
          )}
          {(riskLevel === 'low' || riskLevel === 'minimal') && (
            <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Proceed
            </button>
          )}
          <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
            View Details
          </button>
        </div>
      </CardContent>
    </Card>
  );
}