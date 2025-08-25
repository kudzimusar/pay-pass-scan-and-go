/**
 * Performance Monitoring Service
 * Collects, analyzes, and reports system performance metrics
 * Performance Monitoring: Active
 */

import express from 'express';
import { performance } from 'perf_hooks';

const app = express();
app.use(express.json());

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

interface ApplicationMetrics {
  requests: {
    total: number;
    rps: number;
    averageResponseTime: number;
    errorRate: number;
  };
  database: {
    connections: number;
    queriesPerSecond: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
    memoryUsage: number;
  };
  queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Array<{
    id: string;
    metric: string;
    severity: 'warning' | 'critical';
    message: string;
    timestamp: number;
  }> = [];

  constructor() {
    this.startSystemMetricsCollection();
    this.startApplicationMetricsCollection();
  }

  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const metricName = metric.name;
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const metricArray = this.metrics.get(metricName)!;
    metricArray.push(fullMetric);

    // Keep only last 1000 metrics per type
    if (metricArray.length > 1000) {
      metricArray.shift();
    }

    this.checkThresholds(fullMetric);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    const { warning, critical } = metric.threshold;
    let severity: 'warning' | 'critical' | null = null;
    let message = '';

    if (metric.value >= critical) {
      severity = 'critical';
      message = `Critical threshold exceeded for ${metric.name}: ${metric.value}${metric.unit} >= ${critical}${metric.unit}`;
    } else if (metric.value >= warning) {
      severity = 'warning';
      message = `Warning threshold exceeded for ${metric.name}: ${metric.value}${metric.unit} >= ${warning}${metric.unit}`;
    }

    if (severity) {
      this.alerts.push({
        id: this.generateId(),
        metric: metric.name,
        severity,
        message,
        timestamp: Date.now()
      });

      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }

      console.log(`🚨 Performance Alert [${severity.toUpperCase()}]: ${message}`);
    }
  }

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      const systemMetrics = this.collectSystemMetrics();
      
      this.recordMetric({
        name: 'system.cpu.usage',
        value: systemMetrics.cpu.usage,
        unit: '%',
        tags: { type: 'system' },
        threshold: { warning: 80, critical: 95 }
      });

      this.recordMetric({
        name: 'system.memory.usage',
        value: systemMetrics.memory.percentage,
        unit: '%',
        tags: { type: 'system' },
        threshold: { warning: 85, critical: 95 }
      });

      this.recordMetric({
        name: 'system.disk.usage',
        value: systemMetrics.disk.percentage,
        unit: '%',
        tags: { type: 'system' },
        threshold: { warning: 85, critical: 95 }
      });
    }, 10000); // Every 10 seconds
  }

  private startApplicationMetricsCollection(): void {
    setInterval(() => {
      const appMetrics = this.collectApplicationMetrics();

      this.recordMetric({
        name: 'app.response.time',
        value: appMetrics.requests.averageResponseTime,
        unit: 'ms',
        tags: { type: 'application' },
        threshold: { warning: 500, critical: 1000 }
      });

      this.recordMetric({
        name: 'app.error.rate',
        value: appMetrics.requests.errorRate,
        unit: '%',
        tags: { type: 'application' },
        threshold: { warning: 5, critical: 10 }
      });

      this.recordMetric({
        name: 'app.cache.hit.rate',
        value: appMetrics.cache.hitRate,
        unit: '%',
        tags: { type: 'cache' },
        threshold: { warning: 80, critical: 70 }
      });

      this.recordMetric({
        name: 'app.db.query.time',
        value: appMetrics.database.averageQueryTime,
        unit: 'ms',
        tags: { type: 'database' },
        threshold: { warning: 100, critical: 500 }
      });
    }, 30000); // Every 30 seconds
  }

  private collectSystemMetrics(): SystemMetrics {
    // Mock system metrics - in production, use actual system monitoring
    return {
      cpu: {
        usage: Math.random() * 100,
        load: [Math.random(), Math.random(), Math.random()]
      },
      memory: {
        total: 8 * 1024 * 1024 * 1024, // 8GB
        used: Math.random() * 6 * 1024 * 1024 * 1024, // Random used
        free: 0, // Calculated
        percentage: Math.random() * 100
      },
      disk: {
        total: 500 * 1024 * 1024 * 1024, // 500GB
        used: Math.random() * 400 * 1024 * 1024 * 1024, // Random used
        free: 0, // Calculated
        percentage: Math.random() * 100
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000),
        packetsIn: Math.floor(Math.random() * 10000),
        packetsOut: Math.floor(Math.random() * 10000)
      }
    };
  }

  private collectApplicationMetrics(): ApplicationMetrics {
    // Mock application metrics - in production, collect from actual services
    return {
      requests: {
        total: Math.floor(Math.random() * 10000),
        rps: Math.floor(Math.random() * 100),
        averageResponseTime: Math.random() * 1000,
        errorRate: Math.random() * 10
      },
      database: {
        connections: Math.floor(Math.random() * 50),
        queriesPerSecond: Math.floor(Math.random() * 200),
        averageQueryTime: Math.random() * 200,
        slowQueries: Math.floor(Math.random() * 5)
      },
      cache: {
        hitRate: 70 + Math.random() * 30, // 70-100%
        missRate: Math.random() * 30, // 0-30%
        evictions: Math.floor(Math.random() * 100),
        memoryUsage: Math.random() * 100
      },
      queue: {
        pending: Math.floor(Math.random() * 1000),
        processing: Math.floor(Math.random() * 50),
        completed: Math.floor(Math.random() * 5000),
        failed: Math.floor(Math.random() * 10)
      }
    };
  }

  getMetrics(metricName?: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    if (metricName) {
      const metrics = this.metrics.get(metricName) || [];
      if (timeRange) {
        return metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
      }
      return metrics;
    }

    // Return all metrics
    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach(metricArray => {
      allMetrics.push(...metricArray);
    });

    if (timeRange) {
      return allMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
    }

    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAggregatedMetrics(metricName: string, aggregation: 'avg' | 'min' | 'max' | 'sum', timeRange?: { start: number; end: number }) {
    const metrics = this.getMetrics(metricName, timeRange);
    
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    
    switch (aggregation) {
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      default:
        return null;
    }
  }

  getAlerts(severity?: 'warning' | 'critical'): typeof this.alerts {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  getHealthStatus(): { status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
    const recentAlerts = this.alerts.filter(alert => Date.now() - alert.timestamp < 300000); // Last 5 minutes
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = recentAlerts.filter(alert => alert.severity === 'warning');

    if (criticalAlerts.length > 0) {
      return {
        status: 'critical',
        issues: criticalAlerts.map(alert => alert.message)
      };
    }

    if (warningAlerts.length > 0) {
      return {
        status: 'warning',
        issues: warningAlerts.map(alert => alert.message)
      };
    }

    return {
      status: 'healthy',
      issues: []
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  clearMetrics(metricName?: string): void {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Middleware to track request performance
const performanceMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: 'http.request.duration',
      value: duration,
      unit: 'ms',
      tags: {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode.toString()
      }
    });

    performanceMonitor.recordMetric({
      name: 'http.request.count',
      value: 1,
      unit: 'count',
      tags: {
        method: req.method,
        status: res.statusCode.toString()
      }
    });
  });

  next();
};

app.use(performanceMiddleware);

// API Routes
app.get('/health', (req, res) => {
  const healthStatus = performanceMonitor.getHealthStatus();
  res.json({
    status: healthStatus.status,
    service: 'performance-monitoring',
    timestamp: new Date().toISOString(),
    health: healthStatus
  });
});

app.get('/metrics', (req, res) => {
  const { metric, start, end, aggregation } = req.query;
  
  const timeRange = start && end ? {
    start: parseInt(start as string),
    end: parseInt(end as string)
  } : undefined;

  if (aggregation && metric) {
    const result = performanceMonitor.getAggregatedMetrics(
      metric as string,
      aggregation as 'avg' | 'min' | 'max' | 'sum',
      timeRange
    );
    res.json({ metric, aggregation, result, timeRange });
  } else {
    const metrics = performanceMonitor.getMetrics(metric as string, timeRange);
    res.json({ metrics, timeRange });
  }
});

app.get('/alerts', (req, res) => {
  const { severity } = req.query;
  const alerts = performanceMonitor.getAlerts(severity as 'warning' | 'critical');
  res.json({ alerts });
});

app.post('/metrics', (req, res) => {
  const { name, value, unit, tags, threshold } = req.body;
  
  if (!name || value === undefined || !unit) {
    return res.status(400).json({ error: 'Name, value, and unit are required' });
  }

  performanceMonitor.recordMetric({ name, value, unit, tags, threshold });
  res.json({ message: 'Metric recorded successfully' });
});

app.delete('/metrics', (req, res) => {
  const { metric } = req.query;
  performanceMonitor.clearMetrics(metric as string);
  res.json({ message: metric ? `Metrics for ${metric} cleared` : 'All metrics cleared' });
});

app.delete('/alerts', (req, res) => {
  performanceMonitor.clearAlerts();
  res.json({ message: 'Alerts cleared' });
});

app.get('/dashboard', (req, res) => {
  const now = Date.now();
  const oneHourAgo = now - 3600000; // 1 hour

  const dashboard = {
    timestamp: new Date().toISOString(),
    timeRange: { start: oneHourAgo, end: now },
    system: {
      cpuUsage: performanceMonitor.getAggregatedMetrics('system.cpu.usage', 'avg', { start: oneHourAgo, end: now }),
      memoryUsage: performanceMonitor.getAggregatedMetrics('system.memory.usage', 'avg', { start: oneHourAgo, end: now }),
      diskUsage: performanceMonitor.getAggregatedMetrics('system.disk.usage', 'avg', { start: oneHourAgo, end: now })
    },
    application: {
      avgResponseTime: performanceMonitor.getAggregatedMetrics('app.response.time', 'avg', { start: oneHourAgo, end: now }),
      errorRate: performanceMonitor.getAggregatedMetrics('app.error.rate', 'avg', { start: oneHourAgo, end: now }),
      cacheHitRate: performanceMonitor.getAggregatedMetrics('app.cache.hit.rate', 'avg', { start: oneHourAgo, end: now }),
      dbQueryTime: performanceMonitor.getAggregatedMetrics('app.db.query.time', 'avg', { start: oneHourAgo, end: now })
    },
    health: performanceMonitor.getHealthStatus(),
    recentAlerts: performanceMonitor.getAlerts().slice(0, 5)
  };

  res.json(dashboard);
});

const PORT = process.env.PORT || 3009;

app.listen(PORT, () => {
  console.log(`📊 Performance Monitoring Service running on port ${PORT}`);
  console.log(`📈 Collecting system and application metrics`);
  console.log(`🚨 Real-time alerting enabled`);
});

export { PerformanceMonitor, performanceMiddleware };
export type { PerformanceMetric, SystemMetrics, ApplicationMetrics };
