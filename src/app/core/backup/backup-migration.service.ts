import { Injectable } from '@angular/core';
import { DecryptedBackupPayload } from '../../shared/models/backup.model';

export const LATEST_BACKUP_FORMAT_VERSION = 1;

@Injectable({
  providedIn: 'root'
})
export class BackupMigrationService {
  /**
   * Validates and migrates a decrypted backup payload to the current internal data schema.
   */
  migrateToCurrent(payload: DecryptedBackupPayload): DecryptedBackupPayload {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid backup content: Empty payload.');
    }

    const version = payload.formatVersion || 1;

    // 1. Check for unsupported future format versions
    if (version > LATEST_BACKUP_FORMAT_VERSION) {
      throw new Error(
        `This backup was created by a newer version of SecureVault (Format v${version}). Please update the SecureVault app to restore this backup.`
      );
    }

    let currentPayload = { ...payload };

    // 2. Sequential migration pipeline (e.g. v1 -> v2 when future versions are added)
    if (version === 1) {
      currentPayload = this.migrateV1(currentPayload);
    }

    // 3. Schema sanitization and normalization
    currentPayload.items = (currentPayload.items || []).map(item => ({
      id: item.id || this.fallbackUuid(),
      category: item.category || 'OTHER',
      title: (item.title || 'Untitled Item').trim(),
      subtitle: (item.subtitle || '').trim(),
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
      payload: item.payload || {}
    }));

    if (!currentPayload.metadata) {
      currentPayload.metadata = { autoLockMinutes: 3 };
    }

    return currentPayload;
  }

  private migrateV1(payload: DecryptedBackupPayload): DecryptedBackupPayload {
    // Format Version 1 normalization
    return payload;
  }

  private fallbackUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
}
