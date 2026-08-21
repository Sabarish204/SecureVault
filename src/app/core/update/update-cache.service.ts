import { Injectable } from '@angular/core';
import { AppReleaseInfo } from './github-release.service';

interface UpdateCacheData {
  lastCheckedTimestamp: number;
  dismissedVersions: string[];
  lastKnownRelease: AppReleaseInfo | null;
}

@Injectable({
  providedIn: 'root'
})
export class UpdateCacheService {
  private readonly CACHE_KEY = 'secure_vault_update_cache';
  
  // Default update check interval (e.g. 4 hours to avoid redundant GitHub API requests)
  private readonly DEFAULT_INTERVAL_MS = 4 * 60 * 60 * 1000;

  /**
   * Determines whether the app should contact GitHub API based on the last check timestamp.
   */
  shouldCheckForUpdate(force: boolean = false, intervalMs: number = this.DEFAULT_INTERVAL_MS): boolean {
    if (force) return true;

    const data = this.loadCache();
    if (!data.lastCheckedTimestamp) return true;

    const elapsed = Date.now() - data.lastCheckedTimestamp;
    return elapsed >= intervalMs;
  }

  /**
   * Records a completed check timestamp and optionally caches the latest release.
   */
  recordCheck(release: AppReleaseInfo | null): void {
    const data = this.loadCache();
    data.lastCheckedTimestamp = Date.now();
    if (release) {
      data.lastKnownRelease = release;
    }
    this.saveCache(data);
  }

  /**
   * Records that the user clicked "Later" for a specific version in the current session.
   */
  dismissVersion(version: string): void {
    const data = this.loadCache();
    if (!data.dismissedVersions.includes(version)) {
      data.dismissedVersions.push(version);
      this.saveCache(data);
    }
  }

  /**
   * Checks if a release has already been dismissed by the user.
   */
  isDismissed(version: string): boolean {
    const data = this.loadCache();
    return data.dismissedVersions.includes(version);
  }

  /**
   * Clears all update cache state.
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  private loadCache(): UpdateCacheData {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback on parse failure
    }

    return {
      lastCheckedTimestamp: 0,
      dismissedVersions: [],
      lastKnownRelease: null
    };
  }

  private saveCache(data: UpdateCacheData): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota issues
    }
  }
}
