"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  AlertTriangle,
  Clock,
  Edit,
  Filter,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  Users,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  limit: number;
  window: string;
  windowMs: number;
  currentUsage: number;
  status: 'active' | 'inactive' | 'breached';
  clientType: 'all' | 'authenticated' | 'anonymous' | 'premium';
  resetTime: string;
  createdAt: string;
  lastTriggered?: string;
}

interface RateLimitViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  clientId: string;
  clientIP: string;
  endpoint: string;
  requestCount: number;
  limit: number;
  timestamp: string;
  action: 'blocked' | 'throttled' | 'warned';
  duration: number;
}

export default function RateLimitingDashboard() {
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [selectedRule, setSelectedRule] = useState<RateLimitRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  const mockRules: RateLimitRule[] = [
    {
      id: 'rule_001',
      name: 'Payment API Rate Limit',
      endpoint: '/api/v1/payments',
      method: 'POST',
      limit: 100,
      window: '1 hour',
      windowMs: 3600000,
      currentUsage: 67,
      status: 'active',
      clientType: 'authenticated',
      resetTime: new Date(Date.now() + 2000000).toISOString(),
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'rule_002',
      name: 'Auth API Rate Limit',
      endpoint: '/api/v1/auth/login',
      method: 'POST',
      limit: 10,
      window: '15 minutes',
      windowMs: 900000,
      currentUsage: 8,
      status: 'active',
      clientType: 'all',
      resetTime: new Date(Date.now() + 500000).toISOString(),
      createdAt: '2024-01-15T10:00:00Z',
      lastTriggered: '2024-01-20T14:30:00Z'
    },
    {
      id: 'rule_003',
      name: 'User Data API Rate Limit',
      endpoint: '/api/v1/users',
      method: 'GET',
      limit: 1000,
      window: '1 hour',
      windowMs: 3600000,
      currentUsage: 456,
      status: 'active',
      clientType: 'authenticated',
      resetTime: new Date(Date.now() + 1800000).toISOString(),
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'rule_004',
      name: 'Premium API Access',
      endpoint: '/api/v2/*',
      method: 'ALL',
      limit: 5000,
      window: '1 hour',
      windowMs: 3600000,
      currentUsage: 1234,
      status: 'active',
      clientType: 'premium',
      resetTime: new Date(Date.now() + 2700000).toISOString(),
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'rule_005',
      name: 'Public API Rate Limit',
      endpoint: '/api/v1/public/*',
      method: 'GET',
      limit: 50,
      window: '1 hour',
      windowMs: 3600000,
      currentUsage: 49,
      status: 'breached',
      clientType: 'anonymous',
      resetTime: new Date(Date.now() + 300000).toISOString(),
      createdAt: '2024-01-15T10:00:00Z',
      lastTriggered: '2024-01-20T15:45:00Z'
    }
  ];

  const mockViolations: RateLimitViolation[] = [
    {
      id: 'violation_001',
      ruleId: 'rule_002',
      ruleName: 'Auth API Rate Limit',
      clientId: 'client_123',
      clientIP: '192.168.1.100',
      endpoint: '/api/v1/auth/login',
      requestCount: 15,
      limit: 10,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      action: 'blocked',
      duration: 900000
    },
    {
      id: 'violation_002',
      ruleId: 'rule_005',
      ruleName: 'Public API Rate Limit',
      clientId: 'anonymous',
      clientIP: '203.0.113.42',
      endpoint: '/api/v1/public/info',
      requestCount: 75,
      limit: 50,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      action: 'throttled',
      duration: 3600000
    },
    {
      id: 'violation_003',
      ruleId: 'rule_001',
      ruleName: 'Payment API Rate Limit',
      clientId: 'client_456',
      clientIP: '198.51.100.25',
      endpoint: '/api/v1/payments',
      requestCount: 125,
      limit: 100,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      action: 'warned',
      duration: 0
    }
  ];

  const usageData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    requests: Math.floor(Math.random() * 1000) + 500,
    blocked: Math.floor(Math.random() * 50) + 10,
    throttled: Math.floor(Math.random() * 30) + 5
  }));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRules(mockRules);
      setViolations(mockViolations);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'breached':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientTypeColor = (clientType: string) => {
    switch (clientType) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'authenticated':
        return 'bg-blue-100 text-blue-800';
      case 'anonymous':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'throttled':
        return 'bg-yellow-100 text-yellow-800';
      case 'warned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTimeRemaining = (isoString: string) => {
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const createNewRule = () => {
    const newRule: RateLimitRule = {
      id: `rule_${Date.now()}`,
      name: 'New Rate Limit Rule',
      endpoint: '/api/v1/*',
      method: 'ALL',
      limit: 100,
      window: '1 hour',
      windowMs: 3600000,
      currentUsage: 0,
      status: 'active',
      clientType: 'authenticated',
      resetTime: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString()
    };
    
    setRules(prev => [...prev, newRule]);
    setSelectedRule(newRule);
    setIsCreating(true);
  };

  const updateRule = (updatedRule: RateLimitRule) => {
    setRules(prev => prev.map(rule => 
      rule.id === updatedRule.id ? updatedRule : rule
    ));
    setSelectedRule(null);
    setIsCreating(false);
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading rate limiting dashboard...</p>
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
            <Shield className="h-8 w-8" />
            Rate Limiting Dashboard
          </h1>
          <p className="text-muted-foreground">
            Configure and monitor API rate limiting policies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </Button>
          <Button onClick={createNewRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.filter(r => r.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {rules.filter(r => r.status === 'breached').length} breached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {violations.filter(v => v.action === 'blocked').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throttled Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {violations.filter(v => v.action === 'throttled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(rules.reduce((sum, rule) => sum + (rule.currentUsage / rule.limit), 0) / rules.length * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Rate Limit Rules</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Rules</CardTitle>
                <CardDescription>Configure API rate limiting policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRule?.id === rule.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRule(rule)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(rule.status)} variant="outline">
                            {rule.status}
                          </Badge>
                          <Badge className={getClientTypeColor(rule.clientType)} variant="outline">
                            {rule.clientType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {rule.method} {rule.endpoint}
                          </span>
                          <span>{rule.limit} / {rule.window}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Usage</span>
                            <span>{rule.currentUsage} / {rule.limit}</span>
                          </div>
                          <Progress value={(rule.currentUsage / rule.limit) * 100} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Resets in: {formatTimeRemaining(rule.resetTime)}</span>
                          {rule.lastTriggered && (
                            <span>Last triggered: {new Date(rule.lastTriggered).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedRule ? 'Edit Rule' : isCreating ? 'Create Rule' : 'Select a Rule'}
                </CardTitle>
                <CardDescription>
                  {selectedRule ? 'Modify rate limiting configuration' : isCreating ? 'Configure new rate limit rule' : 'Choose a rule to view or edit'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRule ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        value={selectedRule.name}
                        onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="endpoint">Endpoint Pattern</Label>
                        <Input
                          id="endpoint"
                          value={selectedRule.endpoint}
                          onChange={(e) => setSelectedRule({ ...selectedRule, endpoint: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="method">HTTP Method</Label>
                        <Select
                          value={selectedRule.method}
                          onValueChange={(value) => setSelectedRule({ ...selectedRule, method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">ALL</SelectItem>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="limit">Request Limit</Label>
                        <Input
                          id="limit"
                          type="number"
                          value={selectedRule.limit}
                          onChange={(e) => setSelectedRule({ ...selectedRule, limit: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="window">Time Window</Label>
                        <Select
                          value={selectedRule.window}
                          onValueChange={(value) => setSelectedRule({ ...selectedRule, window: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1 minute">1 minute</SelectItem>
                            <SelectItem value="15 minutes">15 minutes</SelectItem>
                            <SelectItem value="1 hour">1 hour</SelectItem>
                            <SelectItem value="1 day">1 day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="client-type">Client Type</Label>
                      <Select
                        value={selectedRule.clientType}
                        onValueChange={(value) => setSelectedRule({ ...selectedRule, clientType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Clients</SelectItem>
                          <SelectItem value="authenticated">Authenticated</SelectItem>
                          <SelectItem value="anonymous">Anonymous</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="rule-status"
                        checked={selectedRule.status === 'active'}
                        onCheckedChange={(checked) => 
                          setSelectedRule({ ...selectedRule, status: checked ? 'active' : 'inactive' })
                        }
                      />
                      <Label htmlFor="rule-status">Enable Rule</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4">
                      <Button onClick={() => updateRule(selectedRule)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedRule(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteRule(selectedRule.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a rule from the list to edit its configuration</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Violations</CardTitle>
              <CardDescription>Recent violations and blocked requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input placeholder="Search violations..." className="max-w-sm" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="throttled">Throttled</SelectItem>
                      <SelectItem value="warned">Warned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4">Timestamp</th>
                        <th className="text-left p-4">Rule</th>
                        <th className="text-left p-4">Client</th>
                        <th className="text-left p-4">Endpoint</th>
                        <th className="text-left p-4">Requests</th>
                        <th className="text-left p-4">Action</th>
                        <th className="text-left p-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map((violation) => (
                        <tr key={violation.id} className="border-t">
                          <td className="p-4">
                            {new Date(violation.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{violation.ruleName}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{violation.clientId}</p>
                              <p className="text-sm text-muted-foreground">{violation.clientIP}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {violation.endpoint}
                            </code>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-red-600">
                              {violation.requestCount}
                            </span>
                            <span className="text-muted-foreground"> / {violation.limit}</span>
                          </td>
                          <td className="p-4">
                            <Badge className={getActionColor(violation.action)} variant="outline">
                              {violation.action}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {violation.duration > 0 ? 
                              `${Math.round(violation.duration / 60000)}m` : 
                              'N/A'
                            }
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
                <CardTitle>Rate Limit Usage</CardTitle>
                <CardDescription>Request patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData}>
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
                      dataKey="blocked"
                      stackId="2"
                      stroke="#ff6b6b"
                      fill="#ff6b6b"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="throttled"
                      stackId="3"
                      stroke="#ffa726"
                      fill="#ffa726"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rule Effectiveness</CardTitle>
                <CardDescription>Rule performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rules.map(rule => ({
                    name: rule.name.substring(0, 15) + '...',
                    usage: (rule.currentUsage / rule.limit) * 100,
                    violations: violations.filter(v => v.ruleId === rule.id).length
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Rate Limiting Settings</CardTitle>
              <CardDescription>Configure system-wide rate limiting behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-action">Default Action for Violations</Label>
                  <Select defaultValue="throttle">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block Request</SelectItem>
                      <SelectItem value="throttle">Throttle Request</SelectItem>
                      <SelectItem value="warn">Warn Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="enable-logging" defaultChecked />
                  <Label htmlFor="enable-logging">Enable Violation Logging</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="enable-notifications" defaultChecked />
                  <Label htmlFor="enable-notifications">Send Alert Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="enable-metrics" defaultChecked />
                  <Label htmlFor="enable-metrics">Collect Performance Metrics</Label>
                </div>

                <div>
                  <Label htmlFor="notification-threshold">Notification Threshold (%)</Label>
                  <Input
                    id="notification-threshold"
                    type="number"
                    defaultValue="80"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label htmlFor="cleanup-period">Log Cleanup Period (days)</Label>
                  <Input
                    id="cleanup-period"
                    type="number"
                    defaultValue="30"
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
