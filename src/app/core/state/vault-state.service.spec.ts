import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VaultStateService } from './vault-state.service';
import { CryptoService } from '../crypto/crypto.service';
import { VaultStorageService } from '../persistence/vault-storage.service';

describe('VaultStateService', () => {
  let service: VaultStateService;
  let routerMock: any;
  let snackBarMock: any;
  let storageMock: any;
  let cryptoService: CryptoService;

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true)
    };
    snackBarMock = {
      open: vi.fn()
    };
    storageMock = {
      hasExistingVault: vi.fn().mockResolvedValue(false),
      getMetadata: vi.fn().mockResolvedValue(null),
      saveMetadata: vi.fn().mockResolvedValue(undefined),
      getRecordList: vi.fn().mockResolvedValue([]),
      getDecryptedItem: vi.fn().mockResolvedValue(null),
      saveItem: vi.fn().mockResolvedValue({ id: 'test-1', category: 'BANKING', title: 'Test', subtitle: 'user', createdAt: 1, updatedAt: 1 }),
      deleteItem: vi.fn().mockResolvedValue(undefined),
      resetAll: vi.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      providers: [
        VaultStateService,
        CryptoService,
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: VaultStorageService, useValue: storageMock }
      ]
    });

    service = TestBed.inject(VaultStateService);
    cryptoService = TestBed.inject(CryptoService);
  });

  it('should initialize with UNINITIALIZED or LOCKED status', () => {
    expect(service.isUnlocked()).toBe(false);
  });

  it('should setup a new vault and unlock it', async () => {
    const success = await service.setupVault('MasterTestPassword123!');
    expect(success).toBe(true);
    expect(service.status()).toBe('UNLOCKED');
    expect(service.isUnlocked()).toBe(true);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should lock vault and reset state', async () => {
    await service.setupVault('MasterTestPassword123!');
    expect(service.isUnlocked()).toBe(true);

    await service.lockVault('User manual lock');
    expect(service.status()).toBe('LOCKED');
    expect(service.isUnlocked()).toBe(false);
    expect(service.items()).toEqual([]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/unlock']);
  });
});
