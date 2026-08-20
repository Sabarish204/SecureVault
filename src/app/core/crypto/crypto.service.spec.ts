import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService();
  });

  it('should generate 16-byte random salt', () => {
    const salt1 = service.generateSalt();
    const salt2 = service.generateSalt();
    expect(salt1.byteLength).toBe(16);
    expect(salt2.byteLength).toBe(16);
    expect(salt1).not.toEqual(salt2);
  });

  it('should generate 12-byte random IV', () => {
    const iv1 = service.generateIv();
    const iv2 = service.generateIv();
    expect(iv1.byteLength).toBe(12);
    expect(iv2.byteLength).toBe(12);
    expect(iv1).not.toEqual(iv2);
  });

  it('should derive an AES-GCM CryptoKey from password and salt', async () => {
    const salt = service.generateSalt();
    const key = await service.deriveKey('TestMasterPassword123!', salt, 1000); // 1k for faster test speed
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.extractable).toBe(false);
  });

  it('should encrypt and decrypt a structured object payload', async () => {
    const salt = service.generateSalt();
    const key = await service.deriveKey('TestMasterPassword123!', salt, 1000);

    const testSecretData = {
      bankName: 'Test Bank',
      username: 'demo.user',
      password: 'NOT-A-REAL-PASSWORD-1234',
      cardNumber: '4111111111111111',
      cvv: '123'
    };

    const encrypted = await service.encrypt(testSecretData, key);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toContain('NOT-A-REAL-PASSWORD');
    expect(encrypted.ciphertext).not.toContain('4111111111111111');

    const decrypted = await service.decrypt<typeof testSecretData>(encrypted, key);
    expect(decrypted).toEqual(testSecretData);
  });

  it('should generate unique IV and ciphertext for identical plaintexts', async () => {
    const salt = service.generateSalt();
    const key = await service.deriveKey('TestMasterPassword123!', salt, 1000);

    const plain = { secret: 'identical-secret' };
    const enc1 = await service.encrypt(plain, key);
    const enc2 = await service.encrypt(plain, key);

    expect(enc1.iv).not.toEqual(enc2.iv);
    expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
  });

  it('should reject tampered or corrupted ciphertext', async () => {
    const salt = service.generateSalt();
    const key = await service.deriveKey('TestMasterPassword123!', salt, 1000);

    const encrypted = await service.encrypt({ message: 'confidential' }, key);

    // Tamper with ciphertext by altering characters
    const tamperedCiphertext = encrypted.ciphertext.substring(0, 4) + 'AAAA' + encrypted.ciphertext.substring(8);
    const tamperedPayload = {
      iv: encrypted.iv,
      ciphertext: tamperedCiphertext
    };

    await expect(service.decrypt(tamperedPayload, key)).rejects.toThrow();
  });

  it('should create and verify zero-knowledge vault metadata', async () => {
    const { metadata, masterKey } = await service.createVaultMetadata('MyStrongVaultPass123!', 5);
    expect(metadata.salt).toBeDefined();
    expect(metadata.authCheck).toBeDefined();
    expect(masterKey).toBeDefined();

    // Verify with correct password
    const verifiedKey = await service.verifyMasterPassword('MyStrongVaultPass123!', metadata);
    expect(verifiedKey).toBeDefined();

    // Verify with wrong password
    await expect(
      service.verifyMasterPassword('WrongPassword123!', metadata)
    ).rejects.toThrow('Invalid master password.');
  });
});
