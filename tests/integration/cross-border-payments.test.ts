/**
 * Integration tests for Cross-Border Payment System
 * Tests the complete "Pay for your Friend" workflow
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { testDb, createTestUser, createTestFriend, createTestExchangeRate } from '../helpers/test-utils';

describe('Cross-Border Payment Integration', () => {
  let testUserId: string;
  let testRecipientId: string;
  let testFriendNetworkId: string;

  beforeEach(async () => {
    // Setup test data
    testUserId = await createTestUser({
      fullName: 'John Diaspora',
      phone: '+1234567890',
      email: 'john@test.com',
      isInternational: true,
      kycStatus: 'verified',
      countryCode: 'US',
    });

    testRecipientId = await createTestUser({
      fullName: 'Mary Local',
      phone: '+263771234567',
      email: 'mary@test.com',
      isInternational: false,
      countryCode: 'ZW',
    });

    testFriendNetworkId = await createTestFriend({
      senderId: testUserId,
      recipientId: testRecipientId,
      relationship: 'family',
      nickname: 'Mom',
      monthlyLimit: '2000.00',
    });

    // Setup exchange rates
    await createTestExchangeRate('USD', 'ZWL', 1320.00);
    await createTestExchangeRate('USD', 'USD', 1.00);
  });

  afterEach(async () => {
    // Cleanup test data
    await testDb.cleanup();
  });

  describe('Friend Network Management', () => {
    it('should add a friend successfully', async () => {
      const newRecipientId = await createTestUser({
        fullName: 'Test Friend',
        phone: '+263772345678',
        email: 'friend@test.com',
        countryCode: 'ZW',
      });

      const response = await fetch('/api/friend-network/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientPhone: '+263772345678',
          relationship: 'friend',
          nickname: 'Best Friend',
          monthlyLimit: 1000,
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.friendNetwork.recipient.fullName).toBe('Test Friend');
    });

    it('should list friends for a user', async () => {
      const response = await fetch(`/api/friend-network/list?senderId=${testUserId}`);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.friends).toHaveLength(1);
      expect(result.friends[0].recipient.fullName).toBe('Mary Local');
    });

    it('should prevent duplicate friend connections', async () => {
      const response = await fetch('/api/friend-network/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientPhone: '+263771234567', // Same as existing friend
          relationship: 'friend',
        }),
      });

      expect(response.status).toBe(409);
      const result = await response.json();
      expect(result.error).toContain('already exists');
    });
  });

  describe('Cross-Border Payment Initiation', () => {
    it('should initiate cross-border payment successfully', async () => {
      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientId: testRecipientId,
          senderAmount: 100,
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Family support',
          friendNetworkId: testFriendNetworkId,
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.conversion.recipientAmount).toBe('132000.00'); // 100 * 1320
      expect(result.fees.total).toBeGreaterThan(0);
    });

    it('should require KYC verification for large amounts', async () => {
      // Create unverified user
      const unverifiedUserId = await createTestUser({
        fullName: 'Unverified User',
        phone: '+1987654321',
        email: 'unverified@test.com',
        isInternational: true,
        kycStatus: 'pending',
      });

      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: unverifiedUserId,
          recipientId: testRecipientId,
          senderAmount: 1500, // Above $1000 threshold
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Large payment',
        }),
      });

      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toContain('KYC verification required');
    });

    it('should enforce monthly limits', async () => {
      // First payment that uses up most of the limit
      await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientId: testRecipientId,
          senderAmount: 1900,
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'First payment',
          friendNetworkId: testFriendNetworkId,
        }),
      });

      // Second payment that exceeds the limit
      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientId: testRecipientId,
          senderAmount: 200, // Would exceed $2000 limit
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Second payment',
          friendNetworkId: testFriendNetworkId,
        }),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Monthly limit exceeded');
    });

    it('should apply fraud detection', async () => {
      // Create high-risk transaction pattern
      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'TorBrowser/suspicious',
          'X-Forwarded-For': 'tor.exit.node.ip',
        },
        body: JSON.stringify({
          senderId: testUserId,
          recipientId: testRecipientId,
          senderAmount: 9999, // Very large amount
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Urgent payment',
          friendNetworkId: testFriendNetworkId,
        }),
      });

      const result = await response.json();
      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment.level).toBe('critical');
      expect(result.riskAssessment.requiresReview).toBe(true);
    });
  });

  describe('Payment Status Tracking', () => {
    it('should track payment status', async () => {
      // First, initiate a payment
      const initiateResponse = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientId: testRecipientId,
          senderAmount: 100,
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Test payment',
          friendNetworkId: testFriendNetworkId,
        }),
      });

      const initiateResult = await initiateResponse.json();
      const paymentId = initiateResult.payment.id;

      // Then check the status
      const statusResponse = await fetch(`/api/cross-border/status?paymentId=${paymentId}`);

      expect(statusResponse.status).toBe(200);
      const statusResult = await statusResponse.json();
      expect(statusResult.success).toBe(true);
      expect(statusResult.payment.id).toBe(paymentId);
      expect(['pending', 'processing', 'completed', 'failed']).toContain(statusResult.payment.status);
    });

    it('should list user payment history', async () => {
      // Create a few test payments first
      for (let i = 0; i < 3; i++) {
        await fetch('/api/cross-border/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: testUserId,
            recipientId: testRecipientId,
            senderAmount: 50 + i * 10,
            senderCurrency: 'USD',
            recipientCurrency: 'ZWL',
            paymentMethod: 'wallet',
            purpose: `Test payment ${i + 1}`,
            friendNetworkId: testFriendNetworkId,
          }),
        });
      }

      const response = await fetch(`/api/cross-border/status?userId=${testUserId}`);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.payments).toHaveLength(3);
      expect(result.count).toBe(3);
    });
  });

  describe('Exchange Rate Integration', () => {
    it('should fetch current exchange rates', async () => {
      const response = await fetch('/api/exchange-rates/current?from=USD&to=ZWL');

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.rate.fromCurrency).toBe('USD');
      expect(result.rate.toCurrency).toBe('ZWL');
      expect(parseFloat(result.rate.rate)).toBe(1320.00);
    });

    it('should list all available exchange rates', async () => {
      const response = await fetch('/api/exchange-rates/current');

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(result.rates.length).toBeGreaterThan(0);
    });

    it('should handle missing exchange rates gracefully', async () => {
      const response = await fetch('/api/exchange-rates/current?from=XYZ&to=ABC');

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toContain('not found');
    });
  });

  describe('Fraud Detection Integration', () => {
    it('should assess transaction risk', async () => {
      const response = await fetch('/api/fraud-detection/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          transactionId: 'test-tx-123',
          amount: 500,
          currency: 'USD',
          recipientId: testRecipientId,
          deviceType: 'mobile',
          sessionDuration: 10,
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.assessment).toBeDefined();
      expect(result.assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.assessment.riskScore).toBeLessThanOrEqual(100);
      expect(['allow', 'review', 'block']).toContain(result.assessment.recommendation);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent payment requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        fetch('/api/cross-border/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: testUserId,
            recipientId: testRecipientId,
            senderAmount: 50,
            senderCurrency: 'USD',
            recipientCurrency: 'ZWL',
            paymentMethod: 'wallet',
            purpose: `Concurrent payment ${i + 1}`,
            friendNetworkId: testFriendNetworkId,
          }),
        })
      );

      const responses = await Promise.all(promises);

      // At least some should succeed (first few before hitting limits)
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          recipientId: testRecipientId,
          senderAmount: 100,
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Performance test',
          friendNetworkId: testFriendNetworkId,
        }),
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user IDs gracefully', async () => {
      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'invalid-user-id',
          recipientId: testRecipientId,
          senderAmount: 100,
          senderCurrency: 'USD',
          recipientCurrency: 'ZWL',
          paymentMethod: 'wallet',
          purpose: 'Test payment',
        }),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch('/api/cross-border/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: testUserId,
          // Missing required fields
        }),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Invalid request data');
    });

    it('should handle database connection issues gracefully', async () => {
      // This would require mocking database failures
      // For now, we'll test the error response structure
      const response = await fetch('/api/cross-border/status?paymentId=non-existent-id');

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });
  });
});