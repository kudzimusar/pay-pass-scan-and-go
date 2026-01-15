/**
 * Biometric Authentication Module
 * Supports fingerprint, FaceID, and other biometric authentication methods
 */

import { financialLogger } from './financial-logger';

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACEID = 'faceid',
  IRIS = 'iris',
  VOICE = 'voice',
}

export interface BiometricData {
  userId: string;
  biometricType: BiometricType;
  biometricTemplate: string; // Encrypted biometric template
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  failedAttempts: number;
  maxFailedAttempts: number;
}

export interface BiometricVerificationRequest {
  userId: string;
  biometricType: BiometricType;
  biometricData: string; // Raw biometric data (to be processed)
  deviceId?: string;
  ipAddress?: string;
}

export interface BiometricVerificationResult {
  success: boolean;
  userId: string;
  biometricType: BiometricType;
  matchScore: number; // 0-100
  confidence: number; // 0-1
  timestamp: string;
  message: string;
}

/**
 * Biometric Authentication Engine
 */
export class BiometricAuthEngine {
  private biometricStore: Map<string, BiometricData[]> = new Map();
  private readonly MATCH_THRESHOLD = 95; // Minimum match score for approval
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 3600000; // 1 hour in milliseconds

  /**
   * Register a new biometric
   */
  async registerBiometric(
    userId: string,
    biometricType: BiometricType,
    biometricData: string
  ): Promise<BiometricData> {
    try {
      // Process and encrypt biometric data
      const encryptedTemplate = this.encryptBiometricData(biometricData);

      const biometric: BiometricData = {
        userId,
        biometricType,
        biometricTemplate: encryptedTemplate,
        isVerified: false,
        isActive: false,
        createdAt: new Date().toISOString(),
        failedAttempts: 0,
        maxFailedAttempts: this.MAX_FAILED_ATTEMPTS,
      };

      // Store biometric
      if (!this.biometricStore.has(userId)) {
        this.biometricStore.set(userId, []);
      }
      this.biometricStore.get(userId)!.push(biometric);

      // Log biometric registration
      financialLogger.logAudit({
        auditId: `biometric-register-${Date.now()}`,
        userId,
        action: 'register_biometric',
        resource: 'biometric',
        changes: { biometricType, isActive: false },
        status: 'success',
      });

      return biometric;
    } catch (error) {
      console.error('Biometric registration error:', error);
      throw error;
    }
  }

  /**
   * Verify a biometric
   */
  async verifyBiometric(request: BiometricVerificationRequest): Promise<BiometricVerificationResult> {
    const timestamp = new Date().toISOString();

    try {
      // Get stored biometric for user
      const userBiometrics = this.biometricStore.get(request.userId) || [];
      const storedBiometric = userBiometrics.find((b) => b.biometricType === request.biometricType);

      if (!storedBiometric || !storedBiometric.isActive) {
        return {
          success: false,
          userId: request.userId,
          biometricType: request.biometricType,
          matchScore: 0,
          confidence: 0,
          timestamp,
          message: 'Biometric not registered or inactive',
        };
      }

      // Check if account is locked due to failed attempts
      if (storedBiometric.failedAttempts >= storedBiometric.maxFailedAttempts) {
        return {
          success: false,
          userId: request.userId,
          biometricType: request.biometricType,
          matchScore: 0,
          confidence: 0,
          timestamp,
          message: 'Biometric verification locked due to too many failed attempts',
        };
      }

      // Compare biometric data
      const { matchScore, confidence } = this.compareBiometrics(
        storedBiometric.biometricTemplate,
        request.biometricData,
        request.biometricType
      );

      const success = matchScore >= this.MATCH_THRESHOLD;

      if (success) {
        // Reset failed attempts on successful verification
        storedBiometric.failedAttempts = 0;
        storedBiometric.lastUsedAt = timestamp;

        // Log successful verification
        financialLogger.logAudit({
          auditId: `biometric-verify-${Date.now()}`,
          userId: request.userId,
          action: 'verify_biometric',
          resource: 'biometric',
          changes: { biometricType: request.biometricType, success: true },
          status: 'success',
        });
      } else {
        // Increment failed attempts
        storedBiometric.failedAttempts++;

        // Log failed verification
        financialLogger.logAudit({
          auditId: `biometric-verify-failed-${Date.now()}`,
          userId: request.userId,
          action: 'verify_biometric',
          resource: 'biometric',
          changes: {
            biometricType: request.biometricType,
            success: false,
            failedAttempts: storedBiometric.failedAttempts,
          },
          status: 'failure',
        });
      }

      return {
        success,
        userId: request.userId,
        biometricType: request.biometricType,
        matchScore,
        confidence,
        timestamp,
        message: success ? 'Biometric verified successfully' : 'Biometric verification failed',
      };
    } catch (error) {
      console.error('Biometric verification error:', error);
      return {
        success: false,
        userId: request.userId,
        biometricType: request.biometricType,
        matchScore: 0,
        confidence: 0,
        timestamp,
        message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Activate a biometric for a user
   */
  async activateBiometric(userId: string, biometricType: BiometricType): Promise<boolean> {
    const userBiometrics = this.biometricStore.get(userId) || [];
    const biometric = userBiometrics.find((b) => b.biometricType === biometricType);

    if (!biometric) {
      return false;
    }

    biometric.isActive = true;
    biometric.isVerified = true;

    financialLogger.logAudit({
      auditId: `biometric-activate-${Date.now()}`,
      userId,
      action: 'activate_biometric',
      resource: 'biometric',
      changes: { biometricType, isActive: true },
      status: 'success',
    });

    return true;
  }

  /**
   * Deactivate a biometric for a user
   */
  async deactivateBiometric(userId: string, biometricType: BiometricType): Promise<boolean> {
    const userBiometrics = this.biometricStore.get(userId) || [];
    const biometric = userBiometrics.find((b) => b.biometricType === biometricType);

    if (!biometric) {
      return false;
    }

    biometric.isActive = false;

    financialLogger.logAudit({
      auditId: `biometric-deactivate-${Date.now()}`,
      userId,
      action: 'deactivate_biometric',
      resource: 'biometric',
      changes: { biometricType, isActive: false },
      status: 'success',
    });

    return true;
  }

  /**
   * Get active biometrics for a user
   */
  getActiveBiometrics(userId: string): BiometricType[] {
    const userBiometrics = this.biometricStore.get(userId) || [];
    return userBiometrics.filter((b) => b.isActive).map((b) => b.biometricType);
  }

  /**
   * Encrypt biometric data (placeholder - use real encryption in production)
   */
  private encryptBiometricData(data: string): string {
    // In production, use proper encryption (e.g., AES-256)
    return Buffer.from(data).toString('base64');
  }

  /**
   * Compare biometric data with stored template
   */
  private compareBiometrics(
    storedTemplate: string,
    incomingData: string,
    biometricType: BiometricType
  ): { matchScore: number; confidence: number } {
    // In production, use real biometric matching algorithms
    // For now, simulate matching based on data similarity

    const stored = Buffer.from(storedTemplate, 'base64').toString();
    const incoming = incomingData;

    // Simple similarity check (in production, use proper algorithms)
    const similarity = this.calculateSimilarity(stored, incoming);
    const matchScore = similarity * 100;
    const confidence = Math.min(1, similarity + 0.1); // Add some noise

    return { matchScore, confidence };
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return 1 - distance / maxLength;
  }
}

// Export singleton instance
export const biometricAuthEngine = new BiometricAuthEngine();
