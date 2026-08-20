import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CryptoService } from '../crypto/crypto.service';
import { VaultStorageService } from '../persistence/vault-storage.service';
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

      this.snackBar.open('Vault created and unlocked successfully!', 'Close', {
        duration: 3000,
        panelClass: 'snack-success'
      });
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

      this.snackBar.open('Vault unlocked.', 'Close', {
        duration: 2500,
        panelClass: 'snack-success'
      });
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

    if (reason) {
      this.snackBar.open(reason, 'Close', {
        duration: 3000,
        panelClass: 'snack-info'
      });
    }

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

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  setSelectedCategory(cat: VaultCategory | 'ALL'): void {
    this.selectedCategory.set(cat);
  }
}
