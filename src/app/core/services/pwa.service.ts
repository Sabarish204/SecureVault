import { Injectable, signal, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly snackBar = inject(MatSnackBar);
  
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly canInstall = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly isIos = signal<boolean>(false);

  init(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Detect iOS devices
    const userAgent = (typeof window !== 'undefined' && window.navigator?.userAgent) ? window.navigator.userAgent.toLowerCase() : '';
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    this.isIos.set(isIosDevice);

    // Detect if already installed / running in standalone mode
    const isStandalone =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches) ||
      (typeof window.navigator !== 'undefined' && (window.navigator as any).standalone === true) ||
      (typeof document !== 'undefined' && !!document.referrer && document.referrer.includes('android-app://'));

    this.isInstalled.set(Boolean(isStandalone));

    // Listen to online / offline events
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.snackBar.open('Network connection restored.', 'Close', {
        duration: 3000,
        panelClass: 'snack-success'
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.snackBar.open('Operating in offline mode. Vault is fully functional.', 'Close', {
        duration: 4000,
        panelClass: 'snack-info'
      });
    });

    // Capture PWA installation prompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    // Capture successful installation
    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.deferredPrompt = null;
      this.snackBar.open('SecureVault installed successfully!', 'Close', {
        duration: 4000,
        panelClass: 'snack-success'
      });
    });

    // Register Service Worker
    this.registerServiceWorker();
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SecureVault PWA] ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[SecureVault PWA] ServiceWorker registration failed:', error);
          });
      });
    }
  }

  /**
   * Prompts user to install the PWA on Android/Chrome/Desktop
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      if (this.isIos()) {
        this.snackBar.open('On iOS: Tap Share button and select "Add to Home Screen"', 'Got it', {
          duration: 6000,
          panelClass: 'snack-info'
        });
      }
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.canInstall.set(false);
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
