/**
 * Monitoring & Alerting Module
 * Provides real-time monitoring of system health and performance
 * Enables proactive alerting for critical issues
 */

export interface HealthMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface SystemHealth {
  database: HealthMetric;
  api: HealthMetric;
  cache: HealthMetric;
  memory: HealthMetric;
  cpu: HealthMetric;
  overallStatus: 'healthy' | 'degraded' | 'critical';
}

class HealthMonitor {
  private metrics: Map<string, HealthMetric> = new Map();
  private alertCallbacks: Array<(alert: Alert) => void> = [];

  constructor() {
    this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeMetrics(): void {
    this.metrics.set('database', {
      name: 'Database Connection',
      value: 100,
      threshold: 80,
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('api', {
      name: 'API Response Time',
      value: 0,
      threshold: 2000, // 2 seconds in ms
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('cache', {
      name: 'Cache Hit Rate',
      value: 100,
      threshold: 70,
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('memory', {
      name: 'Memory Usage',
      value: 0,
      threshold: 80, // percentage
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('cpu', {
      name: 'CPU Usage',
      value: 0,
      threshold: 75, // percentage
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
    });
  }

  private startMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);
  }

  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    const memMetric = this.metrics.get('memory')!;
    memMetric.value = memPercentage;
    memMetric.status = this.getStatus(memPercentage, memMetric.threshold);
    memMetric.lastUpdated = new Date().toISOString();

    if (memMetric.status !== 'healthy') {
      this.triggerAlert({
        severity: memMetric.status === 'critical' ? 'critical' : 'warning',
        message: `Memory usage at ${memPercentage.toFixed(2)}%`,
        metric: 'memory',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private getStatus(value: number, threshold: number): 'healthy' | 'warning' | 'critical' {
    if (value >= threshold * 1.2) return 'critical';
    if (value >= threshold) return 'warning';
    return 'healthy';
  }

  /**
   * Update a specific metric
   * @param metricName Name of the metric
   * @param value New value
   */
  public updateMetric(metricName: string, value: number): void {
    const metric = this.metrics.get(metricName);
    if (metric) {
      metric.value = value;
      metric.status = this.getStatus(value, metric.threshold);
      metric.lastUpdated = new Date().toISOString();

      if (metric.status !== 'healthy') {
        this.triggerAlert({
          severity: metric.status === 'critical' ? 'critical' : 'warning',
          message: `${metric.name} at ${value}`,
          metric: metricName,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get overall system health
   * @returns System health status
   */
  public getSystemHealth(): SystemHealth {
    const health: SystemHealth = {
      database: this.metrics.get('database')!,
      api: this.metrics.get('api')!,
      cache: this.metrics.get('cache')!,
      memory: this.metrics.get('memory')!,
      cpu: this.metrics.get('cpu')!,
      overallStatus: 'healthy',
    };

    // Determine overall status
    const statuses = [
      health.database.status,
      health.api.status,
      health.cache.status,
      health.memory.status,
      health.cpu.status,
    ];

    if (statuses.includes('critical')) {
      health.overallStatus = 'critical';
    } else if (statuses.includes('warning')) {
      health.overallStatus = 'degraded';
    }

    return health;
  }

  /**
   * Register an alert callback
   * @param callback Function to call when an alert is triggered
   */
  public onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Trigger an alert
   * @param alert Alert to trigger
   */
  private triggerAlert(alert: Alert): void {
    console.warn('[ALERT]', alert);
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }
}

export interface Alert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  timestamp: string;
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

/**
 * Performance Monitoring Decorator
 * Tracks execution time and logs performance metrics
 */
export function MonitorPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;

      // Log performance metric
      console.log(`[PERFORMANCE] ${propertyKey} took ${duration}ms`);

      // Update API response time metric if applicable
      if (propertyKey.includes('api') || propertyKey.includes('request')) {
        healthMonitor.updateMetric('api', duration);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[PERFORMANCE ERROR] ${propertyKey} failed after ${duration}ms:`, error);
      throw error;
    }
  };

  return descriptor;
}
