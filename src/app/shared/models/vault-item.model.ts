import { BankingAccountPayload } from './banking.model';
import { PaymentCardPayload } from './card.model';
import { EncryptedPayload } from './crypto.model';

export type VaultCategory = 'BANKING' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'OTHER';

export type ItemPayload = BankingAccountPayload | PaymentCardPayload | Record<string, any>;

export interface BaseVaultItem {
  id: string;
  category: VaultCategory;
  /** Non-sensitive user-defined label (e.g., "Chase Primary Checking", "Sapphire Preferred") */
  title: string;
  /** Non-sensitive masked preview summary (e.g., "demo.user" or "•••• 4242") */
  subtitle: string;
  /** Epoch timestamp in ms */
  createdAt: number;
  /** Epoch timestamp in ms */
  updatedAt: number;
}

/** Stored representation in IndexedDB - sensitive data is strictly encrypted */
export interface StoredVaultRecord extends BaseVaultItem {
  encryptedPayload: EncryptedPayload;
}

/** In-memory representation when decrypted for viewing/editing */
export interface DecryptedVaultItem<T = ItemPayload> extends BaseVaultItem {
  payload: T;
}

export type VaultStatus = 'UNINITIALIZED' | 'LOCKED' | 'UNLOCKED';
