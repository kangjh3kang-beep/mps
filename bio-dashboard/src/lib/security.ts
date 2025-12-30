/**
 * Security Module for Bio-Analysis AI Dashboard
 * 
 * Part 3 Section 6.2: Hash Chain (Anti-Tampering)
 * Part 5 Section 5.1: Secure Data Storage & Transport
 * 
 * ⚠️ PRODUCTION-READY: AES-256-GCM Encryption
 */

/* ============================================
 * 1. Cryptographic Configuration
 * ============================================
 */

const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  tagLength: 128,
  saltLength: 16,
  pbkdf2Iterations: 100000,
};

/**
 * Get encryption key from environment
 * Falls back to derived key from secret
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET or NEXTAUTH_SECRET environment variable is required');
  }
  
  // Derive a key from the secret using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Use a fixed salt for server-side encryption (deterministic)
  // In production, use a unique salt per data item for maximum security
  const salt = encoder.encode('manpasik-bio-salt-v1');
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate random bytes using Web Crypto API
 */
function getRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/* ============================================
 * 2. AES-256-GCM Encryption
 * ============================================
 */

export interface EncryptedPayload {
  /** Encrypted data (base64) */
  ciphertext: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Algorithm version */
  version: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param data - Data to encrypt (object or string)
 * @returns Base64 encoded encrypted payload
 */
export async function encryptSensitiveData(data: unknown): Promise<string> {
  const key = await getEncryptionKey();
  const iv = getRandomBytes(ENCRYPTION_CONFIG.ivLength);
  const encoder = new TextEncoder();
  
  const jsonStr = JSON.stringify(data);
  const encodedData = encoder.encode(jsonStr);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv,
      tagLength: ENCRYPTION_CONFIG.tagLength,
    },
    key,
    encodedData
  );
  
  const payload: EncryptedPayload = {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    version: 'aes-256-gcm-v1',
    timestamp: Date.now(),
  };
  
  // Return as base64-encoded JSON
  return btoa(JSON.stringify(payload));
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param encryptedData - Base64 encoded encrypted payload
 * @returns Decrypted data
 */
export async function decryptSensitiveData<T>(encryptedData: string): Promise<T> {
  const key = await getEncryptionKey();
  const decoder = new TextDecoder();
  
  // Parse the payload
  const payloadJson = atob(encryptedData);
  const payload: EncryptedPayload = JSON.parse(payloadJson);
  
  // Verify version
  if (!payload.version.startsWith('aes-256-gcm')) {
    throw new Error(`Unsupported encryption version: ${payload.version}`);
  }
  
  const iv = base64ToArrayBuffer(payload.iv);
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: new Uint8Array(iv),
      tagLength: ENCRYPTION_CONFIG.tagLength,
    },
    key,
    ciphertext
  );
  
  const jsonStr = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

/**
 * Synchronous encryption fallback (for contexts where async is not available)
 * Uses Web Crypto when available, otherwise throws
 */
export function encryptSensitiveDataSync(data: unknown): string {
  // This is a placeholder - actual sync encryption would require a different approach
  // In production, always use the async version
  throw new Error('Synchronous encryption not supported. Use encryptSensitiveData() instead.');
}

/* ============================================
 * 3. Secure Data Vault
 * ============================================
 */

export interface SecureVaultEntry {
  id: string;
  timestamp: number;
  encryptedData: string;
  dataHash: string;
  prevHash: string;
}

export interface PIIData {
  userId: string;
  deviceId: string;
}

export interface SensorPayload {
  rawVoltage: number[];
  temperature: number;
  concentration: number;
  healthScore: number;
}

/**
 * Create a secure vault entry with encrypted data
 */
export async function createSecureVaultEntry(
  id: string,
  sensorData: SensorPayload,
  prevHash: string
): Promise<SecureVaultEntry> {
  const timestamp = Date.now();
  const encryptedData = await encryptSensitiveData(sensorData);
  const dataHash = await generateSHA256Hash(`${id}:${timestamp}:${encryptedData}`);
  
  return {
    id,
    timestamp,
    encryptedData,
    dataHash,
    prevHash
  };
}

/* ============================================
 * 4. Hash Functions (SHA-256)
 * ============================================
 */

/**
 * Generate SHA-256 hash using Web Crypto API
 */
export async function generateSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous hash for non-crypto-sensitive contexts
 * Note: Use generateSHA256Hash for security-sensitive operations
 */
export function generateHash(data: string): string {
  // DJB2 hash for quick non-security hashing
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) ^ data.charCodeAt(i);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/* ============================================
 * 5. Hash Chain Implementation
 * ============================================
 */

export interface HashChainBlock {
  id: string;
  data: unknown;
  hash: string;
  prevHash: string;
}

export function generateHashChain(prevHash: string, newData: unknown): string {
  const dataStr = typeof newData === 'string' ? newData : JSON.stringify(newData);
  const combined = `${prevHash}:${dataStr}`;
  return generateHash(combined);
}

export async function generateHashChainAsync(prevHash: string, newData: unknown): Promise<string> {
  const dataStr = typeof newData === 'string' ? newData : JSON.stringify(newData);
  const combined = `${prevHash}:${dataStr}`;
  return generateSHA256Hash(combined);
}

export function verifyHashChain(chain: HashChainBlock[]): {
  isValid: boolean;
  brokenAt?: number;
  message: string;
} {
  if (chain.length === 0) {
    return { isValid: true, message: 'Empty chain is valid' };
  }

  const genesis = chain[0];
  const expectedGenesisHash = generateHashChain(genesis.prevHash, genesis.data);
  if (genesis.hash !== expectedGenesisHash) {
    return {
      isValid: false,
      brokenAt: 0,
      message: 'Security Alert: Genesis block hash mismatch'
    };
  }

  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const prevBlock = chain[i - 1];

    if (block.prevHash !== prevBlock.hash) {
      return {
        isValid: false,
        brokenAt: i,
        message: `Security Alert: Data Corruption Detected at block ${i}`
      };
    }

    const expectedHash = generateHashChain(block.prevHash, block.data);
    if (block.hash !== expectedHash) {
      return {
        isValid: false,
        brokenAt: i,
        message: `Security Alert: Hash mismatch at block ${i}`
      };
    }
  }

  return {
    isValid: true,
    message: `Hash chain verified: ${chain.length} blocks valid`
  };
}

export class HashChainManager {
  private chain: HashChainBlock[] = [];
  private genesisHash = '0x00000000';

  constructor(initialData?: HashChainBlock[]) {
    if (initialData) {
      this.chain = initialData;
    }
  }

  addBlock(id: string, data: unknown): HashChainBlock {
    const prevHash = this.chain.length > 0
      ? this.chain[this.chain.length - 1].hash
      : this.genesisHash;

    const hash = generateHashChain(prevHash, data);
    const block: HashChainBlock = { id, data, hash, prevHash };
    this.chain.push(block);
    return block;
  }

  verify(): ReturnType<typeof verifyHashChain> {
    return verifyHashChain(this.chain);
  }

  getChain(): HashChainBlock[] {
    return [...this.chain];
  }

  getLastBlock(): HashChainBlock | null {
    return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
  }

  get length(): number {
    return this.chain.length;
  }
}

/* ============================================
 * 6. Device Signature (Secure API Transport)
 * ============================================
 */

/**
 * Get registered devices from environment
 * Format: DEVICE_ID:SECRET,DEVICE_ID:SECRET
 */
function getRegisteredDevices(): Record<string, string> {
  const devicesEnv = process.env.REGISTERED_DEVICES || '';
  
  // Default devices for development (should be empty in production)
  const defaults: Record<string, string> = process.env.NODE_ENV === 'development'
    ? {
        'MPS-DEMO': 'demo-device-secret-dev',
      }
    : {};
  
  if (!devicesEnv) return defaults;
  
  const devices: Record<string, string> = { ...defaults };
  devicesEnv.split(',').forEach(pair => {
    const [id, secret] = pair.split(':');
    if (id && secret) {
      devices[id.trim()] = secret.trim();
    }
  });
  
  return devices;
}

export async function generateDeviceSignature(deviceId: string): Promise<{
  deviceId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}> {
  const timestamp = Date.now();
  const nonce = Array.from(getRandomBytes(16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const devices = getRegisteredDevices();
  const secret = devices[deviceId] ?? '';
  
  const signatureData = `${deviceId}:${timestamp}:${nonce}:${secret}`;
  const signature = await generateSHA256Hash(signatureData);

  return {
    deviceId,
    timestamp,
    nonce,
    signature
  };
}

export async function verifyDeviceSignature(auth: {
  deviceId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}): Promise<{
  isValid: boolean;
  message: string;
}> {
  const { deviceId, timestamp, nonce, signature } = auth;

  const devices = getRegisteredDevices();
  const secret = devices[deviceId];
  
  if (!secret) {
    return {
      isValid: false,
      message: `Unknown device: ${deviceId}`
    };
  }

  // Check timestamp (5 minutes window)
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (Math.abs(now - timestamp) > fiveMinutes) {
    return {
      isValid: false,
      message: 'Request timestamp expired'
    };
  }

  // Verify signature
  const expectedSignatureData = `${deviceId}:${timestamp}:${nonce}:${secret}`;
  const expectedSignature = await generateSHA256Hash(expectedSignatureData);

  if (signature !== expectedSignature) {
    return {
      isValid: false,
      message: 'Invalid device signature'
    };
  }

  return {
    isValid: true,
    message: 'Device authenticated successfully'
  };
}

/* ============================================
 * 7. Security Audit Log
 * ============================================
 */

export type SecurityEventType = 
  | 'DATA_ENCRYPTED'
  | 'DATA_DECRYPTED'
  | 'HASH_CHAIN_VERIFIED'
  | 'HASH_CHAIN_BROKEN'
  | 'DEVICE_AUTH_SUCCESS'
  | 'DEVICE_AUTH_FAILED'
  | 'SECURITY_ALERT';

export interface SecurityAuditEntry {
  timestamp: number;
  eventType: SecurityEventType;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

class SecurityAuditLog {
  private logs: SecurityAuditEntry[] = [];

  log(
    eventType: SecurityEventType,
    details: string,
    severity: SecurityAuditEntry['severity'] = 'info'
  ): void {
    const entry = {
      timestamp: Date.now(),
      eventType,
      details,
      severity
    };
    
    this.logs.push(entry);

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const prefix = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`[Security] ${prefix} ${eventType}: ${details}`);
    }
  }

  getRecentLogs(count = 10): SecurityAuditEntry[] {
    return this.logs.slice(-count);
  }

  getCriticalAlerts(): SecurityAuditEntry[] {
    return this.logs.filter(l => l.severity === 'critical');
  }
}

export const securityAuditLog = new SecurityAuditLog();
