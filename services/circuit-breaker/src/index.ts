/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for resilient microservices communication
 * Circuit Breaker Pattern: Enabled
 */

import express from 'express';

const app = express();
app.use(express.json());

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN', 
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  retryTimeout: number;
  monitoringWindow: number;
}

interface CircuitMetrics {
  requests: number;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

/**
 * Circuit Breaker Implementation
 * Monitors service health and prevents cascading failures
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private metrics: CircuitMetrics = {
    requests: 0,
    failures: 0,
    successes: 0
  };
  private config: CircuitBreakerConfig;
  private lastOpenTime?: number;
  private serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      timeout: config.timeout || 30000, // 30 seconds
      retryTimeout: config.retryTimeout || 60000, // 1 minute
      monitoringWindow: config.monitoringWindow || 300000 // 5 minutes
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`🔄 Circuit breaker for ${this.serviceName} moved to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
      }
    }

    this.metrics.requests++;

    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise()
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  private onSuccess(): void {
    this.metrics.successes++;
    this.metrics.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.resetMetrics();
      console.log(`✅ Circuit breaker for ${this.serviceName} CLOSED (recovered)`);
    }
  }

  private onFailure(): void {
    this.metrics.failures++;
    this.metrics.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.lastOpenTime = Date.now();
      console.log(`🚨 Circuit breaker for ${this.serviceName} opened from HALF_OPEN`);
    } else if (this.shouldOpenCircuit()) {
      this.state = CircuitState.OPEN;
      this.lastOpenTime = Date.now();
      console.log(`🚨 Circuit breaker for ${this.serviceName} OPENED (failure threshold reached)`);
    }
  }

  private shouldOpenCircuit(): boolean {
    if (this.metrics.requests < this.config.failureThreshold) {
      return false;
    }

    const failureRate = this.metrics.failures / this.metrics.requests;
    return failureRate >= 0.5; // 50% failure rate
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastOpenTime) return false;
    return Date.now() - this.lastOpenTime >= this.config.retryTimeout;
  }

  private resetMetrics(): void {
    this.metrics = {
      requests: 0,
      failures: 0,
      successes: 0
    };
  }

  getStatus() {
    return {
      serviceName: this.serviceName,
      state: this.state,
      metrics: { ...this.metrics },
      config: { ...this.config },
      lastOpenTime: this.lastOpenTime,
      isHealthy: this.state === CircuitState.CLOSED
    };
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastOpenTime = Date.now();
    console.log(`🔧 Circuit breaker for ${this.serviceName} manually opened`);
  }

  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.resetMetrics();
    this.lastOpenTime = undefined;
    console.log(`🔧 Circuit breaker for ${this.serviceName} manually closed`);
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  getOrCreate(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breaker = new CircuitBreaker(serviceName, config);
      this.breakers.set(serviceName, breaker);
      console.log(`🔧 Created circuit breaker for service: ${serviceName}`);
    }
    return this.breakers.get(serviceName)!;
  }

  getAllStatus() {
    const status: Record<string, any> = {};
    this.breakers.forEach((breaker, serviceName) => {
      status[serviceName] = breaker.getStatus();
    });
    return status;
  }

  getHealthySummary() {
    const total = this.breakers.size;
    const healthy = Array.from(this.breakers.values()).filter(b => 
      b.getStatus().isHealthy
    ).length;
    
    return {
      total,
      healthy,
      unhealthy: total - healthy,
      healthyPercentage: total > 0 ? (healthy / total) * 100 : 100
    };
  }

  removeBreaker(serviceName: string): boolean {
    return this.breakers.delete(serviceName);
  }
}

// Global registry instance
const registry = new CircuitBreakerRegistry();

// Pre-configure circuit breakers for known services
const serviceConfigs = {
  'user-service': { failureThreshold: 3, timeout: 5000 },
  'payment-service': { failureThreshold: 2, timeout: 10000 },
  'analytics-service': { failureThreshold: 5, timeout: 15000 },
  'fraud-detection': { failureThreshold: 3, timeout: 8000 },
  'notification-service': { failureThreshold: 4, timeout: 6000 }
};

Object.entries(serviceConfigs).forEach(([serviceName, config]) => {
  registry.getOrCreate(serviceName, config);
});

// API Routes
app.get('/health', (req, res) => {
  const summary = registry.getHealthySummary();
  res.json({
    status: summary.healthyPercentage >= 70 ? 'healthy' : 'degraded',
    service: 'circuit-breaker',
    timestamp: new Date().toISOString(),
    summary
  });
});

app.get('/breakers', (req, res) => {
  res.json(registry.getAllStatus());
});

app.get('/breakers/:serviceName', (req, res) => {
  const { serviceName } = req.params;
  const breaker = registry.getOrCreate(serviceName);
  res.json(breaker.getStatus());
});

app.post('/breakers/:serviceName/execute', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { url, method = 'GET', data, timeout } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const config = timeout ? { timeout } : undefined;
    const breaker = registry.getOrCreate(serviceName, config);

    // Mock operation - in real implementation, make actual HTTP request
    const operation = async () => {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      // Simulate occasional failures for demo
      if (Math.random() < 0.1) { // 10% failure rate
        throw new Error(`Simulated failure for ${serviceName}`);
      }
      
      return {
        service: serviceName,
        url,
        method,
        data,
        response: `Mock response from ${serviceName}`,
        timestamp: new Date().toISOString()
      };
    };

    const result = await breaker.execute(operation);
    res.json({
      success: true,
      result,
      breakerStatus: breaker.getStatus()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message,
      breakerStatus: registry.getOrCreate(req.params.serviceName).getStatus()
    });
  }
});

app.post('/breakers/:serviceName/open', (req, res) => {
  const { serviceName } = req.params;
  const breaker = registry.getOrCreate(serviceName);
  breaker.forceOpen();
  res.json({ message: `Circuit breaker opened for ${serviceName}` });
});

app.post('/breakers/:serviceName/close', (req, res) => {
  const { serviceName } = req.params;
  const breaker = registry.getOrCreate(serviceName);
  breaker.forceClose();
  res.json({ message: `Circuit breaker closed for ${serviceName}` });
});

app.delete('/breakers/:serviceName', (req, res) => {
  const { serviceName } = req.params;
  const removed = registry.removeBreaker(serviceName);
  
  if (removed) {
    res.json({ message: `Circuit breaker removed for ${serviceName}` });
  } else {
    res.status(404).json({ error: `Circuit breaker not found for ${serviceName}` });
  }
});

app.get('/metrics', (req, res) => {
  const status = registry.getAllStatus();
  const metrics = {
    timestamp: new Date().toISOString(),
    services: Object.keys(status).length,
    summary: registry.getHealthySummary(),
    details: Object.entries(status).map(([name, data]) => ({
      service: name,
      state: data.state,
      requests: data.metrics.requests,
      failures: data.metrics.failures,
      successRate: data.metrics.requests > 0 
        ? ((data.metrics.successes / data.metrics.requests) * 100).toFixed(2) + '%'
        : '0%'
    }))
  };
  
  res.json(metrics);
});

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => {
  console.log(`⚡ Circuit Breaker Service running on port ${PORT}`);
  console.log(`🔧 Pre-configured ${Object.keys(serviceConfigs).length} service breakers`);
  console.log(`🛡️  Providing resilience patterns for microservices`);
});

export { CircuitBreaker, CircuitBreakerRegistry, CircuitState };
export type { CircuitBreakerConfig, CircuitMetrics };
