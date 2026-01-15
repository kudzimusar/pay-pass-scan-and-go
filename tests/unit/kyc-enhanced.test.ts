import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST as submitKyc } from '../../app/api/identity/submit-enhanced/route';
import { db } from '../../app/api/_lib/drizzle';
import { NextRequest } from 'next/server';

describe('KYC Enhanced API', () => {
  const mockUser = {
    id: 'user-123',
    kycStatus: 'pending',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Manual mocking for ESM
    const mockLimit = jest.fn().mockResolvedValue([mockUser]);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    (db as any).select = jest.fn().mockReturnValue({ from: mockFrom });

    const mockReturning = jest.fn().mockResolvedValue([{ id: 'verify-123', status: 'pending', createdAt: new Date(), documentType: 'passport' }]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    (db as any).insert = jest.fn().mockReturnValue({ values: mockValues });

    const mockUpdateWhere = jest.fn().mockResolvedValue(true);
    const mockSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    (db as any).update = jest.fn().mockReturnValue({ set: mockSet });
  });

  it('should successfully submit KYC with valid data', async () => {
    const body = {
      userId: 'user-123',
      documentType: 'passport',
      documentNumber: 'AB123456',
      documentCountry: 'ZW',
      documentExpiry: new Date(Date.now() + 1000000).toISOString(),
      frontImageUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    };

    const request = new NextRequest('http://localhost/api/identity/submit-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await submitKyc(request);
    const data = await response.json();

    if (response.status !== 200) {
      console.log('Error response:', data);
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.verification.automatedChecks.passed).toBe(true);
  });

  it('should fail if document is expired', async () => {
    const body = {
      userId: 'user-123',
      documentType: 'passport',
      documentNumber: 'AB123456',
      documentCountry: 'ZW',
      documentExpiry: new Date(Date.now() - 1000000).toISOString(), // Expired
      frontImageUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    };

    const request = new NextRequest('http://localhost/api/identity/submit-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await submitKyc(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Document has expired');
  });

  it('should fail if document number format is invalid', async () => {
    const body = {
      userId: 'user-123',
      documentType: 'passport',
      documentNumber: '123', // Too short for passport
      documentCountry: 'ZW',
      frontImageUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    };

    const request = new NextRequest('http://localhost/api/identity/submit-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await submitKyc(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContain('Invalid passport number format');
  });
});
