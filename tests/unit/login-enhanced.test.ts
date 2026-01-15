import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST as loginEnhanced } from '../../app/api/auth/login-enhanced/route';
import { storage } from '../../app/api/_lib/storage';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

describe('Login Enhanced API', () => {
  const mockUser = {
    id: 'user-123',
    fullName: 'John Doe',
    phone: '+263772222222',
    email: 'john@example.com',
    pin: 'hashed_pin',
    walletBalance: 1000,
    mfaEnabled: false,
    accountLocked: false,
    loginAttempts: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage as any).getUserByPhone = jest.fn().mockResolvedValue(mockUser);
    (storage as any).updateUser = jest.fn().mockResolvedValue(true);
    (storage as any).ensureSeeded = jest.fn().mockResolvedValue(true);
    
    // Mock bcrypt.compare
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
  });

  it('should successfully login without MFA', async () => {
    const body = {
      phone: '+263772222222',
      pin: '1234',
    };

    const request = new NextRequest('http://localhost/api/auth/login-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await loginEnhanced(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.requiresMfa).toBeUndefined();
  });

  it('should require MFA if enabled for user', async () => {
    (storage.getUserByPhone as any).mockResolvedValue({
      ...mockUser,
      mfaEnabled: true,
    });

    const body = {
      phone: '+263772222222',
      pin: '1234',
    };

    const request = new NextRequest('http://localhost/api/auth/login-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await loginEnhanced(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.requiresMfa).toBe(true);
    expect(data.mfaToken).toBeDefined();
  });

  it('should fail with invalid PIN', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    const body = {
      phone: '+263772222222',
      pin: 'wrong_pin',
    };

    const request = new NextRequest('http://localhost/api/auth/login-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await loginEnhanced(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid phone number or PIN');
  });

  it('should lock account after 5 failed attempts', async () => {
    (storage.getUserByPhone as any).mockResolvedValue({
      ...mockUser,
      loginAttempts: 4,
    });
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    const body = {
      phone: '+263772222222',
      pin: 'wrong_pin',
    };

    const request = new NextRequest('http://localhost/api/auth/login-enhanced', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await loginEnhanced(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toContain('Account locked');
    expect(storage.updateUser).toHaveBeenCalledWith(mockUser.id, { accountLocked: true });
  });
});
