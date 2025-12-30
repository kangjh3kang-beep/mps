/**
 * E2E Encryption Vault Tests
 * Verifies field-level encryption functionality
 */

import {
  deriveKeyFromPassword,
  generateKey,
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  EncryptionVault,
  getEncryptionVault,
  resetEncryptionVault,
  isSensitiveField,
  hashData,
  generateSecureToken,
} from '@/lib/security/e2e-encryption';

// Mock Web Crypto API for Node.js environment
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    wrapKey: jest.fn(),
    unwrapKey: jest.fn(),
    digest: jest.fn(),
  },
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  randomUUID: () => 'test-uuid-1234',
};

// Only mock if not in browser
if (typeof window === 'undefined') {
  (global as any).crypto = mockCrypto;
}

describe('E2E Encryption', () => {
  describe('Key Derivation', () => {
    it('should derive key from password', async () => {
      // Skip if no Web Crypto API available
      if (typeof crypto.subtle === 'undefined') {
        console.log('Skipping: Web Crypto API not available');
        return;
      }

      const result = await deriveKeyFromPassword('test-password-123');
      
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('keyId');
      expect(result).toHaveProperty('salt');
      expect(result.keyId).toMatch(/^uk_/);
    });

    it('should generate consistent key with same salt', async () => {
      if (typeof crypto.subtle === 'undefined') {
        return;
      }

      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      const result1 = await deriveKeyFromPassword('test-password', salt);
      const result2 = await deriveKeyFromPassword('test-password', salt);
      
      expect(result1.keyId).toBe(result2.keyId);
    });
  });

  describe('Sensitive Field Detection', () => {
    it('should identify sensitive fields correctly', () => {
      expect(isSensitiveField('blood_glucose')).toBe(true);
      expect(isSensitiveField('blood_pressure')).toBe(true);
      expect(isSensitiveField('heart_rate')).toBe(true);
      expect(isSensitiveField('medical_history')).toBe(true);
      expect(isSensitiveField('biometric_data')).toBe(true);
    });

    it('should not flag non-sensitive fields', () => {
      expect(isSensitiveField('user_id')).toBe(false);
      expect(isSensitiveField('created_at')).toBe(false);
      expect(isSensitiveField('name')).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate token of specified length', () => {
      const token16 = generateSecureToken(16);
      const token32 = generateSecureToken(32);
      
      expect(token16.length).toBe(32); // Each byte = 2 hex chars
      expect(token32.length).toBe(64);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('EncryptionVault Class', () => {
    let vault: EncryptionVault;

    beforeEach(() => {
      resetEncryptionVault();
      vault = new EncryptionVault();
    });

    it('should start in locked state', () => {
      expect(vault.isVaultUnlocked()).toBe(false);
    });

    it('should throw when encrypting while locked', async () => {
      await expect(vault.encrypt('test data')).rejects.toThrow('Vault is locked');
    });

    it('should provide salt for persistence', async () => {
      if (typeof crypto.subtle === 'undefined') {
        return;
      }

      await vault.unlock('password123');
      const salt = vault.getSalt();
      
      expect(salt).toBeTruthy();
      expect(typeof salt).toBe('string');
    });

    it('should lock vault and clear keys', async () => {
      if (typeof crypto.subtle === 'undefined') {
        return;
      }

      await vault.unlock('password123');
      expect(vault.isVaultUnlocked()).toBe(true);
      
      vault.lock();
      expect(vault.isVaultUnlocked()).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same vault instance', () => {
      const vault1 = getEncryptionVault();
      const vault2 = getEncryptionVault();
      
      expect(vault1).toBe(vault2);
    });

    it('should reset and create new instance', () => {
      const vault1 = getEncryptionVault();
      resetEncryptionVault();
      const vault2 = getEncryptionVault();
      
      expect(vault1).not.toBe(vault2);
    });
  });
});

describe('Hash Data', () => {
  it('should produce consistent hashes', async () => {
    if (typeof crypto.subtle === 'undefined') {
      return;
    }

    const hash1 = await hashData('test data');
    const hash2 = await hashData('test data');
    
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', async () => {
    if (typeof crypto.subtle === 'undefined') {
      return;
    }

    const hash1 = await hashData('data 1');
    const hash2 = await hashData('data 2');
    
    expect(hash1).not.toBe(hash2);
  });
});


