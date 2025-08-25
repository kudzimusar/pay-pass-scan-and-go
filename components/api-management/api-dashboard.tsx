"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Code,
  Download,
  ExternalLink,
  Globe,
  Key,
  Layers,
  LineChart,
  Lock,
  Monitor,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  activeEndpoints: number;
}

interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  version: string;
  status: 'active' | 'deprecated' | 'beta' | 'maintenance';
  requests24h: number;
  avgResponseTime: number;
  errorRate: number;
  lastUsed: string;
  rateLimit: {
    limit: number;
    window: string;
    current: number;
  };
}

export default function APIManagementDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [metrics, setMetrics] = useState<APIMetrics | null>(null);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock API data
  const mockMetrics: APIMetrics = {
    totalRequests: 2456789,
    successfulRequests: 2398456,
    failedRequests: 58333,
    averageResponseTime: 127,
    throughput: 850,
    errorRate: 2.37,
    uptime: 99.94,
    activeEndpoints: 47
  };

  const mockEndpoints: APIEndpoint[] = [
    {
      id: 'ep_001',
      path: '/api/v1/payments',
      method: 'POST',
      version: 'v1',
      status: 'active',
      requests24h: 145678,
      avgResponseTime: 89,
      errorRate: 1.2,
      lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      rateLimit: { limit: 1000, window: '1h', current: 756 }
    },
    {
      id: 'ep_002',
      path: '/api/v1/users',
      method: 'GET',
      version: 'v1',
      status: 'active',
      requests24h: 89345,
      avgResponseTime: 45,
      errorRate: 0.8,
      lastUsed: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      rateLimit: { limit: 5000, window: '1h', current: 2345 }
    },
    {
      id: 'ep_003',
      path: '/api/v2/transactions',
      method: 'GET',
      version: 'v2',
      status: 'beta',
      requests24h: 12456,
      avgResponseTime: 156,
      errorRate: 3.2,
      lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      rateLimit: { limit: 100, window: '1h', current: 67 }
    },
    {
      id: 'ep_004',
      path: '/api/v1/auth/login',
      method: 'POST',
      version: 'v1',
      status: 'active',
      requests24h: 67890,
      avgResponseTime: 234,
      errorRate: 5.1,
      lastUsed: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      rateLimit: { limit: 100, window: '15m', current: 23 }
    },
    {
      id: 'ep_005',
      path: '/api/v1/wallets',
      method: 'GET',
      version: 'v1',
      status: 'active',
      requests24h: 34567,
      avgResponseTime: 78,
      errorRate: 1.5,
      lastUsed: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      rateLimit: { limit: 1000, window: '1h', current: 456 }
    }
  ];

  const requestsData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    requests: Math.floor(Math.random() * 5000) + 15000,
    errors: Math.floor(Math.random() * 200) + 50,
    responseTime: Math.floor(Math.random() * 100) + 80
  }));

  const performanceData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uptime: 99.5 + Math.random() * 0.5,
      avgResponseTime: 100 + Math.random() * 50,
      throughput: 800 + Math.random() * 200,
      errorRate: Math.random() * 3
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics(mockMetrics);
      setEndpoints(mockEndpoints);
      setIsLoading(false);
    };

    fetchData();
  }, [selectedPeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'beta':
        return 'bg-blue-100 text-blue-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading API dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p>Failed to load API metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            API Management Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor, manage, and optimize your API ecosystem
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalRequests)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.throughput)} req/min current
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.failedRequests)} failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt; 200ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeEndpoints} active endpoints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>API requests over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={requestsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stackId="2"
                      stroke="#ff6b6b"
                      fill="#ff6b6b"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Average response time over 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Gateway</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limiter</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Balancer</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {endpoints.slice(0, 5).map((endpoint) => (
                    <div key={endpoint.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{endpoint.path}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getMethodColor(endpoint.method)} variant="outline">
                            {endpoint.method}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(endpoint.requests24h)} req
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{endpoint.avgResponseTime}ms</p>
                        <p className="text-xs text-muted-foreground">{endpoint.errorRate}% err</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Rate limit approaching</p>
                      <p className="text-xs text-muted-foreground">
                        /api/v1/payments endpoint at 75% capacity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">New API version deployed</p>
                      <p className="text-xs text-muted-foreground">
                        v2.1.0 is now live with enhanced features
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">High error rate detected</p>
                      <p className="text-xs text-muted-foreground">
                        /api/v1/auth/login showing 5.1% errors
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Manage and monitor your API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input placeholder="Search endpoints..." className="max-w-sm" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Code className="h-4 w-4 mr-2" />
                    Add Endpoint
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4">Endpoint</th>
                        <th className="text-left p-4">Method</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">24h Requests</th>
                        <th className="text-left p-4">Avg Response</th>
                        <th className="text-left p-4">Error Rate</th>
                        <th className="text-left p-4">Rate Limit</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoints.map((endpoint) => (
                        <tr key={endpoint.id} className="border-t">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{endpoint.path}</p>
                              <p className="text-sm text-muted-foreground">
                                Version {endpoint.version}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getMethodColor(endpoint.method)} variant="outline">
                              {endpoint.method}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(endpoint.status)} variant="outline">
                              {endpoint.status}
                            </Badge>
                          </td>
                          <td className="p-4">{formatNumber(endpoint.requests24h)}</td>
                          <td className="p-4">{endpoint.avgResponseTime}ms</td>
                          <td className="p-4">
                            <span className={endpoint.errorRate > 3 ? 'text-red-600' : 'text-green-600'}>
                              {endpoint.errorRate}%
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <Progress 
                                value={(endpoint.rateLimit.current / endpoint.rateLimit.limit) * 100} 
                                className="h-2 w-16"
                              />
                              <p className="text-xs text-muted-foreground">
                                {endpoint.rateLimit.current}/{endpoint.rateLimit.limit}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Monitor className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="throughput"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Throughput (req/min)"
                    />
                    <Line
                      type="monotone"
                      dataKey="errorRate"
                      stroke="#ff6b6b"
                      strokeWidth={2}
                      name="Error Rate (%)"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage by Version</CardTitle>
                <CardDescription>API version adoption</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'v1', value: 78, color: '#8884d8' },
                        { name: 'v2', value: 18, color: '#82ca9d' },
                        { name: 'v3 (beta)', value: 4, color: '#ffc658' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'v1', value: 78, color: '#8884d8' },
                        { name: 'v2', value: 18, color: '#82ca9d' },
                        { name: 'v3 (beta)', value: 4, color: '#ffc658' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>API security monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4" />
                      <span>API Keys Active</span>
                    </div>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Auth Failures (24h)</span>
                    </div>
                    <span className="font-semibold text-yellow-600">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Blocked IPs</span>
                    </div>
                    <span className="font-semibold text-red-600">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Rate Limited Requests</span>
                    </div>
                    <span className="font-semibold">456</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Recent security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Suspicious activity detected</p>
                      <p className="text-xs text-muted-foreground">
                        Multiple failed auth attempts from IP 192.168.1.100
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">API key rotation due</p>
                      <p className="text-xs text-muted-foreground">
                        15 keys expire within 30 days
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Interactive API documentation and testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Documentation
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download OpenAPI Spec
                  </Button>
                  <Button variant="outline">
                    <Code className="h-4 w-4 mr-2" />
                    Try API Console
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Layers className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Getting Started</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quick start guide and authentication setup
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Code className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Code Examples</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sample code in multiple programming languages
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">Webhooks</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Real-time event notifications
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
