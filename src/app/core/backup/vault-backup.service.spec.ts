import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CryptoService } from '../crypto/crypto.service';
import { BackupCryptoService } from './backup-crypto.service';
import { BackupMigrationService } from './backup-migration.service';
import { DecryptedBackupPayload } from '../../shared/models/backup.model';

describe('VaultBackupCrypto & Migration Suite', () => {
  let backupCrypto: BackupCryptoService;
  let migration: BackupMigrationService;

  const TEST_PASSWORD = 'TestMasterPassword123!';
  const WRONG_PASSWORD = 'WrongPassword999!';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptoService, BackupCryptoService, BackupMigrationService]
    });

    backupCrypto = TestBed.inject(BackupCryptoService);
    migration = TestBed.inject(BackupMigrationService);
  });

  const mockPayload: Omit<DecryptedBackupPayload, 'checksum'> = {
    formatVersion: 1,
    metadata: {
      autoLockMinutes: 5,
      createdAt: 1724270000000,
      updatedAt: 1724275000000
    },
    items: [
      {
        id: 'item-1',
        category: 'BANKING',
        title: 'SBI Salary Account',
        subtitle: 'State Bank of India',
        createdAt: 1724271000000,
        updatedAt: 1724272000000,
        payload: {
          bankName: 'State Bank of India',
          accountNumber: '123456789012',
          ifsc: 'SBIN0001234',
          cifNumber: '99887766554'
        } as any
      },
      {
        id: 'item-2',
        category: 'CREDIT_CARD',
        title: 'HDFC Regalia Gold',
        subtitle: 'HDFC Bank',
        createdAt: 1724273000000,
        updatedAt: 1724274000000,
        payload: {
          cardholderName: 'Sabarish',
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2028',
          cvv: '999',
          cardType: 'CREDIT',
          network: 'VISA'
        } as any
      }
    ]
  };

  it('should create a valid encrypted .svbackup envelope with zero plaintext leakage', async () => {
    const envelope = await backupCrypto.createBackupEnvelope(mockPayload, TEST_PASSWORD, '1.0.4');

    expect(envelope.appName).toBe('SecureVault');
    expect(envelope.formatVersion).toBe(1);
    expect(envelope.appVersion).toBe('1.0.4');
    expect(envelope.recordCount).toBe(2);
    expect(envelope.kdf.algorithm).toBe('PBKDF2-HMAC-SHA256');
    expect(envelope.kdf.iterations).toBe(600000);
    expect(envelope.kdf.salt).toBeTruthy();
    expect(envelope.encryption.algorithm).toBe('AES-256-GCM');
    expect(envelope.encryption.iv).toBeTruthy();
    expect(envelope.encryptedPayload).toBeTruthy();

    // Verify plaintext secrets are NOT in the raw envelope JSON
    const envelopeJson = JSON.stringify(envelope);
    expect(envelopeJson).not.toContain('123456789012');
    expect(envelopeJson).not.toContain('4111111111111111');
    expect(envelopeJson).not.toContain('SBIN0001234');
    expect(envelopeJson).not.toContain('999');
  });

  it('should decrypt and verify backup payload with correct master password', async () => {
    const envelope = await backupCrypto.createBackupEnvelope(mockPayload, TEST_PASSWORD, '1.0.4');
    const decrypted = await backupCrypto.decryptBackupEnvelope(envelope, TEST_PASSWORD);

    expect(decrypted.formatVersion).toBe(1);
    expect(decrypted.metadata.autoLockMinutes).toBe(5);
    expect(decrypted.items.length).toBe(2);
    expect(decrypted.items[0].title).toBe('SBI Salary Account');
    expect((decrypted.items[0].payload as any).accountNumber).toBe('123456789012');
    expect(decrypted.items[1].title).toBe('HDFC Regalia Gold');
    expect((decrypted.items[1].payload as any).cardNumber).toBe('4111111111111111');
    expect(decrypted.checksum).toBeTruthy();
  });

  it('should reject decryption with incorrect master password', async () => {
    const envelope = await backupCrypto.createBackupEnvelope(mockPayload, TEST_PASSWORD, '1.0.4');

    await expect(
      backupCrypto.decryptBackupEnvelope(envelope, WRONG_PASSWORD)
    ).rejects.toThrow(/Incorrect backup password/i);
  });

  it('should detect corrupted or tampered ciphertext', async () => {
    const envelope = await backupCrypto.createBackupEnvelope(mockPayload, TEST_PASSWORD, '1.0.4');

    // Tamper with encrypted payload
    envelope.encryptedPayload = envelope.encryptedPayload.substring(0, envelope.encryptedPayload.length - 8) + 'AAAAAAAA';

    await expect(
      backupCrypto.decryptBackupEnvelope(envelope, TEST_PASSWORD)
    ).rejects.toThrow();
  });

  it('should reject unsupported future backup format versions in migration', () => {
    const futurePayload = {
      formatVersion: 99,
      metadata: { autoLockMinutes: 3 },
      items: [],
      checksum: 'abc'
    };

    expect(() => migration.migrateToCurrent(futurePayload as any)).toThrow(/newer version of SecureVault/i);
  });

  it('should safely normalize and migrate v1 backup items', () => {
    const v1Payload: DecryptedBackupPayload = {
      formatVersion: 1,
      metadata: { autoLockMinutes: 10 },
      items: [
        {
          id: '',
          category: 'BANKING',
          title: '  Axis Bank  ',
          subtitle: '',
          createdAt: 0,
          updatedAt: 0,
          payload: { bankName: 'Axis Bank' } as any
        }
      ],
      checksum: 'dummy'
    };

    const migrated = migration.migrateToCurrent(v1Payload);
    expect(migrated.items[0].id).toBeTruthy();
    expect(migrated.items[0].title).toBe('Axis Bank');
    expect(migrated.items[0].createdAt).toBeGreaterThan(0);
    expect(migrated.metadata.autoLockMinutes).toBe(10);
  });
});
