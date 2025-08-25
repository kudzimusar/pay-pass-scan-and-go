/**
 * Circuit Breaker Pattern Implementation
 * 
 * Provides fault tolerance and resilience for microservices communication
 * by preventing cascading failures and providing fallback mechanisms.
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  recoveryTimeout: number;       // Time in ms to wait before attempting recovery
  monitoringPeriod: number;      // Time window for failure counting
  expectedExceptions?: string[]; // Exception types that should not count as failures
}

export interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
  totalRequests: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 60000, // 1 minute
      expectedExceptions: [],
      ...config,
    };

    this.state = {
      status: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async call<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.state.totalRequests++;

    if (this.state.status === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state.status = 'HALF_OPEN';
        console.log(`[CircuitBreaker:${this.name}] Circuit is HALF_OPEN, attempting reset`);
      } else {
        console.log(`[CircuitBreaker:${this.name}] Circuit is OPEN, using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      
      if (fallback) {
        console.log(`[CircuitBreaker:${this.name}] Operation failed, using fallback`);
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.state.lastFailureTime || !this.state.nextAttemptTime) {
      return false;
    }

    return new Date() >= this.state.nextAttemptTime;
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.state.failureCount = 0;
    this.state.successCount++;
    this.state.lastFailureTime = undefined;
    this.state.nextAttemptTime = undefined;

    if (this.state.status === 'HALF_OPEN') {
      this.state.status = 'CLOSED';
      console.log(`[CircuitBreaker:${this.name}] Circuit reset to CLOSED`);
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error): void {
    // Check if this is an expected exception
    if (this.config.expectedExceptions?.some(exceptionType => 
      error.constructor.name === exceptionType || error.name === exceptionType
    )) {
      return; // Don't count expected exceptions as failures
    }

    this.state.failureCount++;
    this.state.lastFailureTime = new Date();

    if (this.state.status === 'HALF_OPEN') {
      this.state.status = 'OPEN';
      this.state.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
      console.log(`[CircuitBreaker:${this.name}] Circuit opened again after failed reset attempt`);
    } else if (this.state.failureCount >= this.config.failureThreshold) {
      this.state.status = 'OPEN';
      this.state.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
      console.log(`[CircuitBreaker:${this.name}] Circuit opened after ${this.state.failureCount} failures`);
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = {
      status: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
    };
    console.log(`[CircuitBreaker:${this.name}] Manually reset`);
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    const failureRate = this.state.totalRequests > 0 
      ? (this.state.failureCount / this.state.totalRequests) * 100 
      : 0;

    return {
      name: this.name,
      status: this.state.status,
      failureCount: this.state.failureCount,
      successCount: this.state.successCount,
      totalRequests: this.state.totalRequests,
      failureRate: `${failureRate.toFixed(2)}%`,
      lastFailureTime: this.state.lastFailureTime,
      nextAttemptTime: this.state.nextAttemptTime,
    };
  }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats() {
    return Array.from(this.breakers.values()).map(breaker => breaker.getStats());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

/**
 * HTTP Client with Circuit Breaker
 */
export class ResilientHttpClient {
  private circuitBreaker: CircuitBreaker;
  private baseUrl: string;
  private timeout: number;

  constructor(
    serviceName: string,
    baseUrl: string,
    config?: Partial<CircuitBreakerConfig>,
    timeout: number = 10000
  ) {
    this.circuitBreaker = new CircuitBreaker(serviceName, config);
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Make a GET request with circuit breaker protection
   */
  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.circuitBreaker.call(
      async () => {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      async () => {
        // Fallback response
        console.log(`[ResilientHttpClient:${this.circuitBreaker.getState().status}] Using fallback for GET ${path}`);
        return {} as T;
      }
    );
  }

  /**
   * Make a POST request with circuit breaker protection
   */
  async post<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.circuitBreaker.call(
      async () => {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      async () => {
        // Fallback response
        console.log(`[ResilientHttpClient:${this.circuitBreaker.getState().status}] Using fallback for POST ${path}`);
        return {} as T;
      }
    );
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return this.circuitBreaker.getStats();
  }
}

// Predefined circuit breaker configurations for different services
export const CircuitBreakerConfigs = {
  // Payment services - high reliability required
  PAYMENT_SERVICE: {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
    expectedExceptions: ['ValidationError', 'InsufficientFundsError'],
  },

  // User services - moderate reliability
  USER_SERVICE: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minutes
    expectedExceptions: ['ValidationError', 'UserNotFoundError'],
  },

  // External services - more lenient
  EXTERNAL_SERVICE: {
    failureThreshold: 10,
    recoveryTimeout: 120000, // 2 minutes
    monitoringPeriod: 300000, // 5 minutes
    expectedExceptions: ['TimeoutError', 'NetworkError'],
  },

  // Analytics services - read-only, more lenient
  ANALYTICS_SERVICE: {
    failureThreshold: 8,
    recoveryTimeout: 90000, // 1.5 minutes
    monitoringPeriod: 300000, // 5 minutes
    expectedExceptions: ['DataNotFoundError'],
  },
} as const;

// Global circuit breaker manager
let circuitBreakerManagerInstance: CircuitBreakerManager | null = null;

export function getCircuitBreakerManager(): CircuitBreakerManager {
  if (!circuitBreakerManagerInstance) {
    circuitBreakerManagerInstance = new CircuitBreakerManager();
  }
  return circuitBreakerManagerInstance;
}

// Helper function to create resilient HTTP clients for different services
export function createResilientHttpClient(
  serviceName: string,
  baseUrl: string,
  configKey?: keyof typeof CircuitBreakerConfigs
): ResilientHttpClient {
  const config = configKey ? CircuitBreakerConfigs[configKey] : undefined;
  return new ResilientHttpClient(serviceName, baseUrl, config);
}