/**
 * Service Discovery Implementation
 * 
 * Provides service registration, discovery, and health checking for microservices
 * using Redis as the service registry backend.
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  version: string;
  health: string;
  metadata: Record<string, unknown>;
  registeredAt: Date;
  lastHeartbeat: Date;
}

export interface ServiceRegistration {
  name: string;
  host: string;
  port: number;
  version: string;
  healthEndpoint?: string;
  metadata?: Record<string, unknown>;
}

export interface ServiceDiscoveryConfig {
  redisUrl: string;
  heartbeatInterval: number; // ms
  healthCheckInterval: number; // ms
  serviceTimeout: number; // ms
  maxRetries: number;
}

export class ServiceDiscovery {
  private redis: Redis;
  private config: ServiceDiscoveryConfig;
  private registeredServices: Map<string, ServiceInstance> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private serviceId: string;

  constructor(config: ServiceDiscoveryConfig) {
    this.redis = new Redis(config.redisUrl);
    this.config = config;
    this.serviceId = uuidv4();
  }

  /**
   * Register a service instance
   */
  async registerService(registration: ServiceRegistration): Promise<string> {
    const serviceId = uuidv4();
    const instance: ServiceInstance = {
      id: serviceId,
      name: registration.name,
      host: registration.host,
      port: registration.port,
      version: registration.version,
      health: 'healthy',
      metadata: registration.metadata || {},
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    // Store in Redis
    const key = `service:${registration.name}:${serviceId}`;
    await this.redis.setex(
      key,
      Math.ceil(this.config.serviceTimeout / 1000),
      JSON.stringify(instance)
    );

    // Add to service index
    await this.redis.sadd(`services:${registration.name}`, serviceId);
    await this.redis.sadd('services:all', registration.name);

    this.registeredServices.set(serviceId, instance);

    console.log(`[ServiceDiscovery] Registered service: ${registration.name} (${serviceId})`);
    return serviceId;
  }

  /**
   * Deregister a service instance
   */
  async deregisterService(serviceId: string): Promise<void> {
    const instance = this.registeredServices.get(serviceId);
    if (!instance) {
      return;
    }

    // Remove from Redis
    const key = `service:${instance.name}:${serviceId}`;
    await this.redis.del(key);
    await this.redis.srem(`services:${instance.name}`, serviceId);

    // Remove from local cache
    this.registeredServices.delete(serviceId);

    console.log(`[ServiceDiscovery] Deregistered service: ${instance.name} (${serviceId})`);
  }

  /**
   * Discover service instances
   */
  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    // Get service IDs from Redis
    const serviceIds = await this.redis.smembers(`services:${serviceName}`);
    
    if (serviceIds.length === 0) {
      return [];
    }

    // Get service instances
    const instances: ServiceInstance[] = [];
    for (const serviceId of serviceIds) {
      const key = `service:${serviceName}:${serviceId}`;
      const data = await this.redis.get(key);
      
      if (data) {
        const instance = JSON.parse(data) as ServiceInstance;
        if (instance.health === 'healthy') {
          instances.push(instance);
        }
      }
    }

    return instances;
  }

  /**
   * Get all registered services
   */
  async getAllServices(): Promise<string[]> {
    return await this.redis.smembers('services:all');
  }

  /**
   * Get service instance by ID
   */
  async getServiceInstance(serviceName: string, serviceId: string): Promise<ServiceInstance | null> {
    const key = `service:${serviceName}:${serviceId}`;
    const data = await this.redis.get(key);
    
    if (data) {
      return JSON.parse(data) as ServiceInstance;
    }
    
    return null;
  }

  /**
   * Send heartbeat for a service
   */
  async sendHeartbeat(serviceId: string): Promise<void> {
    const instance = this.registeredServices.get(serviceId);
    if (!instance) {
      return;
    }

    instance.lastHeartbeat = new Date();
    
    // Update in Redis
    const key = `service:${instance.name}:${serviceId}`;
    await this.redis.setex(
      key,
      Math.ceil(this.config.serviceTimeout / 1000),
      JSON.stringify(instance)
    );
  }

  /**
   * Start heartbeat for all registered services
   */
  startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      for (const serviceId of this.registeredServices.keys()) {
        await this.sendHeartbeat(serviceId);
      }
    }, this.config.heartbeatInterval);

    console.log(`[ServiceDiscovery] Started heartbeat (${this.config.heartbeatInterval}ms interval)`);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
      console.log('[ServiceDiscovery] Stopped heartbeat');
    }
  }

  /**
   * Start health checking for discovered services
   */
  startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      const allServices = await this.getAllServices();
      
      for (const serviceName of allServices) {
        const instances = await this.discoverService(serviceName);
        
        for (const instance of instances) {
          await this.checkServiceHealth(instance);
        }
      }
    }, this.config.healthCheckInterval);

    console.log(`[ServiceDiscovery] Started health checking (${this.config.healthCheckInterval}ms interval)`);
  }

  /**
   * Stop health checking
   */
  stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('[ServiceDiscovery] Stopped health checking');
    }
  }

  /**
   * Check health of a service instance
   */
  private async checkServiceHealth(instance: ServiceInstance): Promise<void> {
    try {
      const healthUrl = instance.metadata.healthEndpoint as string || 
                       `http://${instance.host}:${instance.port}/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const isHealthy = response.ok;
      const newHealth = isHealthy ? 'healthy' : 'unhealthy';

      if (instance.health !== newHealth) {
        instance.health = newHealth;
        
        // Update in Redis
        const key = `service:${instance.name}:${instance.id}`;
        await this.redis.setex(
          key,
          Math.ceil(this.config.serviceTimeout / 1000),
          JSON.stringify(instance)
        );

        console.log(`[ServiceDiscovery] Service ${instance.name} (${instance.id}) health changed to ${newHealth}`);
      }
    } catch (error) {
      // Mark as unhealthy on error
      if (instance.health !== 'unhealthy') {
        instance.health = 'unhealthy';
        
        // Update in Redis
        const key = `service:${instance.name}:${instance.id}`;
        await this.redis.setex(
          key,
          Math.ceil(this.config.serviceTimeout / 1000),
          JSON.stringify(instance)
        );

        console.log(`[ServiceDiscovery] Service ${instance.name} (${instance.id}) marked as unhealthy`);
      }
    }
  }

  /**
   * Get service URL for load balancing
   */
  async getServiceUrl(serviceName: string): Promise<string | null> {
    const instances = await this.discoverService(serviceName);
    
    if (instances.length === 0) {
      return null;
    }

    // Simple round-robin load balancing
    const instance = instances[Math.floor(Math.random() * instances.length)];
    return `http://${instance.host}:${instance.port}`;
  }

  /**
   * Get all healthy instances of a service
   */
  async getHealthyInstances(serviceName: string): Promise<ServiceInstance[]> {
    const instances = await this.discoverService(serviceName);
    return instances.filter(instance => instance.health === 'healthy');
  }

  /**
   * Clean up expired services
   */
  async cleanupExpiredServices(): Promise<void> {
    const allServices = await this.getAllServices();
    
    for (const serviceName of allServices) {
      const serviceIds = await this.redis.smembers(`services:${serviceName}`);
      
      for (const serviceId of serviceIds) {
        const key = `service:${serviceName}:${serviceId}`;
        const exists = await this.redis.exists(key);
        
        if (!exists) {
          await this.redis.srem(`services:${serviceName}`, serviceId);
          console.log(`[ServiceDiscovery] Cleaned up expired service: ${serviceName} (${serviceId})`);
        }
      }
    }
  }

  /**
   * Stop the service discovery
   */
  async stop(): Promise<void> {
    this.stopHeartbeat();
    this.stopHealthChecking();
    
    // Deregister all services
    for (const serviceId of this.registeredServices.keys()) {
      await this.deregisterService(serviceId);
    }
    
    await this.redis.quit();
    console.log('[ServiceDiscovery] Stopped');
  }
}

/**
 * Service Discovery Client for making requests to discovered services
 */
export class ServiceDiscoveryClient {
  private serviceDiscovery: ServiceDiscovery;
  private circuitBreakers: Map<string, any> = new Map();

  constructor(serviceDiscovery: ServiceDiscovery) {
    this.serviceDiscovery = serviceDiscovery;
  }

  /**
   * Make a request to a service with automatic discovery and load balancing
   */
  async request<T>(
    serviceName: string,
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = await this.serviceDiscovery.getServiceUrl(serviceName);
    if (!url) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const fullUrl = `${url}${path}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make a GET request to a service
   */
  async get<T>(serviceName: string, path: string): Promise<T> {
    return this.request<T>(serviceName, path, { method: 'GET' });
  }

  /**
   * Make a POST request to a service
   */
  async post<T>(serviceName: string, path: string, data: unknown): Promise<T> {
    return this.request<T>(serviceName, path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PUT request to a service
   */
  async put<T>(serviceName: string, path: string, data: unknown): Promise<T> {
    return this.request<T>(serviceName, path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a DELETE request to a service
   */
  async delete<T>(serviceName: string, path: string): Promise<T> {
    return this.request<T>(serviceName, path, { method: 'DELETE' });
  }
}

// Default configuration
export const DefaultServiceDiscoveryConfig: ServiceDiscoveryConfig = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  heartbeatInterval: 30000, // 30 seconds
  healthCheckInterval: 60000, // 1 minute
  serviceTimeout: 120000, // 2 minutes
  maxRetries: 3,
};

// Singleton instances
let serviceDiscoveryInstance: ServiceDiscovery | null = null;
let serviceDiscoveryClientInstance: ServiceDiscoveryClient | null = null;

export function getServiceDiscovery(): ServiceDiscovery {
  if (!serviceDiscoveryInstance) {
    serviceDiscoveryInstance = new ServiceDiscovery(DefaultServiceDiscoveryConfig);
  }
  return serviceDiscoveryInstance;
}

export function getServiceDiscoveryClient(): ServiceDiscoveryClient {
  if (!serviceDiscoveryClientInstance) {
    const serviceDiscovery = getServiceDiscovery();
    serviceDiscoveryClientInstance = new ServiceDiscoveryClient(serviceDiscovery);
  }
  return serviceDiscoveryClientInstance;
}

export function initializeServiceDiscovery(): Promise<void> {
  const serviceDiscovery = getServiceDiscovery();
  serviceDiscovery.startHeartbeat();
  serviceDiscovery.startHealthChecking();
  return Promise.resolve();
}