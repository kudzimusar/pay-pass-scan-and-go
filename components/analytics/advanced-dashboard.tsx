"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  Globe, 
  Brain,
  Zap,
  Target,
  PieChart,
  BarChart3,
  LineChart,
  Map,
  Calendar,
  Filter,
  Download,
  Refresh
} from 'lucide-react';

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  trend: number[];
  category: 'revenue' | 'users' | 'transactions' | 'performance';
}

interface PredictiveInsight {
  id: string;
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  category: 'revenue' | 'growth' | 'risk' | 'opportunity';
  impact: 'high' | 'medium' | 'low';
  recommendedAction: string;
}

interface GeographicData {
  country: string;
  transactions: number;
  revenue: number;
  users: number;
  growth: number;
}

interface UserSegment {
  name: string;
  count: number;
  revenue: number;
  avgTransactionValue: number;
  engagement: number;
  churnRisk: number;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data - in production, this would come from API
  const mockMetrics: AnalyticsMetric[] = [
    {
      label: 'Total Revenue',
      value: 1250000,
      change: 12.5,
      changeType: 'increase',
      trend: [1100000, 1150000, 1200000, 1220000, 1250000],
      category: 'revenue'
    },
    {
      label: 'Active Users',
      value: 45234,
      change: 8.3,
      changeType: 'increase',
      trend: [42000, 43500, 44000, 44800, 45234],
      category: 'users'
    },
    {
      label: 'Transactions',
      value: 892456,
      change: 15.7,
      changeType: 'increase',
      trend: [750000, 800000, 850000, 875000, 892456],
      category: 'transactions'
    },
    {
      label: 'Avg Response Time',
      value: 145,
      change: -5.2,
      changeType: 'decrease',
      trend: [180, 170, 160, 150, 145],
      category: 'performance'
    }
  ];

  const mockPredictions: PredictiveInsight[] = [
    {
      id: '1',
      title: 'Revenue Growth Acceleration',
      prediction: 'Revenue expected to reach $1.5M by end of month',
      confidence: 87,
      timeframe: '30 days',
      category: 'revenue',
      impact: 'high',
      recommendedAction: 'Increase marketing spend in high-converting regions'
    },
    {
      id: '2',
      title: 'User Acquisition Opportunity',
      prediction: 'Mobile users showing 40% higher retention rates',
      confidence: 92,
      timeframe: '14 days',
      category: 'growth',
      impact: 'high',
      recommendedAction: 'Invest in mobile app features and marketing'
    },
    {
      id: '3',
      title: 'Fraud Risk Alert',
      prediction: 'Potential fraud increase in transactions >$5000',
      confidence: 78,
      timeframe: '7 days',
      category: 'risk',
      impact: 'medium',
      recommendedAction: 'Enhance verification for high-value transactions'
    }
  ];

  const mockGeographicData: GeographicData[] = [
    { country: 'United States', transactions: 234567, revenue: 890000, users: 15678, growth: 12.3 },
    { country: 'United Kingdom', transactions: 156789, revenue: 567000, users: 10234, growth: 8.7 },
    { country: 'Germany', transactions: 123456, revenue: 445000, users: 8567, growth: 15.2 },
    { country: 'France', transactions: 98765, revenue: 334000, users: 6789, growth: 6.8 },
    { country: 'Canada', transactions: 87654, revenue: 298000, users: 5432, growth: 9.4 }
  ];

  const mockUserSegments: UserSegment[] = [
    {
      name: 'High Value Customers',
      count: 1234,
      revenue: 456000,
      avgTransactionValue: 890,
      engagement: 95,
      churnRisk: 5
    },
    {
      name: 'Regular Users',
      count: 23456,
      revenue: 678000,
      avgTransactionValue: 145,
      engagement: 72,
      churnRisk: 15
    },
    {
      name: 'New Users',
      count: 8765,
      revenue: 123000,
      avgTransactionValue: 67,
      engagement: 58,
      churnRisk: 35
    },
    {
      name: 'At-Risk Users',
      count: 3456,
      revenue: 45000,
      avgTransactionValue: 34,
      engagement: 25,
      churnRisk: 78
    }
  ];

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimationFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue':
        return <DollarSign className="h-5 w-5" />;
      case 'growth':
        return <TrendingUp className="h-5 w-5" />;
      case 'risk':
        return <Target className="h-5 w-5" />;
      case 'opportunity':
        return <Zap className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getImpactBadgeVariant = (impact: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (impact) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            AI-powered insights and predictive analytics for PayPass platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <Refresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                {getChangeIcon(metric.changeType)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.category === 'revenue' ? formatCurrency(metric.value) : 
                 metric.category === 'performance' ? `${metric.value}ms` :
                 formatNumber(metric.value)}
              </div>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${
                  metric.changeType === 'increase' ? 'text-green-600' : 
                  metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>Revenue performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Revenue trend visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Transaction Distribution
                </CardTitle>
                <CardDescription>Breakdown by transaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Transaction distribution chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Predictions
              </CardTitle>
              <CardDescription>
                Machine learning insights and future projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPredictions.map((prediction) => (
                  <div key={prediction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(prediction.category)}
                        <div>
                          <h4 className="font-medium">{prediction.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{prediction.prediction}</p>
                        </div>
                      </div>
                      <Badge variant={getImpactBadgeVariant(prediction.impact)}>
                        {prediction.impact} impact
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Confidence:</span>
                        <div className="font-medium">{prediction.confidence}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Timeframe:</span>
                        <div className="font-medium">{prediction.timeframe}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <div className="font-medium capitalize">{prediction.category}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium text-blue-900">Recommended Action:</span>
                        <p className="text-blue-800 mt-1">{prediction.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Performance
              </CardTitle>
              <CardDescription>Performance metrics by country/region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGeographicData.map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Map className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{country.country}</div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(country.users)} users
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 text-right">
                      <div>
                        <div className="text-sm text-gray-500">Transactions</div>
                        <div className="font-medium">{formatNumber(country.transactions)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Revenue</div>
                        <div className="font-medium">{formatCurrency(country.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Growth</div>
                        <div className={`font-medium ${country.growth > 10 ? 'text-green-600' : 'text-gray-900'}`}>
                          +{country.growth}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Segments Analysis
              </CardTitle>
              <CardDescription>Detailed breakdown of user categories and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUserSegments.map((segment, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-lg">{segment.name}</h4>
                      <Badge variant={segment.churnRisk > 50 ? 'destructive' : segment.churnRisk > 25 ? 'secondary' : 'outline'}>
                        {segment.churnRisk}% churn risk
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Users</div>
                        <div className="text-xl font-bold">{formatNumber(segment.count)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Revenue</div>
                        <div className="text-xl font-bold">{formatCurrency(segment.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg Transaction</div>
                        <div className="text-xl font-bold">{formatCurrency(segment.avgTransactionValue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Engagement</div>
                        <div className="text-xl font-bold">{segment.engagement}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Churn Risk</div>
                        <div className={`text-xl font-bold ${
                          segment.churnRisk > 50 ? 'text-red-600' : 
                          segment.churnRisk > 25 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {segment.churnRisk}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Real-time Monitoring
              </CardTitle>
              <CardDescription>Live system metrics and user activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600">1,247</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">23</div>
                  <div className="text-sm text-gray-500">Transactions/min</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">98.7%</div>
                  <div className="text-sm text-gray-500">System Health</div>
                </div>
              </div>
              
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Real-time activity feed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
