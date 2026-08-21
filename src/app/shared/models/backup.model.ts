import { BaseVaultItem, DecryptedVaultItem, ItemPayload, StoredVaultRecord, VaultMetadata } from './index';

export interface BackupKdfConfig {
  algorithm: 'PBKDF2-HMAC-SHA256';
  iterations: number;
  salt: string; // Base64 encoded 16-byte salt
}

export interface BackupEncryptionConfig {
  algorithm: 'AES-256-GCM';
  iv: string; // Base64 encoded 12-byte IV
}

export interface BackupAuthCheck {
  iv: string;
  ciphertext: string;
}

/**
 * Public, encrypted envelope format for .svbackup files (Format Version 1).
 * Zero plaintext vault data is exposed.
 */
export interface SecureVaultBackupEnvelope {
  formatVersion: number;
  appName: 'SecureVault';
  appVersion: string;
  createdAt: string; // ISO 8601 string
  backupId: string; // UUID
  recordCount: number;
  kdf: BackupKdfConfig;
  encryption: BackupEncryptionConfig;
  authCheck: BackupAuthCheck;
  encryptedPayload: string; // Base64 encoded AES-256-GCM ciphertext + auth tag
}

/**
 * Decrypted payload contained inside encryptedPayload
 */
export interface DecryptedBackupPayload {
  formatVersion: number;
  metadata: {
    autoLockMinutes: number;
    createdAt?: number;
    updatedAt?: number;
  };
  items: Array<{
    id: string;
    category: BaseVaultItem['category'];
    title: string;
    subtitle: string;
    createdAt: number;
    updatedAt: number;
    payload: ItemPayload;
  }>;
  checksum: string; // SHA-256 hash of the items JSON string
}

export interface BackupInspectionResult {
  isValid: boolean;
  formatVersion: number;
  appVersion: string;
  createdAt: string;
  recordCount: number;
  backupId: string;
  decryptedPayload?: DecryptedBackupPayload;
  errorMessage?: string;
}

export interface RestoreOptions {
  createSafetyBackup?: boolean;
  overwriteCurrentVault?: boolean;
}
