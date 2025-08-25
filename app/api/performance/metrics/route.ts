import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Performance Metrics API
// Collects, processes, and serves performance metrics for monitoring and optimization

const metricsSubmissionSchema = z.object({
  source: z.enum(['frontend', 'backend', 'mobile', 'api']),
  timestamp: z.string(),
  metrics: z.object({
    performance: z.object({
      loadTime: z.number().positive().optional(),
      renderTime: z.number().positive().optional(),
      interactionTime: z.number().positive().optional(),
      firstContentfulPaint: z.number().positive().optional(),
      largestContentfulPaint: z.number().positive().optional(),
      cumulativeLayoutShift: z.number().min(0).optional(),
      firstInputDelay: z.number().positive().optional()
    }).optional(),
    resource: z.object({
      cpuUsage: z.number().min(0).max(100).optional(),
      memoryUsage: z.number().positive().optional(),
      diskUsage: z.number().positive().optional(),
      networkLatency: z.number().positive().optional(),
      bandwidth: z.number().positive().optional()
    }).optional(),
    user: z.object({
      sessionId: z.string().optional(),
      userId: z.string().optional(),
      userAgent: z.string().optional(),
      device: z.string().optional(),
      connection: z.enum(['2g', '3g', '4g', '5g', 'wifi', 'ethernet']).optional(),
      location: z.object({
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional()
      }).optional()
    }).optional(),
    business: z.object({
      pageViews: z.number().min(0).optional(),
      conversions: z.number().min(0).optional(),
      bounceRate: z.number().min(0).max(1).optional(),
      errorRate: z.number().min(0).max(1).optional(),
      apiCalls: z.number().min(0).optional(),
      successfulTransactions: z.number().min(0).optional()
    }).optional()
  }),
  context: z.object({
    page: z.string().optional(),
    feature: z.string().optional(),
    version: z.string().optional(),
    environment: z.enum(['development', 'staging', 'production']).optional(),
    experiment: z.string().optional()
  }).optional(),
  tags: z.record(z.string()).optional()
});

const metricsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
  source: z.enum(['frontend', 'backend', 'mobile', 'api']).optional(),
  metric: z.string().optional(),
  aggregation: z.enum(['avg', 'min', 'max', 'sum', 'p50', 'p95', 'p99']).optional(),
  groupBy: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']).optional()
});

// Mock data store for metrics
const mockMetrics = new Map();
const mockAlerts = new Map();
const mockBenchmarks = new Map();

// Initialize mock data
const initializeMockData = () => {
  if (mockMetrics.size === 0) {
    // Generate sample metrics for the last 24 hours
    const now = Date.now();
    const hoursAgo = 24;
    
    for (let i = 0; i < hoursAgo; i++) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      const metricId = `metric_${timestamp.getTime()}`;
      
      // Frontend metrics
      mockMetrics.set(`${metricId}_frontend`, {
        id: `${metricId}_frontend`,
        source: 'frontend',
        timestamp: timestamp.toISOString(),
        metrics: {
          performance: {
            loadTime: 1200 + Math.random() * 800, // 1.2-2.0s
            renderTime: 150 + Math.random() * 100, // 150-250ms
            interactionTime: 80 + Math.random() * 40, // 80-120ms
            firstContentfulPaint: 800 + Math.random() * 400, // 0.8-1.2s
            largestContentfulPaint: 1500 + Math.random() * 500, // 1.5-2.0s
            cumulativeLayoutShift: Math.random() * 0.1, // 0-0.1
            firstInputDelay: 50 + Math.random() * 50 // 50-100ms
          },
          user: {
            sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
            device: 'mobile',
            connection: ['4g', '5g', 'wifi'][Math.floor(Math.random() * 3)],
            location: {
              country: 'US',
              region: 'NY',
              city: 'New York'
            }
          },
          business: {
            pageViews: Math.floor(Math.random() * 100),
            conversions: Math.floor(Math.random() * 10),
            bounceRate: 0.2 + Math.random() * 0.3, // 20-50%
            errorRate: Math.random() * 0.05 // 0-5%
          }
        },
        context: {
          page: ['/dashboard', '/payments', '/wallet', '/profile'][Math.floor(Math.random() * 4)],
          version: '2.1.0',
          environment: 'production'
        }
      });

      // Backend metrics
      mockMetrics.set(`${metricId}_backend`, {
        id: `${metricId}_backend`,
        source: 'backend',
        timestamp: timestamp.toISOString(),
        metrics: {
          performance: {
            loadTime: 100 + Math.random() * 200, // 100-300ms API response
            renderTime: 50 + Math.random() * 50 // 50-100ms processing
          },
          resource: {
            cpuUsage: 30 + Math.random() * 40, // 30-70%
            memoryUsage: 2048 + Math.random() * 1024, // 2-3GB
            diskUsage: 45 + Math.random() * 20, // 45-65%
            networkLatency: 10 + Math.random() * 20, // 10-30ms
            bandwidth: 100 + Math.random() * 400 // 100-500 Mbps
          },
          business: {
            apiCalls: Math.floor(Math.random() * 1000),
            successfulTransactions: Math.floor(Math.random() * 50),
            errorRate: Math.random() * 0.02 // 0-2%
          }
        },
        context: {
          feature: ['auth', 'payments', 'wallet', 'analytics'][Math.floor(Math.random() * 4)],
          version: '2.1.0',
          environment: 'production'
        }
      });
    }

    // Sample performance benchmarks
    mockBenchmarks.set('web_vitals', {
      name: 'Core Web Vitals',
      metrics: {
        firstContentfulPaint: { good: 1800, needsImprovement: 3000 },
        largestContentfulPaint: { good: 2500, needsImprovement: 4000 },
        firstInputDelay: { good: 100, needsImprovement: 300 },
        cumulativeLayoutShift: { good: 0.1, needsImprovement: 0.25 }
      }
    });

    mockBenchmarks.set('api_performance', {
      name: 'API Performance',
      metrics: {
        responseTime: { excellent: 100, good: 200, needsImprovement: 500 },
        errorRate: { excellent: 0.001, good: 0.01, needsImprovement: 0.05 }
      }
    });

    // Sample alerts
    mockAlerts.set('alert_1', {
      id: 'alert_1',
      type: 'performance',
      severity: 'warning',
      title: 'High Load Time Detected',
      description: 'Average page load time exceeded 2 seconds',
      metric: 'loadTime',
      threshold: 2000,
      currentValue: 2150,
      triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'active'
    });
  }
};

// Calculate performance score based on metrics
const calculatePerformanceScore = (metrics: any) => {
  let score = 100;
  const weights = {
    loadTime: 0.3,
    renderTime: 0.2,
    firstContentfulPaint: 0.2,
    largestContentfulPaint: 0.15,
    firstInputDelay: 0.1,
    cumulativeLayoutShift: 0.05
  };

  const benchmarks = mockBenchmarks.get('web_vitals');
  if (!benchmarks || !metrics.performance) return 85; // Default score

  Object.entries(weights).forEach(([metric, weight]) => {
    const value = metrics.performance[metric];
    const benchmark = benchmarks.metrics[metric];
    
    if (value && benchmark) {
      let penalty = 0;
      if (value > benchmark.needsImprovement) {
        penalty = 40; // Major penalty
      } else if (value > benchmark.good) {
        penalty = 20; // Minor penalty
      }
      score -= penalty * weight;
    }
  });

  return Math.max(0, Math.round(score));
};

// Analyze metrics for insights
const analyzeMetrics = (metricsList: any[]) => {
  if (metricsList.length === 0) return null;

  const insights = [];
  const trends = {};
  
  // Analyze load time trends
  const loadTimes = metricsList
    .filter(m => m.metrics.performance?.loadTime)
    .map(m => m.metrics.performance.loadTime);
  
  if (loadTimes.length > 1) {
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const trend = loadTimes[loadTimes.length - 1] > loadTimes[0] ? 'increasing' : 'decreasing';
    
    trends.loadTime = { avg: avgLoadTime, trend };
    
    if (avgLoadTime > 2000) {
      insights.push({
        type: 'warning',
        metric: 'loadTime',
        message: 'Average load time is above recommended threshold (2 seconds)',
        suggestion: 'Consider implementing caching, CDN, or code splitting'
      });
    }
  }

  // Analyze error rates
  const errorRates = metricsList
    .filter(m => m.metrics.business?.errorRate)
    .map(m => m.metrics.business.errorRate);
  
  if (errorRates.length > 0) {
    const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
    trends.errorRate = { avg: avgErrorRate };
    
    if (avgErrorRate > 0.05) {
      insights.push({
        type: 'critical',
        metric: 'errorRate',
        message: 'Error rate is above 5%',
        suggestion: 'Investigate error logs and implement better error handling'
      });
    }
  }

  // Analyze resource usage
  const cpuUsages = metricsList
    .filter(m => m.metrics.resource?.cpuUsage)
    .map(m => m.metrics.resource.cpuUsage);
  
  if (cpuUsages.length > 0) {
    const avgCpuUsage = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
    trends.cpuUsage = { avg: avgCpuUsage };
    
    if (avgCpuUsage > 80) {
      insights.push({
        type: 'warning',
        metric: 'cpuUsage',
        message: 'CPU usage is consistently high (>80%)',
        suggestion: 'Consider horizontal scaling or optimizing CPU-intensive operations'
      });
    }
  }

  return { insights, trends };
};

// GET /api/performance/metrics - Query performance metrics
export async function GET(request: NextRequest) {
  try {
    initializeMockData();
    
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const validation = metricsQuerySchema.safeParse(params);
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
      timeRange = '24h', 
      source, 
      metric, 
      aggregation = 'avg',
      groupBy,
      environment = 'production'
    } = validation.data;

    // Filter metrics based on query parameters
    let metrics = Array.from(mockMetrics.values()).filter((m: any) => {
      if (source && m.source !== source) return false;
      if (environment && m.context?.environment !== environment) return false;
      
      // Time range filtering
      const metricTime = new Date(m.timestamp);
      const now = new Date();
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const rangeMs = timeRanges[timeRange as keyof typeof timeRanges];
      if (now.getTime() - metricTime.getTime() > rangeMs) return false;
      
      return true;
    });

    // Group metrics if specified
    let groupedMetrics: any = {};
    if (groupBy) {
      groupedMetrics = metrics.reduce((acc: any, m: any) => {
        const groupKey = m.context?.[groupBy] || m[groupBy] || 'unknown';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(m);
        return acc;
      }, {});
    }

    // Analyze metrics for insights
    const analysis = analyzeMetrics(metrics);

    // Calculate aggregated statistics
    const stats = {
      total: metrics.length,
      sources: metrics.reduce((acc: any, m: any) => {
        acc[m.source] = (acc[m.source] || 0) + 1;
        return acc;
      }, {}),
      timeRange: {
        start: metrics.length > 0 ? Math.min(...metrics.map((m: any) => new Date(m.timestamp).getTime())) : null,
        end: metrics.length > 0 ? Math.max(...metrics.map((m: any) => new Date(m.timestamp).getTime())) : null
      }
    };

    // Get current alerts
    const activeAlerts = Array.from(mockAlerts.values()).filter((alert: any) => alert.status === 'active');

    const response = {
      success: true,
      data: {
        metrics: groupBy ? groupedMetrics : metrics,
        analysis,
        stats,
        alerts: activeAlerts,
        benchmarks: Array.from(mockBenchmarks.values()),
        query: {
          timeRange,
          source,
          metric,
          aggregation,
          groupBy,
          environment
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Performance metrics query error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/performance/metrics - Submit performance metrics
export async function POST(request: NextRequest) {
  try {
    initializeMockData();
    
    const body = await request.json();
    
    // Handle batch submissions
    const metrics = Array.isArray(body) ? body : [body];
    const results = [];

    for (const metricData of metrics) {
      const validation = metricsSubmissionSchema.safeParse(metricData);
      if (!validation.success) {
        results.push({
          success: false,
          error: 'Invalid metric data',
          details: validation.error.errors
        });
        continue;
      }

      const metric = validation.data;
      const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate performance score for frontend metrics
      let performanceScore = null;
      if (metric.source === 'frontend' && metric.metrics.performance) {
        performanceScore = calculatePerformanceScore(metric.metrics);
      }

      // Store metric
      const storedMetric = {
        id: metricId,
        ...metric,
        receivedAt: new Date().toISOString(),
        performanceScore,
        processed: true
      };

      mockMetrics.set(metricId, storedMetric);

      // Check for alert conditions
      const alerts = checkAlertConditions(storedMetric);
      alerts.forEach(alert => {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        mockAlerts.set(alertId, { id: alertId, ...alert });
      });

      results.push({
        success: true,
        id: metricId,
        performanceScore,
        alertsTriggered: alerts.length
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });

  } catch (error) {
    console.error('Performance metrics submission error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit performance metrics'
      },
      { status: 500 }
    );
  }
}

// Check for alert conditions
const checkAlertConditions = (metric: any) => {
  const alerts = [];
  
  // Load time alert
  if (metric.metrics.performance?.loadTime > 3000) {
    alerts.push({
      type: 'performance',
      severity: 'warning',
      title: 'High Load Time',
      description: `Load time of ${metric.metrics.performance.loadTime}ms exceeds threshold`,
      metric: 'loadTime',
      threshold: 3000,
      currentValue: metric.metrics.performance.loadTime,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      source: metric.source
    });
  }

  // Error rate alert
  if (metric.metrics.business?.errorRate > 0.05) {
    alerts.push({
      type: 'reliability',
      severity: 'critical',
      title: 'High Error Rate',
      description: `Error rate of ${(metric.metrics.business.errorRate * 100).toFixed(2)}% exceeds threshold`,
      metric: 'errorRate',
      threshold: 0.05,
      currentValue: metric.metrics.business.errorRate,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      source: metric.source
    });
  }

  // CPU usage alert
  if (metric.metrics.resource?.cpuUsage > 85) {
    alerts.push({
      type: 'resource',
      severity: 'warning',
      title: 'High CPU Usage',
      description: `CPU usage of ${metric.metrics.resource.cpuUsage}% exceeds threshold`,
      metric: 'cpuUsage',
      threshold: 85,
      currentValue: metric.metrics.resource.cpuUsage,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      source: metric.source
    });
  }

  return alerts;
};

// PUT /api/performance/metrics/alerts/:alertId - Update alert status
export async function PUT(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const alertId = pathname.split('/').pop();
    
    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    const alert = mockAlerts.get(alertId);
    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    alert.status = status;
    alert.notes = notes;
    alert.updatedAt = new Date().toISOString();

    mockAlerts.set(alertId, alert);

    return NextResponse.json({
      success: true,
      data: {
        alert,
        message: 'Alert status updated successfully'
      }
    });

  } catch (error) {
    console.error('Alert update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update alert'
      },
      { status: 500 }
    );
  }
}
