import { Injectable, inject } from '@angular/core';
import { IndexedDbAdapter } from './indexeddb.adapter';
import { CryptoService } from '../crypto/crypto.service';
import {
  BaseVaultItem,
  DecryptedVaultItem,
  ItemPayload,
  StoredVaultRecord,
  VaultMetadata
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class VaultStorageService {
  private readonly db = inject(IndexedDbAdapter);
  private readonly crypto = inject(CryptoService);

  async hasExistingVault(): Promise<boolean> {
    const meta = await this.db.getMetadata();
    return meta !== null;
  }

  async getMetadata(): Promise<VaultMetadata | null> {
    return this.db.getMetadata();
  }

  async saveMetadata(metadata: VaultMetadata): Promise<void> {
    return this.db.saveMetadata(metadata);
  }

  /**
   * Retrieves all items from storage.
   * Returns base metadata (id, title, subtitle, category, timestamps) without decrypting payloads.
   */
  async getRecordList(): Promise<BaseVaultItem[]> {
    const records = await this.db.getAllRecords();
    return records.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      subtitle: r.subtitle,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  /**
   * Decrypts and returns a single item by ID
   */
  async getDecryptedItem<T = ItemPayload>(id: string, masterKey: CryptoKey): Promise<DecryptedVaultItem<T> | null> {
    const record = await this.db.getRecord(id);
    if (!record) {
      return null;
    }

    const payload = await this.crypto.decrypt<T>(record.encryptedPayload, masterKey);
    return {
      id: record.id,
      category: record.category,
      title: record.title,
      subtitle: record.subtitle,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      payload
    };
  }

  /**
   * Encrypts and persists a vault item
   */
  async saveItem(
    item: {
      id?: string;
      category: BaseVaultItem['category'];
      title: string;
      subtitle: string;
      payload: ItemPayload;
      createdAt?: number;
    },
    masterKey: CryptoKey
  ): Promise<BaseVaultItem> {
    const now = Date.now();
    const id = item.id || this.generateUuid();
    const createdAt = item.createdAt || now;

    // Encrypt the sensitive payload before touching storage
    const encryptedPayload = await this.crypto.encrypt(item.payload, masterKey);

    const record: StoredVaultRecord = {
      id,
      category: item.category,
      title: item.title,
      subtitle: item.subtitle,
      createdAt,
      updatedAt: now,
      encryptedPayload
    };

    await this.db.saveRecord(record);

    return {
      id: record.id,
      category: record.category,
      title: record.title,
      subtitle: record.subtitle,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  async deleteItem(id: string): Promise<void> {
    return this.db.deleteRecord(id);
  }

  async resetAll(): Promise<void> {
    return this.db.clearAll();
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
