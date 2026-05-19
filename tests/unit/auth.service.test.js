import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthService } from '../../src/services/auth.service.js';

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$argon2id$hashed'),
    verify: vi.fn().mockResolvedValue(true),
  },
}));

import argon2 from 'argon2';

describe('AuthService', () => {
  let mockUserRepo;
  let service;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
    };
    service = createAuthService({ userRepo: mockUserRepo });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('hashes password and saves user on new email', async () => {
      const result = await service.register({ email: 'test@example.com', password: 'secret123' });
      expect(argon2.hash).toHaveBeenCalledWith('secret123');
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '$argon2id$hashed',
      });
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('throws 409 when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
      await expect(service.register({ email: 'test@example.com', password: 'secret123' })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Email already registered',
      });
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyCredentials', () => {
    const STORED_USER = { id: 1, email: 'test@example.com', password: '$argon2id$hashed' };

    it('returns user without password on valid credentials', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(STORED_USER);
      argon2.verify.mockResolvedValue(true);
      const result = await service.verifyCredentials({ email: 'test@example.com', password: 'secret123' });
      expect(argon2.verify).toHaveBeenCalledWith(STORED_USER.password, 'secret123');
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
      expect(result).not.toHaveProperty('password');
    });

    it('returns null on wrong password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(STORED_USER);
      argon2.verify.mockResolvedValue(false);
      const result = await service.verifyCredentials({ email: 'test@example.com', password: 'wrong' });
      expect(result).toBeNull();
    });

    it('returns null when user not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      const result = await service.verifyCredentials({ email: 'nobody@test.com', password: 'secret' });
      expect(result).toBeNull();
      expect(argon2.verify).not.toHaveBeenCalled();
    });
  });
});
