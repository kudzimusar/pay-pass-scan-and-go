"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  DollarSign, 
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface KPI {
  name: string;
  value: number;
  target: number;
  change: number;
  period: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  growthRate: number;
  ltv: number; // Lifetime Value
}

interface MarketInsight {
  metric: string;
  current: number;
  benchmark: number;
  industry: number;
  recommendation: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function BusinessIntelligence() {
  const [selectedPeriod, setSelectedPeriod] = useState('quarterly');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);

  // Mock data
  const mockKPIs: KPI[] = [
    {
      name: 'Monthly Recurring Revenue',
      value: 2450000,
      target: 2500000,
      change: 15.3,
      period: 'MoM',
      trend: 'up',
      status: 'good'
    },
    {
      name: 'Customer Acquisition Cost',
      value: 45.50,
      target: 40.00,
      change: -8.2,
      period: 'MoM',
      trend: 'down',
      status: 'warning'
    },
    {
      name: 'Customer Lifetime Value',
      value: 1250.75,
      target: 1200.00,
      change: 12.5,
      period: 'QoQ',
      trend: 'up',
      status: 'good'
    },
    {
      name: 'Churn Rate',
      value: 2.8,
      target: 3.0,
      change: -15.1,
      period: 'MoM',
      trend: 'down',
      status: 'good'
    },
    {
      name: 'Net Promoter Score',
      value: 67,
      target: 70,
      change: 5.2,
      period: 'QoQ',
      trend: 'up',
      status: 'warning'
    },
    {
      name: 'Average Transaction Value',
      value: 156.78,
      target: 150.00,
      change: 8.9,
      period: 'MoM',
      trend: 'up',
      status: 'good'
    }
  ];

  const mockCustomerSegments: CustomerSegment[] = [
    {
      segment: 'Premium Enterprise',
      count: 234,
      revenue: 1250000,
      growthRate: 25.3,
      ltv: 5600
    },
    {
      segment: 'Small Business',
      count: 1567,
      revenue: 890000,
      growthRate: 18.7,
      ltv: 890
    },
    {
      segment: 'Individual Premium',
      count: 5432,
      revenue: 450000,
      growthRate: 12.1,
      ltv: 456
    },
    {
      segment: 'Basic Users',
      count: 12890,
      revenue: 180000,
      growthRate: 8.4,
      ltv: 125
    }
  ];

  const mockMarketInsights: MarketInsight[] = [
    {
      metric: 'Payment Success Rate',
      current: 99.2,
      benchmark: 98.5,
      industry: 97.8,
      recommendation: 'Maintain current optimization strategies'
    },
    {
      metric: 'Mobile App Adoption',
      current: 67.3,
      benchmark: 75.0,
      industry: 72.1,
      recommendation: 'Increase mobile marketing and improve app UX'
    },
    {
      metric: 'Cross-border Transaction Volume',
      current: 23.4,
      benchmark: 30.0,
      industry: 28.5,
      recommendation: 'Expand international partnerships and reduce fees'
    },
    {
      metric: 'Fraud Detection Accuracy',
      current: 98.7,
      benchmark: 96.0,
      industry: 95.2,
      recommendation: 'Continue investing in AI/ML capabilities'
    }
  ];

  const conversionFunnelData = [
    { name: 'Visitors', value: 10000, fill: '#8884d8' },
    { name: 'Sign-ups', value: 2500, fill: '#83a6ed' },
    { name: 'KYC Completed', value: 2000, fill: '#8dd1e1' },
    { name: 'First Transaction', value: 1500, fill: '#82ca9d' },
    { name: 'Active Users', value: 1200, fill: '#a4de6c' }
  ];

  const revenueByChannelData = [
    { name: 'Mobile App', value: 45, revenue: 1125000 },
    { name: 'Web Platform', value: 35, revenue: 875000 },
    { name: 'API Integration', value: 15, revenue: 375000 },
    { name: 'Partner Network', value: 5, revenue: 125000 }
  ];

  const competitiveAnalysisData = [
    { feature: 'Transaction Speed', paypass: 95, competitor1: 85, competitor2: 78, industry: 82 },
    { feature: 'Fee Structure', paypass: 88, competitor1: 75, competitor2: 82, industry: 80 },
    { feature: 'Security', paypass: 98, competitor1: 92, competitor2: 89, industry: 90 },
    { feature: 'User Experience', paypass: 87, competitor1: 90, competitor2: 85, industry: 86 },
    { feature: 'Global Coverage', paypass: 76, competitor1: 95, competitor2: 88, industry: 85 }
  ];

  useEffect(() => {
    setKPIs(mockKPIs);
    setCustomerSegments(mockCustomerSegments);
    setMarketInsights(mockMarketInsights);
  }, [selectedPeriod, selectedSegment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' || change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === 'down' || change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const exportReport = () => {
    // Mock export functionality
    console.log('Exporting business intelligence report...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <p className="text-muted-foreground">
            Strategic insights and performance analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              {getTrendIcon(kpi.trend, kpi.change)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.name.includes('Revenue') || kpi.name.includes('Cost') || kpi.name.includes('Value') 
                  ? formatCurrency(kpi.value) 
                  : formatNumber(kpi.value)}
                {kpi.name.includes('Rate') || kpi.name.includes('Score') ? '%' : ''}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  Target: {formatNumber(kpi.target)}
                  {kpi.name.includes('Rate') || kpi.name.includes('Score') ? '%' : ''}
                </span>
                <Badge variant={kpi.status === 'good' ? 'default' : kpi.status === 'warning' ? 'secondary' : 'destructive'}>
                  {kpi.status}
                </Badge>
              </div>
              <div className={`text-xs mt-1 ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}% {kpi.period}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
                <CardDescription>Revenue distribution by customer type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, revenue }) => `${segment}: ${formatCurrency(revenue)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
                <CardDescription>Growth rate and lifetime value by segment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={customerSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="growthRate" fill="#8884d8" name="Growth Rate %" />
                    <Line yAxisId="right" type="monotone" dataKey="ltv" stroke="#ff7300" name="LTV ($)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Segment Details</CardTitle>
              <CardDescription>Detailed breakdown of customer segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Segment</th>
                      <th className="text-right p-2">Customers</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Growth Rate</th>
                      <th className="text-right p-2">LTV</th>
                      <th className="text-right p-2">Revenue/Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSegments.map((segment, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{segment.segment}</td>
                        <td className="p-2 text-right">{formatNumber(segment.count)}</td>
                        <td className="p-2 text-right">{formatCurrency(segment.revenue)}</td>
                        <td className="p-2 text-right text-green-600">+{segment.growthRate}%</td>
                        <td className="p-2 text-right">{formatCurrency(segment.ltv)}</td>
                        <td className="p-2 text-right">{formatCurrency(segment.revenue / segment.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey from visitor to active user</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel dataKey="value" data={conversionFunnelData} isAnimationActive>
                      <LabelList position="center" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Channel</CardTitle>
                <CardDescription>Revenue distribution across channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueByChannelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {revenueByChannelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [
                      `${value}% (${formatCurrency(props.payload.revenue)})`,
                      name
                    ]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Analysis</CardTitle>
              <CardDescription>Performance comparison across key features</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={competitiveAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paypass" fill="#8884d8" name="PayPass" />
                  <Line type="monotone" dataKey="competitor1" stroke="#ff7300" name="Competitor A" />
                  <Line type="monotone" dataKey="competitor2" stroke="#00ff00" name="Competitor B" />
                  <Line type="monotone" dataKey="industry" stroke="#ff0000" strokeDasharray="3 3" name="Industry Avg" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {marketInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{insight.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{insight.current}%</div>
                      <div className="text-sm text-muted-foreground">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{insight.benchmark}%</div>
                      <div className="text-sm text-muted-foreground">Benchmark</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{insight.industry}%</div>
                      <div className="text-sm text-muted-foreground">Industry</div>
                    </div>
                    <div className="text-center">
                      <Badge variant={insight.current > insight.benchmark ? 'default' : 'secondary'}>
                        {insight.current > insight.benchmark ? 'Above Target' : 'Below Target'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm"><strong>Recommendation:</strong> {insight.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
