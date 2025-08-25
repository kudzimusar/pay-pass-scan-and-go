/**
 * Performance Monitoring and Optimization System
 * Tracks performance metrics and provides optimization strategies
 * Optimized for mobile users and emerging markets
 */

import { db } from "./drizzle";
import { performanceMetrics } from "../../../shared/schema";

export interface PerformanceMetric {
  metricType: 'api_response' | 'page_load' | 'transaction_time' | 'database_query' | 'network_latency';
  endpoint?: string;
  userId?: string;
  duration: number; // milliseconds
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  connectionType: 'cellular' | 'wifi' | 'unknown';
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export interface OptimizationStrategy {
  strategy: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
}

// Performance thresholds (optimized for mobile and emerging markets)
export const PERFORMANCE_THRESHOLDS = {
  // API response times (milliseconds)
  api: {
    fast: 500,
    acceptable: 2000,
    slow: 5000,
  },
  
  // Page load times (milliseconds)
  pageLoad: {
    fast: 1500,
    acceptable: 3000,
    slow: 8000,
  },
  
  // Transaction processing times (milliseconds)
  transaction: {
    fast: 2000,
    acceptable: 10000,
    slow: 30000,
  },
  
  // Database query times (milliseconds)
  database: {
    fast: 100,
    acceptable: 500,
    slow: 2000,
  },
};

// Performance optimization strategies
export const OPTIMIZATION_STRATEGIES: Record<string, OptimizationStrategy[]> = {
  slow_api: [
    {
      strategy: 'response_caching',
      description: 'Cache API responses for frequently accessed data',
      impact: 'high',
      implementation: 'Implement Redis caching for exchange rates, user profiles, and static data',
    },
    {
      strategy: 'request_batching',
      description: 'Batch multiple API requests to reduce round trips',
      impact: 'medium',
      implementation: 'Combine related API calls into single requests where possible',
    },
    {
      strategy: 'data_compression',
      description: 'Compress API responses to reduce transfer time',
      impact: 'medium',
      implementation: 'Enable gzip compression for all API responses',
    },
  ],
  
  slow_page_load: [
    {
      strategy: 'code_splitting',
      description: 'Split JavaScript bundles to load only necessary code',
      impact: 'high',
      implementation: 'Implement route-based code splitting with dynamic imports',
    },
    {
      strategy: 'image_optimization',
      description: 'Optimize images for mobile devices and slow connections',
      impact: 'high',
      implementation: 'Use WebP format, lazy loading, and responsive images',
    },
    {
      strategy: 'css_optimization',
      description: 'Minimize CSS and remove unused styles',
      impact: 'medium',
      implementation: 'Use CSS purging and critical CSS extraction',
    },
    {
      strategy: 'preloading',
      description: 'Preload critical resources and next likely pages',
      impact: 'medium',
      implementation: 'Implement intelligent preloading based on user behavior',
    },
  ],
  
  slow_transaction: [
    {
      strategy: 'async_processing',
      description: 'Process complex transactions asynchronously',
      impact: 'high',
      implementation: 'Use background jobs for fraud detection and compliance checks',
    },
    {
      strategy: 'parallel_execution',
      description: 'Execute independent operations in parallel',
      impact: 'high',
      implementation: 'Run fraud detection models and external API calls concurrently',
    },
    {
      strategy: 'early_validation',
      description: 'Validate inputs early to prevent unnecessary processing',
      impact: 'medium',
      implementation: 'Client-side validation and quick server-side checks',
    },
  ],
  
  poor_mobile_experience: [
    {
      strategy: 'progressive_loading',
      description: 'Load content progressively with skeleton screens',
      impact: 'high',
      implementation: 'Show skeleton UI while loading data, prioritize above-fold content',
    },
    {
      strategy: 'offline_support',
      description: 'Enable offline functionality for core features',
      impact: 'high',
      implementation: 'Implement service workers and local data caching',
    },
    {
      strategy: 'touch_optimization',
      description: 'Optimize touch interactions and UI for mobile',
      impact: 'medium',
      implementation: 'Larger touch targets, improved gesture handling, mobile-first design',
    },
  ],
};

export class PerformanceMonitor {
  /**
   * Record a performance metric
   */
  static async recordMetric(metric: PerformanceMetric, deviceInfo?: DeviceInfo): Promise<void> {
    try {
      await db.insert(performanceMetrics).values({
        metricType: metric.metricType,
        endpoint: metric.endpoint,
        userId: metric.userId,
        duration: metric.duration,
        status: metric.status,
        errorMessage: metric.errorMessage,
        userAgent: deviceInfo ? `${deviceInfo.os}/${deviceInfo.browser}` : undefined,
        deviceType: deviceInfo?.type,
        metadata: metric.metadata ? JSON.stringify(metric.metadata) : undefined,
      });
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  /**
   * Analyze performance and suggest optimizations
   */
  static async analyzePerformance(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    summary: any;
    recommendations: OptimizationStrategy[];
    metrics: any[];
  }> {
    const timeRangeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - timeRangeMs[timeRange]);

    // This would be a complex query in production - simplified for demo
    const recentMetrics = []; // Would fetch from DB with proper aggregation

    const summary = this.calculatePerformanceSummary(recentMetrics);
    const recommendations = this.generateRecommendations(summary);

    return {
      summary,
      recommendations,
      metrics: recentMetrics,
    };
  }

  /**
   * Calculate performance summary
   */
  private static calculatePerformanceSummary(metrics: any[]): any {
    // Simplified calculation - would be more complex in production
    return {
      apiPerformance: {
        averageResponseTime: 1200,
        p95ResponseTime: 3500,
        errorRate: 0.02,
        slowRequests: 15,
      },
      pageLoadPerformance: {
        averageLoadTime: 2800,
        p95LoadTime: 6200,
        bounceRate: 0.12,
        mobilePerformance: 'needs_improvement',
      },
      transactionPerformance: {
        averageProcessingTime: 8500,
        p95ProcessingTime: 22000,
        failureRate: 0.008,
        timeoutRate: 0.003,
      },
      userExperience: {
        mobileUsers: 78,
        slowConnectionUsers: 34,
        averageSessionDuration: 12.5,
        userSatisfactionScore: 7.2,
      },
    };
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(summary: any): OptimizationStrategy[] {
    const recommendations: OptimizationStrategy[] = [];

    // API performance recommendations
    if (summary.apiPerformance.averageResponseTime > PERFORMANCE_THRESHOLDS.api.acceptable) {
      recommendations.push(...OPTIMIZATION_STRATEGIES.slow_api);
    }

    // Page load recommendations
    if (summary.pageLoadPerformance.averageLoadTime > PERFORMANCE_THRESHOLDS.pageLoad.acceptable) {
      recommendations.push(...OPTIMIZATION_STRATEGIES.slow_page_load);
    }

    // Transaction performance recommendations
    if (summary.transactionPerformance.averageProcessingTime > PERFORMANCE_THRESHOLDS.transaction.acceptable) {
      recommendations.push(...OPTIMIZATION_STRATEGIES.slow_transaction);
    }

    // Mobile experience recommendations
    if (summary.pageLoadPerformance.mobilePerformance === 'needs_improvement') {
      recommendations.push(...OPTIMIZATION_STRATEGIES.poor_mobile_experience);
    }

    // Sort by impact
    return recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Get real-time performance dashboard data
   */
  static async getDashboardData(): Promise<any> {
    // This would fetch real data from the database
    return {
      currentLoad: {
        activeUsers: 1247,
        requestsPerSecond: 156,
        averageResponseTime: 892,
        errorRate: 0.012,
      },
      regionalPerformance: {
        zimbabwe: { averageLatency: 340, users: 856 },
        southAfrica: { averageLatency: 280, users: 234 },
        uk: { averageLatency: 120, users: 98 },
        usa: { averageLatency: 180, users: 59 },
      },
      deviceBreakdown: {
        mobile: 78.2,
        desktop: 18.5,
        tablet: 3.3,
      },
      connectionTypes: {
        cellular: 62.4,
        wifi: 35.8,
        unknown: 1.8,
      },
      criticalIssues: [
        {
          type: 'high_latency',
          description: 'Cross-border payment API showing high latency',
          affectedUsers: 45,
          priority: 'high',
        },
        {
          type: 'mobile_performance',
          description: 'Mobile page load times above threshold',
          affectedUsers: 123,
          priority: 'medium',
        },
      ],
    };
  }

  /**
   * Mobile-specific optimizations
   */
  static getMobileOptimizations(): OptimizationStrategy[] {
    return [
      {
        strategy: 'adaptive_loading',
        description: 'Load content based on connection speed and device capabilities',
        impact: 'high',
        implementation: 'Detect connection speed and serve optimized content',
      },
      {
        strategy: 'gesture_optimization',
        description: 'Optimize for touch gestures and mobile interactions',
        impact: 'medium',
        implementation: 'Improve swipe navigation and touch responsiveness',
      },
      {
        strategy: 'battery_optimization',
        description: 'Reduce battery usage through efficient animations and background tasks',
        impact: 'medium',
        implementation: 'Minimize background processing and optimize animations',
      },
      {
        strategy: 'data_saving',
        description: 'Implement data-saving features for users on limited plans',
        impact: 'high',
        implementation: 'Compress images, limit auto-refresh, provide lite mode',
      },
    ];
  }

  /**
   * Emerging markets specific optimizations
   */
  static getEmergingMarketsOptimizations(): OptimizationStrategy[] {
    return [
      {
        strategy: 'offline_first',
        description: 'Design for offline-first experience',
        impact: 'high',
        implementation: 'Cache critical data, queue transactions offline, sync when online',
      },
      {
        strategy: 'low_bandwidth_mode',
        description: 'Provide low-bandwidth mode for slow connections',
        impact: 'high',
        implementation: 'Text-only mode, compressed images, reduced animations',
      },
      {
        strategy: 'progressive_enhancement',
        description: 'Start with basic functionality and enhance based on capabilities',
        impact: 'medium',
        implementation: 'Core features work on all devices, advanced features for capable devices',
      },
      {
        strategy: 'local_caching',
        description: 'Aggressive local caching for frequently accessed data',
        impact: 'high',
        implementation: 'Cache exchange rates, user data, and transaction history locally',
      },
    ];
  }
}

// Performance middleware for automatic metric collection
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Capture original send function
    const originalSend = res.send;
    
    res.send = function(...args: any[]) {
      const duration = Date.now() - startTime;
      const status = res.statusCode >= 400 ? 'error' : 'success';
      
      // Record API performance metric
      PerformanceMonitor.recordMetric({
        metricType: 'api_response',
        endpoint: req.originalUrl,
        duration,
        status,
        metadata: {
          method: req.method,
          statusCode: res.statusCode,
          userAgent: req.headers['user-agent'],
          contentLength: args[0]?.length || 0,
        },
      }).catch(console.error);
      
      // Call original send
      return originalSend.apply(this, args);
    };
    
    next();
  };
}

// Client-side performance tracking utilities
export const ClientPerformanceUtils = {
  /**
   * Measure page load performance
   */
  measurePageLoad: (): PerformanceMetric | null => {
    if (typeof window === 'undefined' || !window.performance) return null;
    
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return null;
    
    return {
      metricType: 'page_load',
      duration: navigation.loadEventEnd - navigation.fetchStart,
      status: 'success',
      metadata: {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: navigation.responseEnd - navigation.fetchStart,
        networkType: (navigator as any).connection?.effectiveType || 'unknown',
      },
    };
  },

  /**
   * Measure transaction performance
   */
  measureTransaction: async (transactionFn: () => Promise<any>): Promise<{ result: any; metric: PerformanceMetric }> => {
    const startTime = Date.now();
    let status: 'success' | 'error' = 'success';
    let errorMessage: string | undefined;
    let result: any;
    
    try {
      result = await transactionFn();
    } catch (error) {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      const metric: PerformanceMetric = {
        metricType: 'transaction_time',
        duration,
        status,
        errorMessage,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      // Send metric to server
      fetch('/api/performance/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(console.error);
      
      return { result, metric };
    }
  },

  /**
   * Get device and connection info
   */
  getDeviceInfo: (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const connection = (navigator as any).connection;
    
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'mobile';
    else if (/iPad|Tablet/i.test(userAgent)) deviceType = 'tablet';
    
    let os = 'unknown';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    
    let browser = 'unknown';
    if (/Chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Safari/i.test(userAgent)) browser = 'Safari';
    else if (/Edge/i.test(userAgent)) browser = 'Edge';
    
    return {
      type: deviceType,
      os,
      browser,
      connectionType: connection?.type || 'unknown',
      connectionSpeed: connection?.effectiveType === '4g' ? 'fast' : 
                     connection?.effectiveType === '3g' ? 'slow' : 'unknown',
    };
  },
};
