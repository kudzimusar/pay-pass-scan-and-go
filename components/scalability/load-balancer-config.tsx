'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Server, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Plus,
  Minus,
  RefreshCw,
  Globe,
  Database,
  Zap
} from 'lucide-react';

interface LoadBalancerInstance {
  id: string;
  name: string;
  type: 'application' | 'network' | 'global';
  status: 'healthy' | 'degraded' | 'down';
  region: string;
  targets: ServerTarget[];
  algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash';
  healthCheck: HealthCheckConfig;
  metrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  configuration: {
    stickySession: boolean;
    timeoutSeconds: number;
    retryAttempts: number;
    enableGzip: boolean;
  };
}

interface ServerTarget {
  id: string;
  host: string;
  port: number;
  weight: number;
  status: 'healthy' | 'unhealthy' | 'draining';
  metrics: {
    cpu: number;
    memory: number;
    activeConnections: number;
    responseTime: number;
  };
  region: string;
  instanceType: string;
}

interface HealthCheckConfig {
  protocol: 'http' | 'https' | 'tcp';
  path?: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}

interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  predictiveScaling: boolean;
}

const LoadBalancerConfig: React.FC = () => {
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancerInstance[]>([]);
  const [selectedLB, setSelectedLB] = useState<string | null>(null);
  const [autoScaling, setAutoScaling] = useState<AutoScalingConfig>({
    enabled: true,
    minInstances: 2,
    maxInstances: 10,
    targetCpuUtilization: 70,
    targetMemoryUtilization: 80,
    scaleUpCooldown: 300,
    scaleDownCooldown: 600,
    predictiveScaling: true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Mock data generation
  const generateMockData = (): LoadBalancerInstance[] => {
    return [
      {
        id: 'lb-1',
        name: 'Main Application LB',
        type: 'application',
        status: 'healthy',
        region: 'us-east-1',
        algorithm: 'round_robin',
        targets: [
          {
            id: 'target-1',
            host: '10.0.1.10',
            port: 8080,
            weight: 100,
            status: 'healthy',
            metrics: { cpu: 45, memory: 62, activeConnections: 150, responseTime: 120 },
            region: 'us-east-1a',
            instanceType: 't3.medium'
          },
          {
            id: 'target-2',
            host: '10.0.1.11',
            port: 8080,
            weight: 100,
            status: 'healthy',
            metrics: { cpu: 52, memory: 58, activeConnections: 180, responseTime: 95 },
            region: 'us-east-1b',
            instanceType: 't3.medium'
          },
          {
            id: 'target-3',
            host: '10.0.1.12',
            port: 8080,
            weight: 100,
            status: 'draining',
            metrics: { cpu: 25, memory: 40, activeConnections: 45, responseTime: 200 },
            region: 'us-east-1c',
            instanceType: 't3.medium'
          }
        ],
        healthCheck: {
          protocol: 'http',
          path: '/health',
          intervalSeconds: 30,
          timeoutSeconds: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3
        },
        metrics: {
          requestsPerSecond: 450,
          averageResponseTime: 125,
          errorRate: 0.8,
          activeConnections: 375
        },
        configuration: {
          stickySession: false,
          timeoutSeconds: 60,
          retryAttempts: 3,
          enableGzip: true
        }
      },
      {
        id: 'lb-2',
        name: 'API Gateway LB',
        type: 'application',
        status: 'healthy',
        region: 'us-west-2',
        algorithm: 'least_connections',
        targets: [
          {
            id: 'target-4',
            host: '10.1.1.10',
            port: 3000,
            weight: 100,
            status: 'healthy',
            metrics: { cpu: 38, memory: 55, activeConnections: 120, responseTime: 85 },
            region: 'us-west-2a',
            instanceType: 't3.large'
          },
          {
            id: 'target-5',
            host: '10.1.1.11',
            port: 3000,
            weight: 100,
            status: 'healthy',
            metrics: { cpu: 42, memory: 61, activeConnections: 135, responseTime: 92 },
            region: 'us-west-2b',
            instanceType: 't3.large'
          }
        ],
        healthCheck: {
          protocol: 'https',
          path: '/api/health',
          intervalSeconds: 10,
          timeoutSeconds: 3,
          healthyThreshold: 2,
          unhealthyThreshold: 2
        },
        metrics: {
          requestsPerSecond: 650,
          averageResponseTime: 88,
          errorRate: 0.3,
          activeConnections: 255
        },
        configuration: {
          stickySession: true,
          timeoutSeconds: 30,
          retryAttempts: 2,
          enableGzip: true
        }
      },
      {
        id: 'lb-3',
        name: 'Global CDN LB',
        type: 'global',
        status: 'healthy',
        region: 'global',
        algorithm: 'weighted',
        targets: [
          {
            id: 'target-6',
            host: 'us-east.cdn.paypass.com',
            port: 443,
            weight: 60,
            status: 'healthy',
            metrics: { cpu: 25, memory: 35, activeConnections: 2500, responseTime: 45 },
            region: 'us-east-1',
            instanceType: 'edge'
          },
          {
            id: 'target-7',
            host: 'eu-west.cdn.paypass.com',
            port: 443,
            weight: 30,
            status: 'healthy',
            metrics: { cpu: 20, memory: 30, activeConnections: 1200, responseTime: 38 },
            region: 'eu-west-1',
            instanceType: 'edge'
          },
          {
            id: 'target-8',
            host: 'ap-south.cdn.paypass.com',
            port: 443,
            weight: 10,
            status: 'healthy',
            metrics: { cpu: 15, memory: 25, activeConnections: 800, responseTime: 52 },
            region: 'ap-south-1',
            instanceType: 'edge'
          }
        ],
        healthCheck: {
          protocol: 'https',
          path: '/ping',
          intervalSeconds: 15,
          timeoutSeconds: 5,
          healthyThreshold: 3,
          unhealthyThreshold: 2
        },
        metrics: {
          requestsPerSecond: 2800,
          averageResponseTime: 42,
          errorRate: 0.1,
          activeConnections: 4500
        },
        configuration: {
          stickySession: false,
          timeoutSeconds: 45,
          retryAttempts: 3,
          enableGzip: true
        }
      }
    ];
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateMockData();
      setLoadBalancers(data);
      if (!selectedLB && data.length > 0) {
        setSelectedLB(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load load balancer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': case 'draining': return 'text-yellow-600';
      case 'down': case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800 border-green-200',
      degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draining: 'bg-orange-100 text-orange-800 border-orange-200',
      down: 'bg-red-100 text-red-800 border-red-200',
      unhealthy: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.down} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getLBTypeIcon = (type: LoadBalancerInstance['type']) => {
    switch (type) {
      case 'application': return <Server className="w-4 h-4" />;
      case 'network': return <Activity className="w-4 h-4" />;
      case 'global': return <Globe className="w-4 h-4" />;
    }
  };

  const addTarget = (lbId: string) => {
    setLoadBalancers(prev => prev.map(lb => {
      if (lb.id === lbId) {
        const newTarget: ServerTarget = {
          id: `target-${Date.now()}`,
          host: '10.0.1.20',
          port: 8080,
          weight: 100,
          status: 'healthy',
          metrics: { cpu: 30, memory: 45, activeConnections: 100, responseTime: 110 },
          region: 'us-east-1d',
          instanceType: 't3.medium'
        };
        return { ...lb, targets: [...lb.targets, newTarget] };
      }
      return lb;
    }));
  };

  const removeTarget = (lbId: string, targetId: string) => {
    setLoadBalancers(prev => prev.map(lb => {
      if (lb.id === lbId) {
        return { ...lb, targets: lb.targets.filter(t => t.id !== targetId) };
      }
      return lb;
    }));
  };

  const drainTarget = (lbId: string, targetId: string) => {
    setLoadBalancers(prev => prev.map(lb => {
      if (lb.id === lbId) {
        return {
          ...lb,
          targets: lb.targets.map(t => 
            t.id === targetId ? { ...t, status: 'draining' as const } : t
          )
        };
      }
      return lb;
    }));
  };

  const updateAutoScaling = (config: Partial<AutoScalingConfig>) => {
    setAutoScaling(prev => ({ ...prev, ...config }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedLoadBalancer = loadBalancers.find(lb => lb.id === selectedLB);

  if (isLoading && loadBalancers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading load balancer configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Load Balancer Configuration</h2>
          <p className="text-muted-foreground">Manage load balancers and auto-scaling settings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadData} disabled={isLoading} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Load Balancer
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Load Balancers</p>
                <p className="text-2xl font-bold">{loadBalancers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Targets</p>
                <p className="text-2xl font-bold">
                  {loadBalancers.reduce((sum, lb) => sum + lb.targets.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total RPS</p>
                <p className="text-2xl font-bold">
                  {loadBalancers.reduce((sum, lb) => sum + lb.metrics.requestsPerSecond, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(loadBalancers.reduce((sum, lb) => 
                    sum + (lb.metrics.averageResponseTime * lb.metrics.requestsPerSecond), 0) / 
                    loadBalancers.reduce((sum, lb) => sum + lb.metrics.requestsPerSecond, 0)
                  )}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load Balancer List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Load Balancers</h3>
          {loadBalancers.map((lb) => (
            <Card 
              key={lb.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedLB === lb.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedLB(lb.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLBTypeIcon(lb.type)}
                    <span className="font-medium">{lb.name}</span>
                  </div>
                  {getStatusBadge(lb.status)}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Region: {lb.region}</p>
                  <p>Algorithm: {lb.algorithm}</p>
                  <p>Targets: {lb.targets.length} ({lb.targets.filter(t => t.status === 'healthy').length} healthy)</p>
                  <p>RPS: {lb.metrics.requestsPerSecond}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load Balancer Details */}
        <div className="lg:col-span-2">
          {selectedLoadBalancer && (
            <Tabs defaultValue="targets" className="space-y-4">
              <TabsList>
                <TabsTrigger value="targets">Targets</TabsTrigger>
                <TabsTrigger value="health">Health Checks</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="autoscaling">Auto Scaling</TabsTrigger>
              </TabsList>

              <TabsContent value="targets" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Target Servers</h4>
                  <Button size="sm" onClick={() => addTarget(selectedLoadBalancer.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Target
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedLoadBalancer.targets.map((target) => (
                    <Card key={target.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{target.host}:{target.port}</span>
                            {getStatusBadge(target.status)}
                            <Badge variant="outline">{target.instanceType}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {target.status === 'healthy' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => drainTarget(selectedLoadBalancer.id, target.id)}
                              >
                                Drain
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeTarget(selectedLoadBalancer.id, target.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">CPU</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={target.metrics.cpu} className="h-2 flex-1" />
                              <span className="font-medium">{target.metrics.cpu}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Memory</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={target.metrics.memory} className="h-2 flex-1" />
                              <span className="font-medium">{target.metrics.memory}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Connections</p>
                            <p className="font-medium">{target.metrics.activeConnections}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Response Time</p>
                            <p className="font-medium">{target.metrics.responseTime}ms</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Health Check Configuration</CardTitle>
                    <CardDescription>Configure health checks for target detection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="protocol">Protocol</Label>
                        <Select value={selectedLoadBalancer.healthCheck.protocol}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="tcp">TCP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="path">Path</Label>
                        <Input 
                          id="path" 
                          value={selectedLoadBalancer.healthCheck.path || ''} 
                          placeholder="/health"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="interval">Interval (seconds)</Label>
                        <Input 
                          id="interval" 
                          type="number" 
                          value={selectedLoadBalancer.healthCheck.intervalSeconds}
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeout">Timeout (seconds)</Label>
                        <Input 
                          id="timeout" 
                          type="number" 
                          value={selectedLoadBalancer.healthCheck.timeoutSeconds}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="healthy-threshold">Healthy Threshold</Label>
                        <Input 
                          id="healthy-threshold" 
                          type="number" 
                          value={selectedLoadBalancer.healthCheck.healthyThreshold}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unhealthy-threshold">Unhealthy Threshold</Label>
                        <Input 
                          id="unhealthy-threshold" 
                          type="number" 
                          value={selectedLoadBalancer.healthCheck.unhealthyThreshold}
                        />
                      </div>
                    </div>

                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Update Health Check
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Load Balancer Configuration</CardTitle>
                    <CardDescription>Adjust load balancing behavior and settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="algorithm">Algorithm</Label>
                        <Select value={selectedLoadBalancer.algorithm}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round_robin">Round Robin</SelectItem>
                            <SelectItem value="least_connections">Least Connections</SelectItem>
                            <SelectItem value="weighted">Weighted</SelectItem>
                            <SelectItem value="ip_hash">IP Hash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timeout">Timeout (seconds)</Label>
                        <Input 
                          id="timeout" 
                          type="number" 
                          value={selectedLoadBalancer.configuration.timeoutSeconds}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="retries">Retry Attempts</Label>
                        <Input 
                          id="retries" 
                          type="number" 
                          value={selectedLoadBalancer.configuration.retryAttempts}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="sticky-sessions"
                          checked={selectedLoadBalancer.configuration.stickySession}
                          className="rounded"
                        />
                        <Label htmlFor="sticky-sessions">Enable Sticky Sessions</Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="gzip"
                        checked={selectedLoadBalancer.configuration.enableGzip}
                        className="rounded"
                      />
                      <Label htmlFor="gzip">Enable GZIP Compression</Label>
                    </div>

                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Update Configuration
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="autoscaling" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Auto Scaling Configuration</CardTitle>
                    <CardDescription>Configure automatic scaling based on metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="enable-autoscaling"
                        checked={autoScaling.enabled}
                        onChange={(e) => updateAutoScaling({ enabled: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="enable-autoscaling">Enable Auto Scaling</Label>
                    </div>

                    {autoScaling.enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="min-instances">Min Instances</Label>
                            <Input 
                              id="min-instances" 
                              type="number" 
                              value={autoScaling.minInstances}
                              onChange={(e) => updateAutoScaling({ minInstances: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max-instances">Max Instances</Label>
                            <Input 
                              id="max-instances" 
                              type="number" 
                              value={autoScaling.maxInstances}
                              onChange={(e) => updateAutoScaling({ maxInstances: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cpu-target">Target CPU Utilization (%)</Label>
                            <Input 
                              id="cpu-target" 
                              type="number" 
                              value={autoScaling.targetCpuUtilization}
                              onChange={(e) => updateAutoScaling({ targetCpuUtilization: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="memory-target">Target Memory Utilization (%)</Label>
                            <Input 
                              id="memory-target" 
                              type="number" 
                              value={autoScaling.targetMemoryUtilization}
                              onChange={(e) => updateAutoScaling({ targetMemoryUtilization: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="scale-up-cooldown">Scale Up Cooldown (seconds)</Label>
                            <Input 
                              id="scale-up-cooldown" 
                              type="number" 
                              value={autoScaling.scaleUpCooldown}
                              onChange={(e) => updateAutoScaling({ scaleUpCooldown: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="scale-down-cooldown">Scale Down Cooldown (seconds)</Label>
                            <Input 
                              id="scale-down-cooldown" 
                              type="number" 
                              value={autoScaling.scaleDownCooldown}
                              onChange={(e) => updateAutoScaling({ scaleDownCooldown: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="predictive-scaling"
                            checked={autoScaling.predictiveScaling}
                            onChange={(e) => updateAutoScaling({ predictiveScaling: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="predictive-scaling">Enable Predictive Scaling</Label>
                        </div>
                      </>
                    )}

                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Update Auto Scaling
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadBalancerConfig;
