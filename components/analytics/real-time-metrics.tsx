"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Globe
} from 'lucide-react';

interface RealTimeMetric {
  label: string;
  value: number | string;
  unit?: string;
  change?: number;
  status?: 'good' | 'warning' | 'critical';
  icon?: any;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export default function RealTimeMetrics() {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock real-time data
  const generateMockMetrics = (): RealTimeMetric[] => [
    {
      label: 'Transactions/min',
      value: Math.floor(Math.random() * 50) + 20,
      unit: 'txn/min',
      change: Math.floor(Math.random() * 20) - 10,
      status: 'good',
      icon: Activity
    },
    {
      label: 'Active Users',
      value: Math.floor(Math.random() * 100) + 50,
      change: Math.floor(Math.random() * 10) - 5,
      status: 'good',
      icon: Users
    },
    {
      label: 'Success Rate',
      value: (98 + Math.random() * 2).toFixed(1),
      unit: '%',
      change: Math.random() * 2 - 1,
      status: parseFloat((98 + Math.random() * 2).toFixed(1)) > 99 ? 'good' : 'warning',
      icon: CheckCircle
    },
    {
      label: 'Avg Response',
      value: Math.floor(Math.random() * 100) + 50,
      unit: 'ms',
      change: Math.floor(Math.random() * 20) - 10,
      status: Math.floor(Math.random() * 100) + 50 < 100 ? 'good' : 'warning',
      icon: Zap
    },
    {
      label: 'Error Rate',
      value: (Math.random() * 2).toFixed(2),
      unit: '%',
      change: Math.random() * 1 - 0.5,
      status: parseFloat((Math.random() * 2).toFixed(2)) < 1 ? 'good' : 'critical',
      icon: AlertCircle
    },
    {
      label: 'Queue Depth',
      value: Math.floor(Math.random() * 20),
      change: Math.floor(Math.random() * 10) - 5,
      status: Math.floor(Math.random() * 20) < 10 ? 'good' : 'warning',
      icon: Clock
    }
  ];

  const generateMockAlerts = (): SystemAlert[] => {
    const alertTypes = ['info', 'warning', 'error'] as const;
    const messages = [
      'High transaction volume detected',
      'Payment service response time elevated',
      'New user registration spike',
      'Fraud detection model updated',
      'Database connection pool optimized',
      'Cache hit rate improved'
    ];

    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
      id: `alert-${i}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000) // Random time in last hour
    }));
  };

  useEffect(() => {
    // Simulate WebSocket connection
    setIsConnected(true);
    
    const updateMetrics = () => {
      setMetrics(generateMockMetrics());
      setAlerts(generateMockAlerts());
      setLastUpdate(new Date());
    };

    // Initial load
    updateMetrics();

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatChange = (change?: number) => {
    if (!change) return null;
    const isPositive = change > 0;
    return (
      <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Metrics</h2>
          <p className="text-muted-foreground">
            Live system performance and activity monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon || Activity;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">
                    {metric.value}
                    {metric.unit && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    )}
                  </div>
                  {formatChange(metric.change)}
                </div>
                {metric.status && (
                  <Badge 
                    variant={metric.status === 'good' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}
                    className="mt-2"
                  >
                    {metric.status}
                  </Badge>
                )}
              </CardContent>
              {/* Status indicator bar */}
              <div 
                className={`absolute bottom-0 left-0 h-1 w-full ${
                  metric.status === 'good' ? 'bg-green-500' : 
                  metric.status === 'warning' ? 'bg-yellow-500' : 
                  metric.status === 'critical' ? 'bg-red-500' : 'bg-gray-300'
                }`} 
              />
            </Card>
          );
        })}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overall system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Response Time</span>
              <div className="flex items-center space-x-2">
                <Progress value={85} className="w-24" />
                <span className="text-sm text-muted-foreground">85ms avg</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Performance</span>
              <div className="flex items-center space-x-2">
                <Progress value={92} className="w-24" />
                <span className="text-sm text-muted-foreground">92% optimal</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cache Hit Rate</span>
              <div className="flex items-center space-x-2">
                <Progress value={96} className="w-24" />
                <span className="text-sm text-muted-foreground">96%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Service Availability</span>
              <div className="flex items-center space-x-2">
                <Progress value={99.9} className="w-24" />
                <span className="text-sm text-muted-foreground">99.9%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>System notifications and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    {alert.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : alert.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={getAlertVariant(alert.type)}>
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geographic Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Geographic Activity</span>
          </CardTitle>
          <CardDescription>Real-time transaction activity by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { region: 'North America', transactions: 234, percentage: 45 },
              { region: 'Europe', transactions: 187, percentage: 36 },
              { region: 'Asia Pacific', transactions: 89, percentage: 17 },
              { region: 'Africa', transactions: 12, percentage: 2 }
            ].map((region, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">{region.region}</div>
                  <div className="text-sm text-muted-foreground">
                    {region.transactions} transactions
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{region.percentage}%</div>
                  <Progress value={region.percentage} className="w-16 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
