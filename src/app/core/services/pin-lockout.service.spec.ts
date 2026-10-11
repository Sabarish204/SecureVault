import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PinLockoutService } from './pin-lockout.service';

describe('PinLockoutService', () => {
  let service: PinLockoutService;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; }
    };
    vi.stubGlobal('localStorage', storageMock);
    service = new PinLockoutService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should initialize with zero failed attempts and not locked out', () => {
    expect(service.failedAttempts()).toBe(0);
    expect(service.isLockedOut()).toBe(false);
    expect(service.remainingCooldownSeconds()).toBe(0);
  });

  it('should not lock out for attempts 1 through 4', () => {
    for (let i = 1; i <= 4; i++) {
      const status = service.recordFailedAttempt();
      expect(status.isLockedOut).toBe(false);
      expect(status.cooldownSeconds).toBe(0);
      expect(status.failedAttempts).toBe(i);
      expect(status.attemptsUntilNextTier).toBe(5 - i);
      expect(service.isLockedOut()).toBe(false);
    }
  });

  it('should trigger 30s lockout on 5th failed attempt', () => {
    for (let i = 1; i <= 4; i++) {
      service.recordFailedAttempt();
    }

    const status5 = service.recordFailedAttempt();
    expect(status5.isLockedOut).toBe(true);
    expect(status5.cooldownSeconds).toBe(30);
    expect(status5.failedAttempts).toBe(5);
    expect(service.isLockedOut()).toBe(true);
    expect(service.remainingCooldownSeconds()).toBe(30);
  });

  it('should trigger 60s lockout for attempts 6 through 9', () => {
    for (let i = 1; i <= 5; i++) {
      service.recordFailedAttempt();
    }

    const status6 = service.recordFailedAttempt();
    expect(status6.isLockedOut).toBe(true);
    expect(status6.cooldownSeconds).toBe(60);
    expect(status6.failedAttempts).toBe(6);
  });

  it('should trigger 300s (5 minutes) lockout on 10th failed attempt', () => {
    for (let i = 1; i <= 9; i++) {
      service.recordFailedAttempt();
    }

    const status10 = service.recordFailedAttempt();
    expect(status10.isLockedOut).toBe(true);
    expect(status10.cooldownSeconds).toBe(300);
    expect(status10.failedAttempts).toBe(10);
    expect(service.isLockedOut()).toBe(true);
    expect(service.formattedRemainingTime()).toBe('5m');
  });

  it('should reset failed attempts and lockout on successful attempt', () => {
    for (let i = 1; i <= 5; i++) {
      service.recordFailedAttempt();
    }
    expect(service.isLockedOut()).toBe(true);

    service.recordSuccessfulAttempt();
    expect(service.failedAttempts()).toBe(0);
    expect(service.isLockedOut()).toBe(false);
    expect(service.remainingCooldownSeconds()).toBe(0);
    expect(mockStorage['sv_pin_failed_attempts']).toBeUndefined();
    expect(mockStorage['sv_pin_lockout_until']).toBeUndefined();
  });

  it('should restore active lockout from localStorage upon initialization', () => {
    const futureTime = Date.now() + 45000; // 45 seconds in future
    mockStorage['sv_pin_failed_attempts'] = '5';
    mockStorage['sv_pin_lockout_until'] = futureTime.toString();

    const restoredService = new PinLockoutService();
    expect(restoredService.failedAttempts()).toBe(5);
    expect(restoredService.isLockedOut()).toBe(true);
    expect(restoredService.remainingCooldownSeconds()).toBeGreaterThanOrEqual(44);
    restoredService.recordSuccessfulAttempt();
  });
});
