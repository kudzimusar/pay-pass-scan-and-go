import { describe, it, expect, jest } from '@jest/globals';

const mockStorage = {
  getUserById: jest.fn(),
};

jest.mock('../../app/api/_lib/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../app/api/_lib/storage';

describe('Mock Test', () => {
  it('should have mockResolvedValue', () => {
    expect(typeof (storage.getUserById as any).mockResolvedValue).toBe('function');
  });
});
