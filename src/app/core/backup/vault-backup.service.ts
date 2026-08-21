import { Injectable, inject, signal } from '@angular/core';
import { CryptoService } from '../crypto/crypto.service';
import { BackupCryptoService } from './backup-crypto.service';
import { BackupMigrationService } from './backup-migration.service';
import { VaultStorageService } from '../persistence/vault-storage.service';
import { IndexedDbAdapter } from '../persistence/indexeddb.adapter';
import { VaultStateService } from '../state/vault-state.service';
import {
  BackupInspectionResult,
  DecryptedBackupPayload,
  RestoreOptions,
  SecureVaultBackupEnvelope
} from '../../shared/models/backup.model';
import { DecryptedVaultItem, StoredVaultRecord } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class VaultBackupService {
  private readonly crypto = inject(CryptoService);
  private readonly backupCrypto = inject(BackupCryptoService);
  private readonly migration = inject(BackupMigrationService);
  private readonly storage = inject(VaultStorageService);
  private readonly db = inject(IndexedDbAdapter);
  private readonly vaultState = inject(VaultStateService);

  readonly isExporting = signal<boolean>(false);
  readonly isImporting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  /**
   * Generates a timestamped default backup filename.
   * Example: SecureVault_Backup_2026-08-21_214500.svbackup
   */
  generateDefaultFilename(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());

    return `SecureVault_Backup_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.svbackup`;
  }

  /**
   * Exports all decrypted vault items into a secure, encrypted .svbackup envelope.
   */
  async exportBackup(masterPassword: string): Promise<{ success: boolean; filename: string; recordCount: number }> {
    this.isExporting.set(true);
    this.errorMessage.set('');

    try {
      if (!this.vaultState.isUnlocked()) {
        throw new Error('Vault must be unlocked to export a backup.');
      }

      // 1. Gather all decrypted items
      const baseItems = this.vaultState.items();
      const decryptedItems: Array<{
        id: string;
        category: any;
        title: string;
        subtitle: string;
        createdAt: number;
        updatedAt: number;
        payload: any;
      }> = [];

      for (const item of baseItems) {
        const fullItem = await this.vaultState.getItemDetails(item.id);
        if (fullItem) {
          decryptedItems.push({
            id: fullItem.id,
            category: fullItem.category,
            title: fullItem.title,
            subtitle: fullItem.subtitle,
            createdAt: fullItem.createdAt,
            updatedAt: fullItem.updatedAt,
            payload: fullItem.payload
          });
        }
      }

      const meta = await this.storage.getMetadata();
      const autoLockMinutes = meta?.autoLockMinutes || this.vaultState.autoLockMinutes() || 3;

      // 2. Create versioned, encrypted envelope
      const envelope = await this.backupCrypto.createBackupEnvelope(
        {
          formatVersion: 1,
          metadata: {
            autoLockMinutes,
            createdAt: meta?.createdAt || Date.now(),
            updatedAt: Date.now()
          },
          items: decryptedItems
        },
        masterPassword,
        '1.0.0'
      );

      const filename = this.generateDefaultFilename();
      const backupJson = JSON.stringify(envelope, null, 2);

      // 3. Trigger document download
      this.triggerFileDownload(backupJson, filename);

      return {
        success: true,
        filename,
        recordCount: decryptedItems.length
      };
    } catch (err: any) {
      const msg = err.message || 'Unable to export backup.';
      this.errorMessage.set(msg);
      throw err;
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Reads, decrypts, and inspects a backup file without modifying the database.
   */
  async inspectBackupFile(fileContent: string, passwordAttempt: string): Promise<BackupInspectionResult> {
    try {
      let envelope: SecureVaultBackupEnvelope;
      try {
        envelope = JSON.parse(fileContent) as SecureVaultBackupEnvelope;
      } catch {
        return {
          isValid: false,
          formatVersion: 0,
          appVersion: '',
          createdAt: '',
          recordCount: 0,
          backupId: '',
          errorMessage: 'Invalid file format. The selected file is not a valid SecureVault backup.'
        };
      }

      // Decrypt and verify integrity
      const decrypted = await this.backupCrypto.decryptBackupEnvelope(envelope, passwordAttempt);
      const migrated = this.migration.migrateToCurrent(decrypted);

      return {
        isValid: true,
        formatVersion: envelope.formatVersion || 1,
        appVersion: envelope.appVersion || '1.0',
        createdAt: envelope.createdAt || new Date().toISOString(),
        recordCount: migrated.items.length,
        backupId: envelope.backupId || '',
        decryptedPayload: migrated
      };
    } catch (err: any) {
      return {
        isValid: false,
        formatVersion: 0,
        appVersion: '',
        createdAt: '',
        recordCount: 0,
        backupId: '',
        errorMessage: err.message || 'Failed to inspect backup file.'
      };
    }
  }

  /**
   * Restores a verified backup payload atomically into IndexedDB.
   */
  async restoreBackup(
    payload: DecryptedBackupPayload,
    masterPasswordForVault: string,
    options: RestoreOptions = { createSafetyBackup: true }
  ): Promise<{ success: boolean; restoredCount: number }> {
    this.isImporting.set(true);
    this.errorMessage.set('');

    try {
      // 1. Safety auto-backup if current vault has records
      if (options.createSafetyBackup && this.vaultState.items().length > 0 && this.vaultState.isUnlocked()) {
        try {
          await this.exportBackup(masterPasswordForVault);
        } catch {
          // Safety backup export warning
        }
      }

      // 2. Generate new VaultMetadata and MasterKey with the target master password
      const autoLock = payload.metadata?.autoLockMinutes || 3;
      const { metadata, masterKey } = await this.crypto.createVaultMetadata(masterPasswordForVault, autoLock);

      // 3. Encrypt all backup items with the new master key
      const now = Date.now();
      const recordsToStore: StoredVaultRecord[] = [];

      for (const item of payload.items) {
        const encryptedPayload = await this.crypto.encrypt(item.payload, masterKey);
        recordsToStore.push({
          id: item.id || this.fallbackUuid(),
          category: item.category,
          title: item.title,
          subtitle: item.subtitle,
          createdAt: item.createdAt || now,
          updatedAt: item.updatedAt || now,
          encryptedPayload
        });
      }

      // 4. Atomically commit to IndexedDB
      await this.db.restoreAtomic(metadata, recordsToStore);

      // 5. Reload and unlock vault state
      await this.vaultState.checkInitialVaultState();
      await this.vaultState.unlockVault(masterPasswordForVault);

      return {
        success: true,
        restoredCount: recordsToStore.length
      };
    } catch (err: any) {
      const msg = err.message || 'Unable to restore backup. Your existing vault was not changed.';
      this.errorMessage.set(msg);
      throw err;
    } finally {
      this.isImporting.set(false);
    }
  }

  private triggerFileDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private fallbackUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
}
