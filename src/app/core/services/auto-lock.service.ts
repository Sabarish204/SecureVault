import { Injectable, inject, NgZone } from '@angular/core';
import { VaultStateService } from '../state/vault-state.service';

@Injectable({
  providedIn: 'root'
})
export class AutoLockService {
  private readonly vaultState = inject(VaultStateService);
  private readonly ngZone = inject(NgZone);

  private idleTimer: any = null;
  private isListening = false;
  private readonly events = ['keydown', 'pointerdown', 'touchstart', 'scroll'];

  init(): void {
    if (this.isListening || typeof window === 'undefined') {
      return;
    }
    this.isListening = true;

    // Run event listeners outside Angular zone to avoid triggering change detection on every mouse move/scroll
    this.ngZone.runOutsideAngular(() => {
      this.events.forEach(eventName => {
        window.addEventListener(eventName, () => this.resetTimer(), { passive: true });
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.vaultState.isUnlocked()) {
          // If tab is hidden for more than 1 minute, auto lock
          this.scheduleBackgroundLock();
        } else {
          this.resetTimer();
        }
      });
    });

    this.resetTimer();
  }

  private resetTimer(): void {
    if (!this.vaultState.isUnlocked()) {
      return;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    const timeoutMs = (this.vaultState.autoLockMinutes() || 3) * 60 * 1000;
    this.idleTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.vaultState.isUnlocked()) {
          this.vaultState.lockVault('Vault auto-locked due to inactivity.');
        }
      });
    }, timeoutMs);
  }

  private scheduleBackgroundLock(): void {
    // If backgrounded, lock after 60s
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.vaultState.isUnlocked()) {
          this.vaultState.lockVault('Vault locked for your security.');
        }
      });
    }, 60 * 1000);
  }
}
