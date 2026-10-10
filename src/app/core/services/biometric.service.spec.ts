import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BiometricService } from './biometric.service';
import { BiometryType } from '@aparajita/capacitor-biometric-auth';

describe('BiometricService', () => {
  let service: BiometricService;
  let snackBarMock: { open: any };

  beforeEach(() => {
    snackBarMock = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        BiometricService,
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    });

    service = TestBed.inject(BiometricService);
  });

  it('should initialize with default signals', () => {
    expect(service.isEnabled()).toBe(false);
    expect(service.isAuthenticating()).toBe(false);
  });

  it('should compute appropriate biometry name based on type', () => {
    service.biometryType.set(BiometryType.fingerprintAuthentication);
    expect(service.biometryName()).toBe('Fingerprint');

    service.biometryType.set(BiometryType.touchId);
    expect(service.biometryName()).toBe('Fingerprint');

    service.biometryType.set(BiometryType.faceId);
    expect(service.biometryName()).toBe('Face Recognition');
  });

  it('should reject enabling biometrics if PIN is invalid', async () => {
    const resShort = await service.enableBiometric('12');
    expect(resShort).toBe(false);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Valid 4-digit Master PIN is required'),
      'Close',
      expect.any(Object)
    );

    const resEmpty = await service.enableBiometric('');
    expect(resEmpty).toBe(false);
  });

  it('should disable biometrics and update enabled signal', async () => {
    service.isEnabled.set(true);
    await service.disableBiometric();
    expect(service.isEnabled()).toBe(false);
  });

  it('should clear credentials and update enabled signal to false', async () => {
    service.isEnabled.set(true);
    await service.clearCredentials();
    expect(service.isEnabled()).toBe(false);
  });
});
