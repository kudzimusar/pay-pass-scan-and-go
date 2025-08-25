/**
 * SAGA Pattern Service
 * Implements distributed transaction management using SAGA pattern
 * SAGA Pattern: Enabled
 */

import express from 'express';

const app = express();
app.use(express.json());

interface SagaStep {
  id: string;
  action: string;
  compensationAction: string;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
}

interface SagaTransaction {
  id: string;
  steps: SagaStep[];
  status: 'running' | 'completed' | 'failed' | 'compensating';
  currentStep: number;
}

class SagaOrchestrator {
  private transactions: Map<string, SagaTransaction> = new Map();

  async startSaga(sagaId: string, steps: Omit<SagaStep, 'status'>[]): Promise<void> {
    const transaction: SagaTransaction = {
      id: sagaId,
      steps: steps.map(step => ({ ...step, status: 'pending' })),
      status: 'running',
      currentStep: 0
    };

    this.transactions.set(sagaId, transaction);
    console.log(`SAGA Pattern: Starting transaction ${sagaId}`);
    
    await this.executeNextStep(sagaId);
  }

  private async executeNextStep(sagaId: string): Promise<void> {
    const transaction = this.transactions.get(sagaId);
    if (!transaction || transaction.status !== 'running') return;

    const currentStep = transaction.steps[transaction.currentStep];
    if (!currentStep) {
      transaction.status = 'completed';
      console.log(`SAGA Pattern: Transaction ${sagaId} completed successfully`);
      return;
    }

    try {
      // Simulate step execution
      await this.simulateStepExecution(currentStep);
      currentStep.status = 'completed';
      transaction.currentStep++;
      
      await this.executeNextStep(sagaId);
    } catch (error) {
      console.error(`SAGA Pattern: Step ${currentStep.id} failed:`, error);
      transaction.status = 'compensating';
      await this.compensate(sagaId);
    }
  }

  private async compensate(sagaId: string): Promise<void> {
    const transaction = this.transactions.get(sagaId);
    if (!transaction) return;

    console.log(`SAGA Pattern: Starting compensation for transaction ${sagaId}`);
    
    // Compensate completed steps in reverse order
    for (let i = transaction.currentStep - 1; i >= 0; i--) {
      const step = transaction.steps[i];
      if (step.status === 'completed') {
        try {
          await this.simulateCompensation(step);
          step.status = 'compensated';
        } catch (error) {
          console.error(`SAGA Pattern: Compensation failed for step ${step.id}`);
        }
      }
    }

    transaction.status = 'failed';
    console.log(`SAGA Pattern: Transaction ${sagaId} compensated`);
  }

  private async simulateStepExecution(step: SagaStep): Promise<void> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error(`Step ${step.id} execution failed`);
    }
  }

  private async simulateCompensation(step: SagaStep): Promise<void> {
    // Simulate compensation action
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  getSagaStatus(sagaId: string): SagaTransaction | undefined {
    return this.transactions.get(sagaId);
  }

  getAllSagas(): SagaTransaction[] {
    return Array.from(this.transactions.values());
  }
}

const sagaOrchestrator = new SagaOrchestrator();

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'saga-pattern',
    timestamp: new Date().toISOString()
  });
});

app.post('/saga/start', async (req, res) => {
  try {
    const { sagaId, steps } = req.body;
    
    if (!sagaId || !steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'Saga ID and steps array are required' });
    }

    await sagaOrchestrator.startSaga(sagaId, steps);
    res.json({ message: `SAGA transaction ${sagaId} started` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/saga/:sagaId', (req, res) => {
  const { sagaId } = req.params;
  const saga = sagaOrchestrator.getSagaStatus(sagaId);
  
  if (!saga) {
    return res.status(404).json({ error: 'SAGA transaction not found' });
  }

  res.json(saga);
});

app.get('/sagas', (req, res) => {
  const sagas = sagaOrchestrator.getAllSagas();
  res.json({ sagas, count: sagas.length });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`🔄 SAGA Pattern Service running on port ${PORT}`);
  console.log(`📊 Distributed transaction management enabled`);
});

export { SagaOrchestrator };
export type { SagaStep, SagaTransaction };
