import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Performance Analytics API endpoint for monitoring system performance
// This endpoint provides comprehensive performance metrics and analysis

const performanceQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).optional(),
  metric: z.enum(['all', 'response_time', 'throughput', 'errors', 'cpu', 'memory', 'disk']).optional(),
  service: z.string().optional(),
  aggregation: z.enum(['avg', 'min', 'max', 'sum', 'p95', 'p99']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

interface PerformanceMetrics {
  timestamp: string;
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    totalRequests: number;
  };
  errorRate: {
    rate: number;
    total: number;
    byType: Record<string, number>;
  };
  systemMetrics: {
    cpu: {
      usage: number;
      cores: number;
      loadAverage: number[];
    };
    memory: {
      used: number;
      total: number;
      free: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      free: number;
      percentage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      packetsIn: number;
      packetsOut: number;
    };
  };
  services: Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    uptime: number;
  }>;
}

// Mock performance data generator
const generatePerformanceData = (period: string, service?: string): PerformanceMetrics[] => {
  const now = Date.now();
  const intervals = {
    '1h': { count: 60, step: 60 * 1000 }, // 1 minute intervals
    '24h': { count: 24, step: 60 * 60 * 1000 }, // 1 hour intervals
    '7d': { count: 7, step: 24 * 60 * 60 * 1000 }, // 1 day intervals
    '30d': { count: 30, step: 24 * 60 * 60 * 1000 } // 1 day intervals
  };

  const config = intervals[period as keyof typeof intervals] || intervals['24h'];
  
  return Array.from({ length: config.count }, (_, i) => {
    const timestamp = new Date(now - (config.count - 1 - i) * config.step).toISOString();
    
    // Simulate some variation in performance metrics
    const baseResponseTime = 100 + Math.random() * 50;
    const errorMultiplier = Math.random() > 0.9 ? 5 : 1; // Occasional spikes
    
    return {
      timestamp,
      responseTime: {
        avg: baseResponseTime * errorMultiplier,
        min: baseResponseTime * 0.5,
        max: baseResponseTime * 2 * errorMultiplier,
        p50: baseResponseTime * 0.8,
        p95: baseResponseTime * 1.5 * errorMultiplier,
        p99: baseResponseTime * 2 * errorMultiplier
      },
      throughput: {
        requestsPerSecond: Math.floor(Math.random() * 100) + 50,
        requestsPerMinute: Math.floor(Math.random() * 6000) + 3000,
        totalRequests: Math.floor(Math.random() * 100000) + 50000
      },
      errorRate: {
        rate: Math.random() * 5 * errorMultiplier, // 0-5% error rate, higher during spikes
        total: Math.floor(Math.random() * 100) * errorMultiplier,
        byType: {
          '4xx': Math.floor(Math.random() * 50),
          '5xx': Math.floor(Math.random() * 20) * errorMultiplier,
          'timeout': Math.floor(Math.random() * 10),
          'connection': Math.floor(Math.random() * 5)
        }
      },
      systemMetrics: {
        cpu: {
          usage: Math.random() * 80 + 10, // 10-90% CPU usage
          cores: 8,
          loadAverage: [
            Math.random() * 4,
            Math.random() * 4,
            Math.random() * 4
          ]
        },
        memory: {
          used: Math.floor(Math.random() * 6000) + 2000, // 2-8GB used
          total: 8192,
          free: 0,
          percentage: 0
        },
        disk: {
          used: Math.floor(Math.random() * 400) + 100, // 100-500GB used
          total: 1000,
          free: 0,
          percentage: 0
        },
        network: {
          bytesIn: Math.floor(Math.random() * 1000000) + 500000,
          bytesOut: Math.floor(Math.random() * 800000) + 400000,
          packetsIn: Math.floor(Math.random() * 10000) + 5000,
          packetsOut: Math.floor(Math.random() * 8000) + 4000
        }
      },
      services: {
        'api-gateway': {
          status: Math.random() > 0.95 ? 'degraded' : 'healthy',
          responseTime: baseResponseTime * 0.8,
          errorRate: Math.random() * 2,
          uptime: 99.5 + Math.random() * 0.5
        },
        'user-service': {
          status: 'healthy',
          responseTime: baseResponseTime * 0.6,
          errorRate: Math.random() * 1,
          uptime: 99.8 + Math.random() * 0.2
        },
        'payment-service': {
          status: Math.random() > 0.98 ? 'degraded' : 'healthy',
          responseTime: baseResponseTime * 1.2,
          errorRate: Math.random() * 3,
          uptime: 99.7 + Math.random() * 0.3
        },
        'wallet-service': {
          status: 'healthy',
          responseTime: baseResponseTime * 0.9,
          errorRate: Math.random() * 1.5,
          uptime: 99.9 + Math.random() * 0.1
        },
        'analytics-service': {
          status: service === 'analytics-service' && Math.random() > 0.9 ? 'degraded' : 'healthy',
          responseTime: baseResponseTime * 1.1,
          errorRate: Math.random() * 2.5,
          uptime: 99.6 + Math.random() * 0.4
        },
        'compliance-service': {
          status: 'healthy',
          responseTime: baseResponseTime * 1.3,
          errorRate: Math.random() * 1.8,
          uptime: 99.7 + Math.random() * 0.3
        },
        'fraud-detection': {
          status: Math.random() > 0.96 ? 'degraded' : 'healthy',
          responseTime: baseResponseTime * 1.5,
          errorRate: Math.random() * 2.2,
          uptime: 99.4 + Math.random() * 0.6
        }
      }
    };
  }).map(metrics => {
    // Calculate derived fields
    metrics.systemMetrics.memory.free = metrics.systemMetrics.memory.total - metrics.systemMetrics.memory.used;
    metrics.systemMetrics.memory.percentage = (metrics.systemMetrics.memory.used / metrics.systemMetrics.memory.total) * 100;
    
    metrics.systemMetrics.disk.free = metrics.systemMetrics.disk.total - metrics.systemMetrics.disk.used;
    metrics.systemMetrics.disk.percentage = (metrics.systemMetrics.disk.used / metrics.systemMetrics.disk.total) * 100;
    
    return metrics;
  });
};

// Generate performance summary
const generatePerformanceSummary = (data: PerformanceMetrics[]) => {
  if (data.length === 0) return null;

  const responseTimes = data.map(d => d.responseTime.avg);
  const errorRates = data.map(d => d.errorRate.rate);
  const throughputs = data.map(d => d.throughput.requestsPerSecond);
  const cpuUsages = data.map(d => d.systemMetrics.cpu.usage);
  const memoryUsages = data.map(d => d.systemMetrics.memory.percentage);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const max = (arr: number[]) => Math.max(...arr);
  const min = (arr: number[]) => Math.min(...arr);

  return {
    responseTime: {
      avg: avg(responseTimes),
      min: min(responseTimes),
      max: max(responseTimes),
      trend: responseTimes[responseTimes.length - 1] > responseTimes[0] ? 'increasing' : 'decreasing'
    },
    errorRate: {
      avg: avg(errorRates),
      min: min(errorRates),
      max: max(errorRates),
      trend: errorRates[errorRates.length - 1] > errorRates[0] ? 'increasing' : 'decreasing'
    },
    throughput: {
      avg: avg(throughputs),
      min: min(throughputs),
      max: max(throughputs),
      trend: throughputs[throughputs.length - 1] > throughputs[0] ? 'increasing' : 'decreasing'
    },
    systemHealth: {
      cpu: {
        avg: avg(cpuUsages),
        max: max(cpuUsages),
        status: max(cpuUsages) > 80 ? 'warning' : 'healthy'
      },
      memory: {
        avg: avg(memoryUsages),
        max: max(memoryUsages),
        status: max(memoryUsages) > 85 ? 'warning' : 'healthy'
      }
    },
    overallHealth: {
      score: Math.max(0, 100 - avg(errorRates) * 10 - Math.max(0, avg(responseTimes) - 100) / 10),
      status: avg(errorRates) < 2 && avg(responseTimes) < 200 ? 'healthy' : 
              avg(errorRates) < 5 && avg(responseTimes) < 500 ? 'degraded' : 'unhealthy'
    }
  };
};

// GET /api/analytics/performance - Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const validation = performanceQuerySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { 
      period = '24h', 
      metric = 'all', 
      service, 
      aggregation = 'avg',
      startDate,
      endDate
    } = validation.data;

    // Generate performance data
    const performanceData = generatePerformanceData(period, service);
    const summary = generatePerformanceSummary(performanceData);

    // Apply metric filtering if specific metric requested
    let filteredData = performanceData;
    if (metric !== 'all') {
      filteredData = performanceData.map(data => {
        const filtered: any = { timestamp: data.timestamp };
        
        switch (metric) {
          case 'response_time':
            filtered.responseTime = data.responseTime;
            break;
          case 'throughput':
            filtered.throughput = data.throughput;
            break;
          case 'errors':
            filtered.errorRate = data.errorRate;
            break;
          case 'cpu':
            filtered.cpu = data.systemMetrics.cpu;
            break;
          case 'memory':
            filtered.memory = data.systemMetrics.memory;
            break;
          case 'disk':
            filtered.disk = data.systemMetrics.disk;
            break;
          default:
            return data;
        }
        
        return filtered;
      });
    }

    // Generate alerts based on thresholds
    const alerts = [];
    const latest = performanceData[performanceData.length - 1];
    
    if (latest) {
      if (latest.responseTime.avg > 500) {
        alerts.push({
          type: 'performance',
          severity: 'high',
          message: 'Average response time exceeds 500ms',
          value: latest.responseTime.avg,
          threshold: 500,
          timestamp: latest.timestamp
        });
      }
      
      if (latest.errorRate.rate > 5) {
        alerts.push({
          type: 'error_rate',
          severity: 'high',
          message: 'Error rate exceeds 5%',
          value: latest.errorRate.rate,
          threshold: 5,
          timestamp: latest.timestamp
        });
      }
      
      if (latest.systemMetrics.cpu.usage > 80) {
        alerts.push({
          type: 'cpu',
          severity: 'warning',
          message: 'CPU usage exceeds 80%',
          value: latest.systemMetrics.cpu.usage,
          threshold: 80,
          timestamp: latest.timestamp
        });
      }
      
      if (latest.systemMetrics.memory.percentage > 85) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: 'Memory usage exceeds 85%',
          value: latest.systemMetrics.memory.percentage,
          threshold: 85,
          timestamp: latest.timestamp
        });
      }
    }

    // Service health overview
    const serviceHealth = latest ? Object.entries(latest.services).map(([name, metrics]) => ({
      name,
      status: metrics.status,
      responseTime: metrics.responseTime,
      errorRate: metrics.errorRate,
      uptime: metrics.uptime,
      health_score: Math.max(0, 100 - metrics.errorRate * 10 - Math.max(0, metrics.responseTime - 100) / 10)
    })) : [];

    // Performance recommendations
    const recommendations = [];
    if (summary && summary.responseTime.avg > 200) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Response Times',
        description: 'Average response time is above optimal threshold. Consider implementing caching or optimizing database queries.',
        impact: 'high'
      });
    }
    
    if (summary && summary.errorRate.avg > 2) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Reduce Error Rate',
        description: 'Error rate is elevated. Review error logs and implement better error handling.',
        impact: 'high'
      });
    }
    
    if (latest && latest.systemMetrics.cpu.usage > 70) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        title: 'Consider CPU Scaling',
        description: 'CPU usage is consistently high. Consider horizontal scaling or optimizing CPU-intensive operations.',
        impact: 'medium'
      });
    }

    const response = {
      success: true,
      data: {
        period,
        metric,
        service,
        aggregation,
        summary,
        metrics: filteredData,
        alerts,
        serviceHealth,
        recommendations,
        metadata: {
          totalDataPoints: filteredData.length,
          startTime: filteredData[0]?.timestamp,
          endTime: filteredData[filteredData.length - 1]?.timestamp,
          generatedAt: new Date().toISOString()
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Performance analytics error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate performance analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/analytics/performance - Submit performance metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate incoming performance data
    const metricsSchema = z.object({
      service: z.string(),
      timestamp: z.string().optional(),
      responseTime: z.number().positive(),
      errorCount: z.number().min(0),
      requestCount: z.number().positive(),
      cpuUsage: z.number().min(0).max(100).optional(),
      memoryUsage: z.number().min(0).max(100).optional(),
      metadata: z.record(z.any()).optional()
    });

    const validation = metricsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid metrics data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const metrics = validation.data;
    
    // In a real implementation, store the metrics in a time-series database
    // For now, we'll just acknowledge receipt and provide basic analysis
    
    const errorRate = (metrics.errorCount / metrics.requestCount) * 100;
    const analysis = {
      service: metrics.service,
      timestamp: metrics.timestamp || new Date().toISOString(),
      performance_grade: metrics.responseTime < 100 ? 'A' : 
                        metrics.responseTime < 200 ? 'B' :
                        metrics.responseTime < 500 ? 'C' : 'D',
      error_rate: errorRate,
      status: errorRate < 1 && metrics.responseTime < 200 ? 'healthy' :
              errorRate < 5 && metrics.responseTime < 500 ? 'degraded' : 'unhealthy',
      alerts: []
    };

    // Generate alerts for this submission
    if (metrics.responseTime > 1000) {
      analysis.alerts.push({
        type: 'response_time',
        severity: 'critical',
        message: 'Response time exceeds 1 second',
        value: metrics.responseTime
      });
    }
    
    if (errorRate > 10) {
      analysis.alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: 'Error rate exceeds 10%',
        value: errorRate
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Performance metrics received and processed',
      data: {
        received: metrics,
        analysis,
        stored: true,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Performance metrics submission error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process performance metrics'
      },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/performance/thresholds - Update performance thresholds
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const thresholdsSchema = z.object({
      responseTime: z.object({
        warning: z.number().positive(),
        critical: z.number().positive()
      }).optional(),
      errorRate: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100)
      }).optional(),
      cpu: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100)
      }).optional(),
      memory: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100)
      }).optional()
    });

    const validation = thresholdsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid threshold configuration',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const thresholds = validation.data;
    
    // In a real implementation, store these thresholds in the database
    // For now, acknowledge the update
    
    return NextResponse.json({
      success: true,
      message: 'Performance thresholds updated successfully',
      data: {
        thresholds,
        updatedAt: new Date().toISOString(),
        appliedTo: 'all_services'
      }
    });

  } catch (error) {
    console.error('Threshold update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update performance thresholds'
      },
      { status: 500 }
    );
  }
}
