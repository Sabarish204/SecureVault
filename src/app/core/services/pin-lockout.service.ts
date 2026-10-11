import { Injectable, computed, signal, NgZone, inject } from '@angular/core';

export interface LockoutStatus {
  isLockedOut: boolean;
  cooldownSeconds: number;
  failedAttempts: number;
  attemptsUntilNextTier: number;
}

const STORAGE_KEY_FAILED_ATTEMPTS = 'sv_pin_failed_attempts';
const STORAGE_KEY_LOCKOUT_UNTIL = 'sv_pin_lockout_until';

@Injectable({
  providedIn: 'root'
})
export class PinLockoutService {
  private ngZone?: NgZone;

  readonly failedAttempts = signal<number>(0);
  readonly remainingCooldownSeconds = signal<number>(0);

  readonly isLockedOut = computed<boolean>(() => this.remainingCooldownSeconds() > 0);

  readonly formattedRemainingTime = computed<string>(() => {
    const totalSec = this.remainingCooldownSeconds();
    if (totalSec <= 0) return '0s';
    if (totalSec < 60) return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
  });

  private countdownInterval: any = null;

  constructor() {
    try {
      this.ngZone = inject(NgZone);
    } catch {
      // Standalone test environments
    }
    this.restorePersistedState();
  }

  /**
   * Restores failed attempt count and any active lockout expiration timestamp
   */
  private restorePersistedState(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const storedAttempts = parseInt(localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || '0', 10);
      this.failedAttempts.set(isNaN(storedAttempts) ? 0 : storedAttempts);

      const storedLockoutUntil = parseInt(localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL) || '0', 10);
      if (!isNaN(storedLockoutUntil) && storedLockoutUntil > Date.now()) {
        const remainingMs = storedLockoutUntil - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        this.startCooldown(remainingSec);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
        this.remainingCooldownSeconds.set(0);
      }
    } catch {
      // Graceful fallback if localStorage is disabled or restricted
    }
  }

  /**
   * Records a failed master PIN attempt and calculates progressive cooldown:
   * - 1 to 4 failed attempts: Warning only (0s lockout)
   * - 5 failed attempts: 30-second cooldown
   * - 6 to 9 failed attempts: 60-second cooldown
   * - 10+ failed attempts: 300-second (5 minutes) lockout
   */
  recordFailedAttempt(): LockoutStatus {
    const nextAttempts = this.failedAttempts() + 1;
    this.failedAttempts.set(nextAttempts);
    this.persistValue(STORAGE_KEY_FAILED_ATTEMPTS, nextAttempts.toString());

    let cooldownSec = 0;
    let attemptsUntilNextTier = 0;

    if (nextAttempts >= 10) {
      cooldownSec = 300; // 5 minutes lockout
      attemptsUntilNextTier = 0;
    } else if (nextAttempts >= 6) {
      cooldownSec = 60; // 1 minute lockout
      attemptsUntilNextTier = 10 - nextAttempts;
    } else if (nextAttempts === 5) {
      cooldownSec = 30; // 30 seconds lockout
      attemptsUntilNextTier = 1;
    } else {
      cooldownSec = 0;
      attemptsUntilNextTier = 5 - nextAttempts;
    }

    if (cooldownSec > 0) {
      const lockoutUntil = Date.now() + cooldownSec * 1000;
      this.persistValue(STORAGE_KEY_LOCKOUT_UNTIL, lockoutUntil.toString());
      this.startCooldown(cooldownSec);
    }

    return {
      isLockedOut: cooldownSec > 0,
      cooldownSeconds: cooldownSec,
      failedAttempts: nextAttempts,
      attemptsUntilNextTier
    };
  }

  /**
   * Resets all failed attempts and active lockouts upon successful master PIN entry
   */
  recordSuccessfulAttempt(): void {
    this.stopCountdown();
    this.failedAttempts.set(0);
    this.remainingCooldownSeconds.set(0);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
      } catch {}
    }
  }

  /**
   * Starts a 1-second interval countdown timer
   */
  private startCooldown(seconds: number): void {
    this.stopCountdown();
    this.remainingCooldownSeconds.set(seconds);

    const runOutside = (fn: () => void) => {
      if (this.ngZone) {
        this.ngZone.runOutsideAngular(fn);
      } else {
        fn();
      }
    };

    const runInside = (fn: () => void) => {
      if (this.ngZone) {
        this.ngZone.run(fn);
      } else {
        fn();
      }
    };

    runOutside(() => {
      this.countdownInterval = setInterval(() => {
        const current = this.remainingCooldownSeconds();
        if (current <= 1) {
          runInside(() => {
            this.stopCountdown();
            this.remainingCooldownSeconds.set(0);
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
              } catch {}
            }
          });
        } else {
          runInside(() => {
            this.remainingCooldownSeconds.set(current - 1);
          });
        }
      }, 1000);
    });
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private persistValue(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  }
}
