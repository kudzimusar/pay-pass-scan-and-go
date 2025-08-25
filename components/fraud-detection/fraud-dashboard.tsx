'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Clock,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import RiskIndicator from './risk-indicator';
import FraudAlert from './fraud-alert';
import TransactionRisk from './transaction-risk';

interface FraudDashboardProps {
  className?: string;
}

export default function FraudDashboard({ className }: FraudDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [fraudStats, setFraudStats] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockStats = {
        totalTransactions: 15420,
        flaggedTransactions: 1234,
        blockedTransactions: 89,
        falsePositives: 23,
        truePositives: 66,
        accuracy: 0.92,
        averageRiskScore: 0.34,
        riskDistribution: {
          low: 0.65,
          medium: 0.25,
          high: 0.08,
          critical: 0.02,
        },
        trends: {
          flaggedTrend: 0.15,
          blockedTrend: -0.08,
          accuracyTrend: 0.03,
        },
      };

      const mockAlerts = [
        {
          id: 'alert_001',
          transactionId: 'tx_123456',
          severity: 'high',
          type: 'suspicious_pattern',
          description: 'Multiple high-value transactions in short time',
          timestamp: new Date().toISOString(),
          status: 'open',
          details: {
            amount: 5000,
            currency: 'USD',
            location: 'Nigeria',
            device: 'Unknown Device',
            user: 'user_123',
            patterns: ['velocity_fraud', 'location_anomaly'],
          },
        },
        {
          id: 'alert_002',
          transactionId: 'tx_123457',
          severity: 'medium',
          type: 'location_anomaly',
          description: 'Transaction from new country',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'investigating',
          details: {
            amount: 1200,
            currency: 'USD',
            location: 'Russia',
            device: 'Known Device',
            user: 'user_456',
            patterns: ['location_anomaly'],
          },
        },
        {
          id: 'alert_003',
          transactionId: 'tx_123458',
          severity: 'critical',
          type: 'amount_anomaly',
          description: 'Unusually large transaction amount',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'open',
          details: {
            amount: 25000,
            currency: 'USD',
            location: 'US',
            device: 'New Device',
            user: 'user_789',
            patterns: ['amount_anomaly', 'device_anomaly'],
          },
        },
      ];

      setFraudStats(mockStats);
      setRecentAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading fraud data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = (action: string, alertId: string) => {
    console.log(`Action ${action} for alert ${alertId}`);
    // In real implementation, this would call the API
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading fraud dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fraud Detection Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time fraud monitoring and risk assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadFraudData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fraudStats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Transactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{fraudStats.flaggedTransactions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{Math.round(fraudStats.trends.flaggedTrend * 100)}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Transactions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fraudStats.blockedTransactions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              {Math.round(fraudStats.trends.blockedTrend * 100)}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(fraudStats.accuracy * 100).toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{Math.round(fraudStats.trends.accuracyTrend * 100)}% from yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Transaction risk level breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Risk</span>
                    <span className="text-sm font-medium">{(fraudStats.riskDistribution.low * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${fraudStats.riskDistribution.low * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium Risk</span>
                    <span className="text-sm font-medium">{(fraudStats.riskDistribution.medium * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${fraudStats.riskDistribution.medium * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Risk</span>
                    <span className="text-sm font-medium">{(fraudStats.riskDistribution.high * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${fraudStats.riskDistribution.high * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical Risk</span>
                    <span className="text-sm font-medium">{(fraudStats.riskDistribution.critical * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${fraudStats.riskDistribution.critical * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest fraud detection events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className={`h-2 w-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Fraud Alerts</h3>
              <Badge variant="outline">{recentAlerts.length} active alerts</Badge>
            </div>
            {recentAlerts.map((alert) => (
              <FraudAlert 
                key={alert.id} 
                alert={alert} 
                onAction={handleAlertAction}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk-assessment" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Risk Assessment</h3>
            <TransactionRisk
              transactionId="tx_sample_123"
              amount={5000}
              currency="USD"
              timestamp={new Date().toISOString()}
              location={{
                country: "US",
                city: "New York",
                ipAddress: "192.168.1.1"
              }}
              deviceInfo={{
                deviceId: "device_123",
                userAgent: "Mozilla/5.0...",
                fingerprint: "fp_123456"
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Fraud detection system performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">True Positives</span>
                    <span className="text-sm font-medium text-green-600">{fraudStats.truePositives}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">False Positives</span>
                    <span className="text-sm font-medium text-red-600">{fraudStats.falsePositives}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Precision</span>
                    <span className="text-sm font-medium">
                      {((fraudStats.truePositives / (fraudStats.truePositives + fraudStats.falsePositives)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Risk Score</span>
                    <span className="text-sm font-medium">{(fraudStats.averageRiskScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Fraud detection system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ML Models</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium">150ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Model Update</span>
                    <span className="text-sm font-medium">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}