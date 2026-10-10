import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService implements OnDestroy {
  readonly isOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  private readonly onlineHandler = () => this.isOnline.set(true);
  private readonly offlineHandler = () => this.isOnline.set(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    }
  }

  /**
   * Performs an active connection check.
   * Checks both navigator.onLine and optionally verifies connectivity with a lightweight ping.
   */
  async checkConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline.set(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Lightweight HEAD request to GitHub API (CORS enabled)
      const res = await fetch('https://api.github.com', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const online = res.status >= 200 && res.status < 500;
      this.isOnline.set(online);
      return online;
    } catch {
      // If network request errors out, fall back to navigator.onLine
      const fallback = typeof navigator !== 'undefined' ? navigator.onLine : false;
      this.isOnline.set(fallback);
      return fallback;
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    }
  }
}
