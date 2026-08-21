import { Injectable, inject } from '@angular/core';
import { CryptoService } from '../crypto/crypto.service';
import {
  DecryptedBackupPayload,
  SecureVaultBackupEnvelope
} from '../../shared/models/backup.model';

const BACKUP_AUTH_MAGIC_PHRASE = 'SECURE_VAULT_BACKUP_AUTH_OK_V1';
const BACKUP_PBKDF2_ITERATIONS = 600000;
const CURRENT_FORMAT_VERSION = 1;

@Injectable({
  providedIn: 'root'
})
export class BackupCryptoService {
  private readonly crypto = inject(CryptoService);
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  /**
   * Encrypts vault payload into a versioned SecureVaultBackupEnvelope (.svbackup).
   */
  async createBackupEnvelope(
    payload: Omit<DecryptedBackupPayload, 'checksum'>,
    masterPassword: string,
    appVersion: string = '1.0.0'
  ): Promise<SecureVaultBackupEnvelope> {
    if (!masterPassword || masterPassword.trim().length === 0) {
      throw new Error('Master password is required to encrypt backup.');
    }

    // 1. Calculate SHA-256 integrity checksum of the items payload
    const itemsJson = JSON.stringify(payload.items || []);
    const checksum = await this.computeSha256(itemsJson);

    const fullPayload: DecryptedBackupPayload = {
      formatVersion: CURRENT_FORMAT_VERSION,
      metadata: payload.metadata,
      items: payload.items,
      checksum
    };

    // 2. Generate independent cryptographically secure salt and derive AES-256-GCM key
    const salt = this.crypto.generateSalt();
    const backupKey = await this.crypto.deriveKey(masterPassword, salt, BACKUP_PBKDF2_ITERATIONS);

    // 3. Create Auth Check token for safe pre-verification on import
    const authCheckEncrypted = await this.crypto.encrypt(BACKUP_AUTH_MAGIC_PHRASE, backupKey);

    // 4. Encrypt full payload with AES-256-GCM
    const iv = this.crypto.generateIv();
    const payloadJson = JSON.stringify(fullPayload);
    const plaintextBuffer = this.encoder.encode(payloadJson);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      backupKey,
      plaintextBuffer
    );

    const backupId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'backup-' + Date.now();

    return {
      formatVersion: CURRENT_FORMAT_VERSION,
      appName: 'SecureVault',
      appVersion,
      createdAt: new Date().toISOString(),
      backupId,
      recordCount: payload.items.length,
      kdf: {
        algorithm: 'PBKDF2-HMAC-SHA256',
        iterations: BACKUP_PBKDF2_ITERATIONS,
        salt: this.crypto.arrayBufferToBase64(salt.buffer)
      },
      encryption: {
        algorithm: 'AES-256-GCM',
        iv: this.crypto.arrayBufferToBase64(iv.buffer)
      },
      authCheck: {
        iv: authCheckEncrypted.iv,
        ciphertext: authCheckEncrypted.ciphertext
      },
      encryptedPayload: this.crypto.arrayBufferToBase64(ciphertextBuffer)
    };
  }

  /**
   * Decrypts and verifies a SecureVaultBackupEnvelope using the supplied master password.
   */
  async decryptBackupEnvelope(
    envelope: SecureVaultBackupEnvelope,
    masterPassword: string
  ): Promise<DecryptedBackupPayload> {
    if (!envelope || typeof envelope !== 'object') {
      throw new Error('Invalid backup file: Not a valid SecureVault backup.');
    }

    if (envelope.appName !== 'SecureVault') {
      throw new Error('Invalid backup file: File does not belong to SecureVault.');
    }

    if (!envelope.kdf || !envelope.kdf.salt || !envelope.encryptedPayload) {
      throw new Error('Corrupted backup file: Missing essential cryptographic parameters.');
    }

    // 1. Reconstruct salt & derive key
    const salt = new Uint8Array(this.crypto.base64ToArrayBuffer(envelope.kdf.salt));
    const iterations = envelope.kdf.iterations || BACKUP_PBKDF2_ITERATIONS;

    let backupKey: CryptoKey;
    try {
      backupKey = await this.crypto.deriveKey(masterPassword, salt, iterations);
    } catch {
      throw new Error('Key derivation failed for backup.');
    }

    // 2. Early Password Verification using Auth Check magic phrase
    if (envelope.authCheck && envelope.authCheck.ciphertext) {
      try {
        const authPhrase = await this.crypto.decrypt<string>(
          { iv: envelope.authCheck.iv, ciphertext: envelope.authCheck.ciphertext },
          backupKey
        );
        if (authPhrase !== BACKUP_AUTH_MAGIC_PHRASE) {
          throw new Error('Incorrect backup password.');
        }
      } catch {
        throw new Error('Incorrect backup password.');
      }
    }

    // 3. Decrypt main payload
    const iv = this.crypto.base64ToArrayBuffer(envelope.encryption.iv);
    const ciphertext = this.crypto.base64ToArrayBuffer(envelope.encryptedPayload);

    let decryptedString: string;
    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource
        },
        backupKey,
        ciphertext
      );
      decryptedString = this.decoder.decode(decryptedBuffer);
    } catch {
      throw new Error('Decryption failed: incorrect password or corrupted backup.');
    }

    let payload: DecryptedBackupPayload;
    try {
      payload = JSON.parse(decryptedString) as DecryptedBackupPayload;
    } catch {
      throw new Error('Failed to parse decrypted backup data.');
    }

    // 4. Validate Integrity Checksum
    if (payload.checksum && payload.items) {
      const computedChecksum = await this.computeSha256(JSON.stringify(payload.items));
      if (computedChecksum.toLowerCase() !== payload.checksum.toLowerCase()) {
        throw new Error('Backup integrity verification failed: Checksum mismatch. File may be modified.');
      }
    }

    return payload;
  }

  private async computeSha256(data: string): Promise<string> {
    const buffer = this.encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
