import { Injectable } from '@angular/core';
import { EncryptedPayload, VaultMetadata } from '../../shared/models/crypto.model';

const AUTH_CHECK_MAGIC_PHRASE = 'SECURE_VAULT_AUTH_VERIFIED_V1';
const PBKDF2_ITERATIONS = 600000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  /**
   * Generates a cryptographically secure random salt
   */
  generateSalt(byteLength: number = SALT_BYTE_LENGTH): Uint8Array {
    const salt = new Uint8Array(byteLength);
    crypto.getRandomValues(salt);
    return salt;
  }

  /**
   * Generates a cryptographically secure random 12-byte IV for AES-GCM
   */
  generateIv(byteLength: number = IV_BYTE_LENGTH): Uint8Array {
    const iv = new Uint8Array(byteLength);
    crypto.getRandomValues(iv);
    return iv;
  }

  /**
   * Derives an AES-GCM 256-bit CryptoKey from a master password and salt using PBKDF2-HMAC-SHA256
   */
  async deriveKey(
    masterPassword: string,
    salt: Uint8Array,
    iterations: number = PBKDF2_ITERATIONS
  ): Promise<CryptoKey> {
    if (!masterPassword || masterPassword.length === 0) {
      throw new Error('Master password must not be empty.');
    }

    const passwordBuffer = this.encoder.encode(masterPassword);

    // Import password as PBKDF2 key material
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive 256-bit AES-GCM encryption key
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: iterations,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // non-extractable in memory for security
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  }

  /**
   * Encrypts arbitrary serializable data or string using AES-256-GCM
   */
  async encrypt(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
    if (!key) {
      throw new Error('Encryption key is required.');
    }

    const iv = this.generateIv();
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const plaintextBuffer = this.encoder.encode(jsonString);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      plaintextBuffer
    );

    return {
      iv: this.arrayBufferToBase64(iv.buffer),
      ciphertext: this.arrayBufferToBase64(ciphertextBuffer)
    };
  }

  /**
   * Decrypts an EncryptedPayload using AES-256-GCM and parses as JSON
   */
  async decrypt<T = any>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
    if (!key) {
      throw new Error('Decryption key is required.');
    }
    if (!payload || !payload.iv || !payload.ciphertext) {
      throw new Error('Invalid encrypted payload structure.');
    }

    const ivBuffer = this.base64ToArrayBuffer(payload.iv);
    const ciphertextBuffer = this.base64ToArrayBuffer(payload.ciphertext);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer
        },
        key,
        ciphertextBuffer
      );

      const decryptedString = this.decoder.decode(decryptedBuffer);
      try {
        return JSON.parse(decryptedString) as T;
      } catch {
        return decryptedString as unknown as T;
      }
    } catch {
      throw new Error('Decryption failed: invalid key or corrupted data.');
    }
  }

  /**
   * Creates initial vault metadata and Auth Check token for a new master password
   */
  async createVaultMetadata(masterPassword: string, autoLockMinutes: number = 3): Promise<{ metadata: VaultMetadata; masterKey: CryptoKey }> {
    const salt = this.generateSalt();
    const masterKey = await this.deriveKey(masterPassword, salt, PBKDF2_ITERATIONS);
    const authCheck = await this.encrypt(AUTH_CHECK_MAGIC_PHRASE, masterKey);

    const metadata: VaultMetadata = {
      id: 'vault_config',
      salt: this.arrayBufferToBase64(salt.buffer),
      iterations: PBKDF2_ITERATIONS,
      authCheck,
      autoLockMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return { metadata, masterKey };
  }

  /**
   * Verifies master password against vault metadata without exposing the password
   */
  async verifyMasterPassword(masterPassword: string, metadata: VaultMetadata): Promise<CryptoKey> {
    const salt = new Uint8Array(this.base64ToArrayBuffer(metadata.salt));
    const derivedKey = await this.deriveKey(masterPassword, salt, metadata.iterations || PBKDF2_ITERATIONS);

    try {
      const decryptedPhrase = await this.decrypt<string>(metadata.authCheck, derivedKey);
      if (decryptedPhrase !== AUTH_CHECK_MAGIC_PHRASE) {
        throw new Error('Auth verification failed.');
      }
      return derivedKey;
    } catch {
      throw new Error('Invalid master password.');
    }
  }

  /**
   * Base64 conversion helpers using browser-safe binary string mapping
   */
  arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
