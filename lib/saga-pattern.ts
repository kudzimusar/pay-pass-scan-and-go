/**
 * SAGA Pattern Implementation for Distributed Transactions
 * 
 * Implements the SAGA pattern for managing distributed transactions
 * across microservices with compensating actions for rollback.
 */

import { EventBus, Event, EventTypes } from './event-bus';
import { v4 as uuidv4 } from 'uuid';

export interface SagaStep {
  id: string;
  name: string;
  action: () => Promise<void>;
  compensation: () => Promise<void>;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  error?: Error;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SagaState {
  sagaId: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'compensating';
  currentStep: number;
  steps: SagaStep[];
  data: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  error?: Error;
}

export interface SagaDefinition {
  type: string;
  steps: Omit<SagaStep, 'id' | 'status' | 'error' | 'startedAt' | 'completedAt'>[];
}

export class SagaOrchestrator {
  private eventBus: EventBus;
  private activeSagas: Map<string, SagaState> = new Map();
  private sagaDefinitions: Map<string, SagaDefinition> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Register a saga definition
   */
  registerSaga(definition: SagaDefinition): void {
    this.sagaDefinitions.set(definition.type, definition);
    console.log(`[SagaOrchestrator] Registered saga: ${definition.type}`);
  }

  /**
   * Start a new saga instance
   */
  async startSaga(type: string, data: Record<string, unknown> = {}): Promise<string> {
    const definition = this.sagaDefinitions.get(type);
    if (!definition) {
      throw new Error(`Saga definition not found: ${type}`);
    }

    const sagaId = uuidv4();
    const sagaState: SagaState = {
      sagaId,
      type,
      status: 'running',
      currentStep: 0,
      steps: definition.steps.map(step => ({
        ...step,
        id: uuidv4(),
        status: 'pending',
      })),
      data,
      startedAt: new Date(),
    };

    this.activeSagas.set(sagaId, sagaState);

    // Publish saga started event
    await this.eventBus.publish('saga.started', {
      sagaId,
      type,
      data,
      startedAt: sagaState.startedAt,
    });

    console.log(`[SagaOrchestrator] Started saga: ${type} (${sagaId})`);

    // Execute the first step
    await this.executeNextStep(sagaId);

    return sagaId;
  }

  /**
   * Execute the next step in the saga
   */
  private async executeNextStep(sagaId: string): Promise<void> {
    const saga = this.activeSagas.get(sagaId);
    if (!saga || saga.status !== 'running') {
      return;
    }

    if (saga.currentStep >= saga.steps.length) {
      // All steps completed successfully
      await this.completeSaga(sagaId);
      return;
    }

    const step = saga.steps[saga.currentStep];
    step.status = 'pending';
    step.startedAt = new Date();

    try {
      console.log(`[SagaOrchestrator] Executing step: ${step.name} (${sagaId})`);
      
      await step.action();
      
      step.status = 'completed';
      step.completedAt = new Date();
      saga.currentStep++;

      // Publish step completed event
      await this.eventBus.publish('saga.step.completed', {
        sagaId,
        stepId: step.id,
        stepName: step.name,
        completedAt: step.completedAt,
      });

      // Execute next step
      await this.executeNextStep(sagaId);

    } catch (error) {
      console.error(`[SagaOrchestrator] Step failed: ${step.name} (${sagaId})`, error);
      
      step.status = 'failed';
      step.error = error as Error;
      step.completedAt = new Date();

      // Publish step failed event
      await this.eventBus.publish('saga.step.failed', {
        sagaId,
        stepId: step.id,
        stepName: step.name,
        error: step.error.message,
        failedAt: step.completedAt,
      });

      // Start compensation
      await this.compensateSaga(sagaId);
    }
  }

  /**
   * Compensate a failed saga
   */
  private async compensateSaga(sagaId: string): Promise<void> {
    const saga = this.activeSagas.get(sagaId);
    if (!saga) {
      return;
    }

    saga.status = 'compensating';
    console.log(`[SagaOrchestrator] Starting compensation for saga: ${sagaId}`);

    // Publish compensation started event
    await this.eventBus.publish('saga.compensation.started', {
      sagaId,
      type: saga.type,
      startedAt: new Date(),
    });

    // Execute compensation steps in reverse order
    for (let i = saga.currentStep - 1; i >= 0; i--) {
      const step = saga.steps[i];
      if (step.status === 'completed') {
        try {
          console.log(`[SagaOrchestrator] Compensating step: ${step.name} (${sagaId})`);
          
          await step.compensation();
          
          step.status = 'compensated';
          
          // Publish step compensated event
          await this.eventBus.publish('saga.step.compensated', {
            sagaId,
            stepId: step.id,
            stepName: step.name,
            compensatedAt: new Date(),
          });

        } catch (error) {
          console.error(`[SagaOrchestrator] Compensation failed: ${step.name} (${sagaId})`, error);
          
          step.error = error as Error;
          
          // Publish compensation failed event
          await this.eventBus.publish('saga.compensation.failed', {
            sagaId,
            stepId: step.id,
            stepName: step.name,
            error: step.error.message,
            failedAt: new Date(),
          });

          // Note: In a real system, you might want to implement manual intervention
          // or retry mechanisms for failed compensations
        }
      }
    }

    saga.status = 'failed';
    saga.completedAt = new Date();

    // Publish saga failed event
    await this.eventBus.publish('saga.failed', {
      sagaId,
      type: saga.type,
      failedAt: saga.completedAt,
    });

    console.log(`[SagaOrchestrator] Saga compensation completed: ${sagaId}`);
  }

  /**
   * Complete a successful saga
   */
  private async completeSaga(sagaId: string): Promise<void> {
    const saga = this.activeSagas.get(sagaId);
    if (!saga) {
      return;
    }

    saga.status = 'completed';
    saga.completedAt = new Date();

    // Publish saga completed event
    await this.eventBus.publish('saga.completed', {
      sagaId,
      type: saga.type,
      completedAt: saga.completedAt,
    });

    console.log(`[SagaOrchestrator] Saga completed successfully: ${sagaId}`);
  }

  /**
   * Get saga state
   */
  getSagaState(sagaId: string): SagaState | undefined {
    return this.activeSagas.get(sagaId);
  }

  /**
   * Get all active sagas
   */
  getActiveSagas(): SagaState[] {
    return Array.from(this.activeSagas.values());
  }
}

// Predefined saga definitions for PayPass platform

/**
 * Cross-Border Payment Saga
 * Handles the complex flow of cross-border payments with multiple steps
 */
export const CrossBorderPaymentSaga: SagaDefinition = {
  type: 'cross-border-payment',
  steps: [
    {
      name: 'Validate Sender',
      action: async () => {
        // Validate sender account and KYC status
        console.log('Validating sender...');
        // Implementation would call User Service
      },
      compensation: async () => {
        // No compensation needed for validation
        console.log('Sender validation compensation (no-op)');
      },
    },
    {
      name: 'Reserve Funds',
      action: async () => {
        // Reserve funds in sender's wallet
        console.log('Reserving funds...');
        // Implementation would call Wallet Service
      },
      compensation: async () => {
        // Release reserved funds
        console.log('Releasing reserved funds...');
        // Implementation would call Wallet Service
      },
    },
    {
      name: 'Validate Recipient',
      action: async () => {
        // Validate recipient and compliance requirements
        console.log('Validating recipient...');
        // Implementation would call User Service and Compliance Service
      },
      compensation: async () => {
        // No compensation needed for validation
        console.log('Recipient validation compensation (no-op)');
      },
    },
    {
      name: 'Get Exchange Rate',
      action: async () => {
        // Get current exchange rate
        console.log('Getting exchange rate...');
        // Implementation would call Exchange Rate Service
      },
      compensation: async () => {
        // No compensation needed for exchange rate
        console.log('Exchange rate compensation (no-op)');
      },
    },
    {
      name: 'Process International Transfer',
      action: async () => {
        // Process the actual international transfer
        console.log('Processing international transfer...');
        // Implementation would call Bank Service or Payment Gateway
      },
      compensation: async () => {
        // Attempt to reverse the transfer
        console.log('Reversing international transfer...');
        // Implementation would call Bank Service
      },
    },
    {
      name: 'Update Balances',
      action: async () => {
        // Update sender and recipient balances
        console.log('Updating balances...');
        // Implementation would call Wallet Service
      },
      compensation: async () => {
        // Revert balance changes
        console.log('Reverting balance changes...');
        // Implementation would call Wallet Service
      },
    },
    {
      name: 'Send Notifications',
      action: async () => {
        // Send notifications to both parties
        console.log('Sending notifications...');
        // Implementation would call Notification Service
      },
      compensation: async () => {
        // Send failure notifications
        console.log('Sending failure notifications...');
        // Implementation would call Notification Service
      },
    },
  ],
};

/**
 * User Registration Saga
 * Handles the complete user registration flow including KYC
 */
export const UserRegistrationSaga: SagaDefinition = {
  type: 'user-registration',
  steps: [
    {
      name: 'Create User Account',
      action: async () => {
        // Create basic user account
        console.log('Creating user account...');
        // Implementation would call User Service
      },
      compensation: async () => {
        // Delete user account
        console.log('Deleting user account...');
        // Implementation would call User Service
      },
    },
    {
      name: 'Create Wallet',
      action: async () => {
        // Create user wallet
        console.log('Creating user wallet...');
        // Implementation would call Wallet Service
      },
      compensation: async () => {
        // Delete user wallet
        console.log('Deleting user wallet...');
        // Implementation would call Wallet Service
      },
    },
    {
      name: 'Initiate KYC',
      action: async () => {
        // Start KYC process
        console.log('Initiating KYC...');
        // Implementation would call Compliance Service
      },
      compensation: async () => {
        // Cancel KYC process
        console.log('Canceling KYC...');
        // Implementation would call Compliance Service
      },
    },
    {
      name: 'Send Welcome Notification',
      action: async () => {
        // Send welcome message
        console.log('Sending welcome notification...');
        // Implementation would call Notification Service
      },
      compensation: async () => {
        // Send account deletion notification
        console.log('Sending account deletion notification...');
        // Implementation would call Notification Service
      },
    },
  ],
};

// Singleton instance
let sagaOrchestratorInstance: SagaOrchestrator | null = null;

export function getSagaOrchestrator(): SagaOrchestrator {
  if (!sagaOrchestratorInstance) {
    const eventBus = require('./event-bus').getEventBus();
    sagaOrchestratorInstance = new SagaOrchestrator(eventBus);
    
    // Register predefined sagas
    sagaOrchestratorInstance.registerSaga(CrossBorderPaymentSaga);
    sagaOrchestratorInstance.registerSaga(UserRegistrationSaga);
  }
  return sagaOrchestratorInstance;
}

export function initializeSagaOrchestrator(): void {
  getSagaOrchestrator();
}