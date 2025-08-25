'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle,
  DollarSign,
  MapPin,
  Clock,
  User,
  Smartphone,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TransactionRiskProps {
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
  location?: {
    country: string;
    city?: string;
    ipAddress?: string;
  };
  deviceInfo?: {
    deviceId?: string;
    userAgent?: string;
    fingerprint?: string;
  };
  onRiskAssessment?: (assessment: any) => void;
}

export default function TransactionRisk({
  transactionId,
  amount,
  currency,
  timestamp,
  location,
  deviceInfo,
  onRiskAssessment,
}: TransactionRiskProps) {
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    assessRisk();
  }, [transactionId]);

  const assessRisk = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fraud-detection/assess-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: {
            id: transactionId,
            userId: 'user_123', // Mock user ID
            amount,
            currency,
            timestamp,
            location,
            deviceInfo,
          },
          userProfile: {
            id: 'user_123',
            usualCountries: ['US', 'CA'],
            usualDevices: ['device_1', 'device_2'],
            lastLocation: { country: 'US', city: 'New York' },
            lastTransactionTime: new Date(Date.now() - 3600000).toISOString(),
            weekendTransactions: 5,
            totalTransactions: 50,
          },
          historicalData: {
            transactions: [
              { id: 'tx_1', amount: 100, timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
              { id: 'tx_2', amount: 250, timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'completed' },
              { id: 'tx_3', amount: 75, timestamp: new Date(Date.now() - 259200000).toISOString(), status: 'completed' },
            ],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRiskAssessment(data.data);
        if (onRiskAssessment) {
          onRiskAssessment(data.data);
        }
      }
    } catch (error) {
      console.error('Error assessing risk:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span>Assessing transaction risk...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!riskAssessment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to assess transaction risk
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getRiskIcon(riskAssessment.riskLevel)}
              Transaction Risk Analysis
            </CardTitle>
            <CardDescription>
              ID: {transactionId} • {new Date(timestamp).toLocaleString()}
            </CardDescription>
          </div>
          <Badge className={getRiskColor(riskAssessment.riskLevel)}>
            {riskAssessment.riskLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              {/* Risk Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Risk Score</span>
                  <span className="font-medium">{Math.round(riskAssessment.riskScore * 100)}%</span>
                </div>
                <Progress value={riskAssessment.riskScore * 100} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {riskAssessment.riskLevel === 'critical' && 'Critical risk - immediate action required'}
                  {riskAssessment.riskLevel === 'high' && 'High risk - manual review recommended'}
                  {riskAssessment.riskLevel === 'medium' && 'Medium risk - monitor closely'}
                  {riskAssessment.riskLevel === 'low' && 'Low risk - standard processing'}
                  {riskAssessment.riskLevel === 'minimal' && 'Minimal risk - proceed normally'}
                </p>
              </div>

              {/* Transaction Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold">
                    {currency} {amount.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-sm">
                    {location?.city}, {location?.country}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="factors" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Risk Factor Breakdown</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Amount Risk</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {Math.round(riskAssessment.riskFactors.amountRisk * 100)}%
                    </span>
                  </div>
                  <Progress value={riskAssessment.riskFactors.amountRisk * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Location Risk</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {Math.round(riskAssessment.riskFactors.locationRisk * 100)}%
                    </span>
                  </div>
                  <Progress value={riskAssessment.riskFactors.locationRisk * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Risk</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {Math.round(riskAssessment.riskFactors.timeRisk * 100)}%
                    </span>
                  </div>
                  <Progress value={riskAssessment.riskFactors.timeRisk * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">User History Risk</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {Math.round(riskAssessment.riskFactors.userHistoryRisk * 100)}%
                    </span>
                  </div>
                  <Progress value={riskAssessment.riskFactors.userHistoryRisk * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Device Risk</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {Math.round(riskAssessment.riskFactors.deviceRisk * 100)}%
                    </span>
                  </div>
                  <Progress value={riskAssessment.riskFactors.deviceRisk * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Velocity Risk</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {Math.round(riskAssessment.riskFactors.velocityRisk * 100)}%
                    </span>
                  </div>
                  <Progress value={riskAssessment.riskFactors.velocityRisk * 100} className="h-2" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Recommended Actions</h4>
              <div className="space-y-3">
                {riskAssessment.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${getRiskColor(riskAssessment.riskLevel)}`} />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                {riskAssessment.riskLevel === 'critical' && (
                  <Button variant="destructive" className="flex-1">
                    Block Transaction
                  </Button>
                )}
                {riskAssessment.riskLevel === 'high' && (
                  <Button variant="default" className="flex-1">
                    Flag for Review
                  </Button>
                )}
                {riskAssessment.riskLevel === 'medium' && (
                  <Button variant="outline" className="flex-1">
                    Monitor Closely
                  </Button>
                )}
                {(riskAssessment.riskLevel === 'low' || riskAssessment.riskLevel === 'minimal') && (
                  <Button variant="outline" className="flex-1">
                    Proceed
                  </Button>
                )}
                <Button variant="ghost" className="flex-1">
                  View Details
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Transaction Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <p className="text-sm font-mono">{transactionId}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p className="text-sm">{new Date(timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-sm">{currency} {amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-sm">{location?.city}, {location?.country}</p>
                </div>
                {deviceInfo?.deviceId && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                    <p className="text-sm font-mono">{deviceInfo.deviceId}</p>
                  </div>
                )}
                {location?.ipAddress && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                    <p className="text-sm font-mono">{location.ipAddress}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Assessment Timestamp</label>
                <p className="text-sm">{new Date(riskAssessment.assessmentTimestamp).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}