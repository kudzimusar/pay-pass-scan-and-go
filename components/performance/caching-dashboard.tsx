'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Trash2
} from 'lucide-react';

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  hitCount: number;
  missCount: number;
  avgResponseTime: number;
  cacheSize: number;
  maxCacheSize: number;
  evictionCount: number;
  lastEviction: string;
}

interface CacheInstance {
  id: string;
  name: string;
  type: 'redis' | 'memory' | 'disk' | 'cdn';
  status: 'healthy' | 'degraded' | 'down';
  metrics: CacheMetrics;
  config: {
    ttl: number;
    maxSize: string;
    evictionPolicy: string;
  };
}

interface CachePerformanceData {
  instances: CacheInstance[];
  globalMetrics: {
    totalHitRate: number;
    totalCacheSize: string;
    totalSavings: string;
    performanceGain: number;
  };
  recommendations: Array<{
    type: 'optimization' | 'configuration' | 'scaling';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
  }>;
}

const CachingDashboard: React.FC = () => {
  const [cacheData, setCacheData] = useState<CachePerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Mock cache data - in real implementation, fetch from API
  const generateMockCacheData = (): CachePerformanceData => {
    const instances: CacheInstance[] = [
      {
        id: 'redis-main',
        name: 'Redis Main Cache',
        type: 'redis',
        status: 'healthy',
        metrics: {
          hitRate: 92.5,
          missRate: 7.5,
          totalRequests: 45000,
          hitCount: 41625,
          missCount: 3375,
          avgResponseTime: 2.3,
          cacheSize: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
          maxCacheSize: 2 * 1024 * 1024 * 1024, // 2 GB
          evictionCount: 125,
          lastEviction: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        config: {
          ttl: 3600,
          maxSize: '2GB',
          evictionPolicy: 'LRU'
        }
      },
      {
        id: 'redis-session',
        name: 'Redis Session Store',
        type: 'redis',
        status: 'healthy',
        metrics: {
          hitRate: 98.2,
          missRate: 1.8,
          totalRequests: 12000,
          hitCount: 11784,
          missCount: 216,
          avgResponseTime: 1.1,
          cacheSize: 512 * 1024 * 1024, // 512 MB
          maxCacheSize: 1024 * 1024 * 1024, // 1 GB
          evictionCount: 45,
          lastEviction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        config: {
          ttl: 1800,
          maxSize: '1GB',
          evictionPolicy: 'LRU'
        }
      },
      {
        id: 'memory-api',
        name: 'API Response Cache',
        type: 'memory',
        status: 'healthy',
        metrics: {
          hitRate: 85.3,
          missRate: 14.7,
          totalRequests: 28000,
          hitCount: 23884,
          missCount: 4116,
          avgResponseTime: 0.8,
          cacheSize: 256 * 1024 * 1024, // 256 MB
          maxCacheSize: 512 * 1024 * 1024, // 512 MB
          evictionCount: 890,
          lastEviction: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        config: {
          ttl: 300,
          maxSize: '512MB',
          evictionPolicy: 'LFU'
        }
      },
      {
        id: 'cdn-static',
        name: 'CDN Static Assets',
        type: 'cdn',
        status: 'healthy',
        metrics: {
          hitRate: 96.8,
          missRate: 3.2,
          totalRequests: 150000,
          hitCount: 145200,
          missCount: 4800,
          avgResponseTime: 45.2,
          cacheSize: 5.5 * 1024 * 1024 * 1024, // 5.5 GB
          maxCacheSize: 10 * 1024 * 1024 * 1024, // 10 GB
          evictionCount: 12,
          lastEviction: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        config: {
          ttl: 86400,
          maxSize: '10GB',
          evictionPolicy: 'TTL'
        }
      }
    ];

    const totalHitRate = instances.reduce((sum, inst) => 
      sum + (inst.metrics.hitRate * inst.metrics.totalRequests), 0) / 
      instances.reduce((sum, inst) => sum + inst.metrics.totalRequests, 0);

    const totalCacheSize = instances.reduce((sum, inst) => sum + inst.metrics.cacheSize, 0);

    return {
      instances,
      globalMetrics: {
        totalHitRate: Math.round(totalHitRate * 100) / 100,
        totalCacheSize: `${(totalCacheSize / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        totalSavings: '$2,450/month',
        performanceGain: 78.5
      },
      recommendations: [
        {
          type: 'optimization',
          priority: 'medium',
          title: 'Optimize API Cache TTL',
          description: 'API response cache has lower hit rate. Consider increasing TTL for frequently accessed endpoints.',
          impact: 'Could improve hit rate by 8-12%'
        },
        {
          type: 'configuration',
          priority: 'low',
          title: 'Review Eviction Policies',
          description: 'Memory cache is experiencing high eviction rate. Consider LRU policy for better performance.',
          impact: 'Reduce eviction rate by 30%'
        },
        {
          type: 'scaling',
          priority: 'high',
          title: 'Scale Redis Main Cache',
          description: 'Main Redis cache is at 60% capacity. Plan for scaling before reaching 80%.',
          impact: 'Prevent performance degradation'
        }
      ]
    };
  };

  const loadCacheData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateMockCacheData();
      setCacheData(data);
    } catch (error) {
      console.error('Failed to load cache data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadCacheData();
  };

  const startAutoRefresh = () => {
    if (refreshInterval) clearInterval(refreshInterval);
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCacheTypeIcon = (type: CacheInstance['type']) => {
    switch (type) {
      case 'redis': return <Database className="w-4 h-4" />;
      case 'memory': return <Zap className="w-4 h-4" />;
      case 'disk': return <Database className="w-4 h-4" />;
      case 'cdn': return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: CacheInstance['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
    }
  };

  const getStatusBadge = (status: CacheInstance['status']) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      down: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[status]} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const clearCache = async (instanceId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to clear cache
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCacheData(); // Refresh data after clearing
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCacheData();
    startAutoRefresh();
    
    return () => stopAutoRefresh();
  }, []);

  if (!cacheData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading cache performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Performance Dashboard</h2>
          <p className="text-muted-foreground">Monitor and optimize caching performance across all services</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={refreshData} 
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={refreshInterval ? stopAutoRefresh : startAutoRefresh}
            size="sm"
            variant={refreshInterval ? "secondary" : "outline"}
          >
            <Clock className="w-4 h-4 mr-2" />
            {refreshInterval ? 'Stop Auto-refresh' : 'Auto-refresh'}
          </Button>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Global Hit Rate</p>
                <p className="text-2xl font-bold text-green-600">{cacheData.globalMetrics.totalHitRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cache Size</p>
                <p className="text-2xl font-bold">{cacheData.globalMetrics.totalCacheSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance Gain</p>
                <p className="text-2xl font-bold text-purple-600">{cacheData.globalMetrics.performanceGain}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold text-orange-600">{cacheData.globalMetrics.totalSavings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances">Cache Instances</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cacheData.instances.map((instance) => (
              <Card key={instance.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCacheTypeIcon(instance.type)}
                      <CardTitle className="text-lg">{instance.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(instance.status)}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => clearCache(instance.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {instance.type.charAt(0).toUpperCase() + instance.type.slice(1)} Cache • 
                    TTL: {instance.config.ttl}s • 
                    Policy: {instance.config.evictionPolicy}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hit Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Hit Rate</span>
                      <span className="text-sm font-bold text-green-600">{instance.metrics.hitRate}%</span>
                    </div>
                    <Progress value={instance.metrics.hitRate} className="h-2" />
                  </div>

                  {/* Cache Utilization */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cache Utilization</span>
                      <span className="text-sm">
                        {formatBytes(instance.metrics.cacheSize)} / {instance.config.maxSize}
                      </span>
                    </div>
                    <Progress 
                      value={(instance.metrics.cacheSize / instance.metrics.maxCacheSize) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Requests</p>
                      <p className="font-semibold">{instance.metrics.totalRequests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Response Time</p>
                      <p className="font-semibold">{instance.metrics.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hit Count</p>
                      <p className="font-semibold text-green-600">{instance.metrics.hitCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Miss Count</p>
                      <p className="font-semibold text-red-600">{instance.metrics.missCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Evictions</p>
                      <p className="font-semibold">{instance.metrics.evictionCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Eviction</p>
                      <p className="font-semibold">{new Date(instance.metrics.lastEviction).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hit Rate Comparison</CardTitle>
                <CardDescription>Cache efficiency across all instances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cacheData.instances.map((instance) => (
                  <div key={instance.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{instance.name}</span>
                      <span className="text-sm font-bold">{instance.metrics.hitRate}%</span>
                    </div>
                    <Progress value={instance.metrics.hitRate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
                <CardDescription>Average response times by cache type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cacheData.instances.map((instance) => (
                  <div key={instance.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{instance.name}</span>
                      <span className="text-sm font-bold">{instance.metrics.avgResponseTime}ms</span>
                    </div>
                    <Progress 
                      value={Math.min((instance.metrics.avgResponseTime / 100) * 100, 100)} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {cacheData.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {rec.priority === 'high' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      {rec.priority === 'medium' && <Clock className="w-5 h-5 text-yellow-600" />}
                      {rec.priority === 'low' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge 
                          variant="outline"
                          className={
                            rec.priority === 'high' ? 'border-red-200 text-red-700' :
                            rec.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{rec.description}</p>
                      <p className="text-sm font-medium text-blue-600">Impact: {rec.impact}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CachingDashboard;
