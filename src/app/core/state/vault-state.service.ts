import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CryptoService } from '../crypto/crypto.service';
import { VaultStorageService } from '../persistence/vault-storage.service';
import { BiometricService } from '../services/biometric.service';
import {
  BaseVaultItem,
  DecryptedVaultItem,
  ItemPayload,
  VaultCategory,
  VaultMetadata,
  VaultStatus
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class VaultStateService {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly crypto = inject(CryptoService);
  private readonly storage = inject(VaultStorageService);
  private readonly biometric = inject(BiometricService);

  // Volatile in-memory key reference (never persisted)
  private masterKey: CryptoKey | null = null;
  private vaultMetadata: VaultMetadata | null = null;

  // Reactive Signals
  readonly status = signal<VaultStatus>('LOCKED');
  readonly isInitialized = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly items = signal<BaseVaultItem[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<VaultCategory | 'ALL'>('ALL');
  readonly autoLockMinutes = signal<number>(3);

  // Computed signals
  readonly isUnlocked = computed(() => this.status() === 'UNLOCKED');

  readonly categoryCounts = computed(() => {
    const list = this.items();
    return {
      total: list.length,
      banking: list.filter(i => i.category === 'BANKING').length,
      creditCard: list.filter(i => i.category === 'CREDIT_CARD').length,
      debitCard: list.filter(i => i.category === 'DEBIT_CARD').length,
      other: list.filter(i => i.category === 'OTHER').length
    };
  });

  readonly filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const all = this.items();

    return all.filter(item => {
      const matchesCategory = cat === 'ALL' || item.category === cat;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  constructor() {
    this.checkInitialVaultState();
  }

  async checkInitialVaultState(): Promise<void> {
    this.isLoading.set(true);
    try {
      const hasVault = await this.storage.hasExistingVault();
      this.isInitialized.set(hasVault);
      this.status.set(hasVault ? 'LOCKED' : 'UNINITIALIZED');
      if (hasVault) {
        this.vaultMetadata = await this.storage.getMetadata();
        if (this.vaultMetadata?.autoLockMinutes) {
          this.autoLockMinutes.set(this.vaultMetadata.autoLockMinutes);
        }
      }
    } catch {
      this.status.set('UNINITIALIZED');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Initializes a brand new vault with a user-defined master password
   */
  async setupVault(masterPassword: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const { metadata, masterKey } = await this.crypto.createVaultMetadata(masterPassword, this.autoLockMinutes());
      await this.storage.saveMetadata(metadata);
      this.vaultMetadata = metadata;
      this.masterKey = masterKey;
      this.isInitialized.set(true);
      this.status.set('UNLOCKED');
      this.items.set([]);
      await this.router.navigate(['/dashboard']);
      return true;
    } catch {
      this.snackBar.open('Failed to initialize vault.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Unlocks existing vault with master password
   */
  async unlockVault(masterPassword: string): Promise<boolean> {
    if (!this.vaultMetadata) {
      this.vaultMetadata = await this.storage.getMetadata();
    }
    if (!this.vaultMetadata) {
      this.status.set('UNINITIALIZED');
      return false;
    }

    this.isLoading.set(true);
    try {
      const derivedKey = await this.crypto.verifyMasterPassword(masterPassword, this.vaultMetadata);
      this.masterKey = derivedKey;
      this.status.set('UNLOCKED');

      // Load item metadata list
      await this.refreshItems();
      await this.router.navigate(['/dashboard']);
      return true;
    } catch {
      this.snackBar.open('Incorrect master password.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Locks the vault, dereferences master key from memory, and redirects to unlock screen
   */
  async lockVault(reason?: string): Promise<void> {
    this.masterKey = null;
    this.status.set('LOCKED');
    this.items.set([]);
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');

    await this.router.navigate(['/unlock']);
  }

  async refreshItems(): Promise<void> {
    if (!this.masterKey || this.status() !== 'UNLOCKED') {
      return;
    }
    const recordList = await this.storage.getRecordList();
    // Sort recent first
    recordList.sort((a, b) => b.updatedAt - a.updatedAt);
    this.items.set(recordList);
  }

  async getItemDetails<T = ItemPayload>(id: string): Promise<DecryptedVaultItem<T> | null> {
    if (!this.masterKey || this.status() !== 'UNLOCKED') {
      throw new Error('Vault is locked. Cannot decrypt item.');
    }
    return this.storage.getDecryptedItem<T>(id, this.masterKey);
  }

  async saveItem(item: {
    id?: string;
    category: VaultCategory;
    title: string;
    subtitle: string;
    payload: ItemPayload;
    createdAt?: number;
  }): Promise<BaseVaultItem> {
    if (!this.masterKey || this.status() !== 'UNLOCKED') {
      throw new Error('Vault is locked.');
    }
    const saved = await this.storage.saveItem(item, this.masterKey);
    await this.refreshItems();
    return saved;
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.masterKey || this.status() !== 'UNLOCKED') {
      throw new Error('Vault is locked.');
    }
    await this.storage.deleteItem(id);
    await this.refreshItems();
    this.snackBar.open('Item deleted.', 'Close', {
      duration: 2500,
      panelClass: 'snack-info'
    });
  }

  async resetEntireVault(): Promise<void> {
    await this.storage.resetAll();
    await this.biometric.clearCredentials();
    this.masterKey = null;
    this.vaultMetadata = null;
    this.isInitialized.set(false);
    this.status.set('UNINITIALIZED');
    this.items.set([]);
    await this.router.navigate(['/unlock']);
    this.snackBar.open('Vault reset completely.', 'Close', {
      duration: 3000,
      panelClass: 'snack-info'
    });
  }

  /**
   * Updates master password by re-encrypting all vault items with newly derived key
   */
  async changeMasterPassword(newMasterPassword: string): Promise<boolean> {
    if (!this.masterKey || this.status() !== 'UNLOCKED') {
      this.snackBar.open('Vault must be unlocked to change master password.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
      return false;
    }

    this.isLoading.set(true);
    try {
      // 1. Fetch and decrypt all existing items using current master key
      const recordHeaders = await this.storage.getRecordList();
      const decryptedRecords: {
        id: string;
        category: VaultCategory;
        title: string;
        subtitle: string;
        payload: ItemPayload;
        createdAt: number;
      }[] = [];

      for (const h of recordHeaders) {
        const item = await this.storage.getDecryptedItem(h.id, this.masterKey);
        if (item) {
          decryptedRecords.push({
            id: item.id,
            category: item.category,
            title: item.title,
            subtitle: item.subtitle,
            payload: item.payload,
            createdAt: item.createdAt
          });
        }
      }

      // 2. Generate new metadata and new master key for the new password
      const { metadata: newMetadata, masterKey: newMasterKey } = await this.crypto.createVaultMetadata(
        newMasterPassword,
        this.autoLockMinutes()
      );

      // 3. Re-encrypt all records with the new master key
      for (const rec of decryptedRecords) {
        await this.storage.saveItem(rec, newMasterKey);
      }

      // 4. Save and update metadata
      await this.storage.saveMetadata(newMetadata);
      this.vaultMetadata = newMetadata;
      this.masterKey = newMasterKey;

      // 5. Update Keystore biometric credential if enabled
      await this.biometric.updateStoredPin(newMasterPassword);

      this.snackBar.open('Master PIN updated successfully!', 'Close', {
        duration: 3000,
        panelClass: 'snack-success'
      });
      return true;
    } catch {
      this.snackBar.open('Failed to update master PIN.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  setSelectedCategory(cat: VaultCategory | 'ALL'): void {
    this.selectedCategory.set(cat);
  }
}
