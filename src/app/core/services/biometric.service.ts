import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
  CheckBiometryResult
} from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { MatSnackBar } from '@angular/material/snack-bar';

const KEY_BIOMETRIC_ENABLED = 'sv_biometric_enabled';
const KEY_BIOMETRIC_PIN = 'sv_biometric_pin';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private readonly snackBar = inject(MatSnackBar);

  readonly isHardwareAvailable = signal<boolean>(false);
  readonly hasEnrolledBiometrics = signal<boolean>(false);
  readonly biometryType = signal<BiometryType>(BiometryType.none);
  readonly isEnabled = signal<boolean>(false);
  readonly isAuthenticating = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);

  readonly biometryName = computed<string>(() => {
    switch (this.biometryType()) {
      case BiometryType.fingerprintAuthentication:
      case BiometryType.touchId:
        return 'Fingerprint';
      case BiometryType.faceId:
      case BiometryType.faceAuthentication:
        return 'Face Recognition';
      case BiometryType.irisAuthentication:
        return 'Iris Recognition';
      default:
        return 'Fingerprint';
    }
  });

  readonly isReadyForBiometricUnlock = computed<boolean>(() => {
    return this.isEnabled() && this.isHardwareAvailable();
  });

  async init(): Promise<void> {
    try {
      await this.checkHardwareAvailability();
      await this.loadBiometricPreference();
    } catch (err) {
      console.warn('[BiometricService] Initialization error:', err);
    } finally {
      this.isInitialized.set(true);
    }
  }

  /**
   * Checks whether the device hardware supports biometrics and has enrolled fingerprints
   */
  async checkHardwareAvailability(): Promise<boolean> {
    try {
      const checkResult: CheckBiometryResult = await BiometricAuth.checkBiometry();
      this.isHardwareAvailable.set(checkResult.isAvailable);
      this.hasEnrolledBiometrics.set(checkResult.isAvailable || checkResult.strongBiometryIsAvailable);
      this.biometryType.set(checkResult.biometryType);
      return checkResult.isAvailable;
    } catch (err) {
      console.warn('[BiometricService] checkBiometry failed:', err);
      this.isHardwareAvailable.set(false);
      this.hasEnrolledBiometrics.set(false);
      this.biometryType.set(BiometryType.none);
      return false;
    }
  }

  /**
   * Loads whether the user previously enabled biometric unlock in SecureStorage
   */
  private async loadBiometricPreference(): Promise<void> {
    try {
      const enabledVal = await this.getSecureItem(KEY_BIOMETRIC_ENABLED);
      const pinVal = await this.getSecureItem(KEY_BIOMETRIC_PIN);
      const isConfigured = enabledVal === 'true' && !!pinVal;
      this.isEnabled.set(isConfigured);
    } catch {
      this.isEnabled.set(false);
    }
  }

  /**
   * Enables biometric unlock by verifying fingerprint, storing the PIN into Keystore/Keychain,
   * and setting the active preference flag.
   */
  async enableBiometric(masterPin: string): Promise<boolean> {
    if (!masterPin || masterPin.length !== 4) {
      this.snackBar.open('Valid 4-digit Master PIN is required to activate fingerprint unlock.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
      return false;
    }

    const available = await this.checkHardwareAvailability();
    if (!available && Capacitor.isNativePlatform()) {
      this.snackBar.open(
        'Biometric authentication is not available or no fingerprint is enrolled on this device.',
        'Close',
        { duration: 4000, panelClass: 'snack-error' }
      );
      return false;
    }

    this.isAuthenticating.set(true);
    try {
      // Prompt user to verify their fingerprint
      await BiometricAuth.authenticate({
        reason: 'Confirm your fingerprint to activate biometric unlock for SecureVault',
        cancelTitle: 'Cancel',
        androidTitle: 'Enable Fingerprint Unlock',
        androidSubtitle: 'Confirm biometric identity',
        allowDeviceCredential: false
      });

      // Save credentials into hardware-backed Keystore
      await this.setSecureItem(KEY_BIOMETRIC_PIN, masterPin);
      await this.setSecureItem(KEY_BIOMETRIC_ENABLED, 'true');
      this.isEnabled.set(true);

      this.snackBar.open('Fingerprint unlock enabled successfully!', 'Close', {
        duration: 3000,
        panelClass: 'snack-success'
      });
      return true;
    } catch (err: any) {
      if (err instanceof BiometryError && err.code === BiometryErrorType.userCancel) {
        return false;
      }
      console.error('[BiometricService] enableBiometric error:', err);
      this.snackBar.open('Failed to verify fingerprint. Please try again.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
      return false;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  /**
   * Disables biometric unlock and removes stored PIN credentials from Keystore/Keychain
   */
  async disableBiometric(): Promise<void> {
    try {
      await this.removeSecureItem(KEY_BIOMETRIC_PIN);
      await this.removeSecureItem(KEY_BIOMETRIC_ENABLED);
      this.isEnabled.set(false);
      this.snackBar.open('Fingerprint unlock disabled.', 'Close', {
        duration: 2500,
        panelClass: 'snack-info'
      });
    } catch (err) {
      console.error('[BiometricService] disableBiometric error:', err);
      this.isEnabled.set(false);
    }
  }

  /**
   * Prompts the user for their fingerprint and returns the decrypted Master PIN from SecureStorage.
   */
  async authenticateAndGetPin(): Promise<string | null> {
    if (!this.isEnabled()) {
      return null;
    }

    this.isAuthenticating.set(true);
    try {
      await BiometricAuth.authenticate({
        reason: 'Scan your fingerprint to unlock SecureVault',
        cancelTitle: 'Use PIN',
        androidTitle: 'Unlock SecureVault',
        androidSubtitle: 'Fingerprint Authentication',
        allowDeviceCredential: false
      });

      // Retrieve stored Master PIN from Keystore
      const pin = await this.getSecureItem(KEY_BIOMETRIC_PIN);
      if (!pin) {
        // In case credentials were wiped
        await this.disableBiometric();
        this.snackBar.open('Biometric credentials expired. Please unlock with your PIN.', 'Close', {
          duration: 3500,
          panelClass: 'snack-error'
        });
        return null;
      }

      return pin;
    } catch (err: any) {
      if (err instanceof BiometryError && (err.code === BiometryErrorType.userCancel || err.code === BiometryErrorType.appCancel)) {
        // User voluntarily chose to use PIN or dismissed dialog
        return null;
      }
      console.warn('[BiometricService] Authentication failed or cancelled:', err);
      return null;
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  /**
   * Synchronizes the securely stored PIN when the user changes their Master PIN in Settings
   */
  async updateStoredPin(newMasterPin: string): Promise<void> {
    if (this.isEnabled()) {
      try {
        await this.setSecureItem(KEY_BIOMETRIC_PIN, newMasterPin);
      } catch (err) {
        console.error('[BiometricService] Failed to update stored PIN in Keystore:', err);
      }
    }
  }

  /**
   * Purges all biometric credentials (called when resetting the vault)
   */
  async clearCredentials(): Promise<void> {
    try {
      await this.removeSecureItem(KEY_BIOMETRIC_PIN);
      await this.removeSecureItem(KEY_BIOMETRIC_ENABLED);
    } catch {
      // Safe ignore
    } finally {
      this.isEnabled.set(false);
    }
  }

  // --- Platform-safe SecureStorage Helpers ---

  private async getSecureItem(key: string): Promise<string | null> {
    try {
      const result = await SecureStorage.get(key);
      if (result && typeof result === 'string') {
        return result;
      }
      return null;
    } catch {
      // Fallback for non-native web testing environment if needed
      if (!Capacitor.isNativePlatform()) {
        try {
          return sessionStorage.getItem(`_sv_mock_${key}`);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await SecureStorage.set(key, value);
    } catch (err) {
      if (!Capacitor.isNativePlatform()) {
        try {
          sessionStorage.setItem(`_sv_mock_${key}`, value);
          return;
        } catch {
          // ignore
        }
      }
      throw err;
    }
  }

  private async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStorage.remove(key);
    } catch {
      // ignore
    }
    if (!Capacitor.isNativePlatform()) {
      try {
        sessionStorage.removeItem(`_sv_mock_${key}`);
      } catch {
        // ignore
      }
    }
  }
}
