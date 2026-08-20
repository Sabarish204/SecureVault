export interface EncryptedPayload {
  /** Base64-encoded 12-byte (96-bit) Initialization Vector / Nonce */
  iv: string;
  /** Base64-encoded AES-256-GCM ciphertext including the 128-bit authentication tag */
  ciphertext: string;
}

export interface VaultMetadata {
  id: 'vault_config';
  /** Base64-encoded 16-byte (128-bit) cryptographically secure random salt */
  salt: string;
  /** PBKDF2 iteration count (default: 600,000) */
  iterations: number;
  /** Encrypted known constant validation token to verify master password correctness without storing password */
  authCheck: EncryptedPayload;
  /** Inactivity auto-lock timeout in minutes */
  autoLockMinutes: number;
  /** Epoch timestamp in ms */
  createdAt: number;
  /** Epoch timestamp in ms */
  updatedAt: number;
}
