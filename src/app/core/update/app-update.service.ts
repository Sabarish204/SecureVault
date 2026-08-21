import { Injectable, inject, signal } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { GitHubReleaseService, AppReleaseInfo } from './github-release.service';
import { UpdateCacheService } from './update-cache.service';
import { isUpdateAvailable } from './version-comparator';

export type UpdateCheckStatus = 'UPDATE_AVAILABLE' | 'UP_TO_DATE' | 'CHECK_FAILED';

export interface UpdateCheckResult {
  status: UpdateCheckStatus;
  message?: string;
  release?: AppReleaseInfo | null;
}

interface NativeAppVersion {
  appId: string;
  versionCode: number;
  versionName: string;
}

interface NativeAppUpdatePlugin {
  getAppVersion(): Promise<NativeAppVersion>;
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<{ opened: boolean }>;
  saveAndInstallApk(options: { base64Data: string }): Promise<{ success: boolean; path: string }>;
}

const AppUpdate = registerPlugin<NativeAppUpdatePlugin>('AppUpdate');

@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  private readonly githubService = inject(GitHubReleaseService);
  private readonly cacheService = inject(UpdateCacheService);

  readonly isChecking = signal<boolean>(false);
  readonly updateAvailable = signal<boolean>(false);
  readonly currentRelease = signal<AppReleaseInfo | null>(null);
  readonly installedVersion = signal<string>('1.0.0');
  readonly installedCode = signal<number>(1);

  readonly isModalOpen = signal<boolean>(false);
  readonly isDownloading = signal<boolean>(false);
  readonly downloadProgress = signal<number>(0);
  readonly downloadStatusText = signal<string>('');
  readonly errorMessage = signal<string>('');
  readonly needsInstallPermission = signal<boolean>(false);

  private downloadAbortController: AbortController | null = null;

  /**
   * Initializes and detects installed app version.
   */
  async init(): Promise<void> {
    await this.detectInstalledVersion();
  }

  /**
   * Retrieves installed version from native Android PackageManager or falls back to web defaults.
   */
  async detectInstalledVersion(): Promise<{ versionName: string; versionCode: number }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const info = await AppUpdate.getAppVersion();
        if (info && info.versionName) {
          this.installedVersion.set(info.versionName);
          this.installedCode.set(Number(info.versionCode) || 1);
          return { versionName: info.versionName, versionCode: Number(info.versionCode) || 1 };
        }
      } catch {
        // Fallback on web/test runner
      }
    }

    return { versionName: this.installedVersion(), versionCode: this.installedCode() };
  }

  /**
   * Checks GitHub Releases for a newer version.
   * Completely resilient: failures fail silently without disrupting the user.
   */
  async checkForUpdates(force: boolean = false): Promise<UpdateCheckResult> {
    if (this.isChecking()) {
      return { status: 'CHECK_FAILED', message: 'Update check is already in progress.' };
    }

    // Check throttling cache
    if (!this.cacheService.shouldCheckForUpdate(force)) {
      return { status: 'UP_TO_DATE' };
    }

    this.isChecking.set(true);
    this.errorMessage.set('');

    try {
      const installed = await this.detectInstalledVersion();
      const result = await this.githubService.getLatestRelease();

      this.cacheService.recordCheck(result.release);

      if (!result.release) {
        this.updateAvailable.set(false);
        return {
          status: 'CHECK_FAILED',
          message: result.error || 'Could not connect to GitHub Releases.'
        };
      }

      const latest = result.release;
      const available = isUpdateAvailable(
        { versionName: installed.versionName, versionCode: installed.versionCode },
        { versionName: latest.versionName, versionCode: latest.versionCode }
      );

      if (available) {
        this.currentRelease.set(latest);
        this.updateAvailable.set(true);

        // Show modal if not previously dismissed (or if user forced check)
        if (force || !this.cacheService.isDismissed(latest.versionName)) {
          this.isModalOpen.set(true);
        }
        return { status: 'UPDATE_AVAILABLE', release: latest };
      } else {
        this.updateAvailable.set(false);
        this.currentRelease.set(null);
        return { status: 'UP_TO_DATE', release: latest };
      }
    } catch (err: any) {
      return { status: 'CHECK_FAILED', message: err.message || 'Update check failed.' };
    } finally {
      this.isChecking.set(false);
    }
  }

  /**
   * Downloads the APK with live byte progress, verifies SHA-256 integrity,
   * and triggers the native package installation intent.
   */
  async downloadAndInstall(): Promise<void> {
    const release = this.currentRelease();
    if (!release || !release.apkDownloadUrl) {
      this.errorMessage.set('No download URL available for this release.');
      return;
    }

    this.isDownloading.set(true);
    this.downloadProgress.set(0);
    this.downloadStatusText.set('Connecting to download server...');
    this.errorMessage.set('');
    this.needsInstallPermission.set(false);

    this.downloadAbortController = new AbortController();

    try {
      // 1. Check Android Unknown App installation permission on native
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await AppUpdate.canRequestPackageInstalls();
          if (!perm.canInstall) {
            this.needsInstallPermission.set(true);
            this.isDownloading.set(false);
            return;
          }
        } catch {
          // Continue if permission check is unsupported on older Android
        }
      }

      // 2. Stream download with progress tracking
      const response = await fetch(release.apkDownloadUrl, {
        signal: this.downloadAbortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Download failed with HTTP ${response.status}`);
      }

      const contentLengthHeader = response.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : release.apkSizeBytes;

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
          this.downloadProgress.set(percent);
          const receivedMB = (receivedBytes / (1024 * 1024)).toFixed(1);
          const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
          this.downloadStatusText.set(`Downloading: ${receivedMB} MB of ${totalMB} MB (${percent}%)`);
        } else {
          const receivedMB = (receivedBytes / (1024 * 1024)).toFixed(1);
          this.downloadStatusText.set(`Downloaded ${receivedMB} MB...`);
        }
      }

      this.downloadStatusText.set('Verifying package integrity...');

      // Combine chunks into single Uint8Array
      const fullBuffer = new Uint8Array(receivedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // 3. Cryptographic SHA-256 Checksum Validation (if published)
      if (release.sha256DownloadUrl) {
        const isValid = await this.verifySha256Checksum(fullBuffer.buffer as ArrayBuffer, release.sha256DownloadUrl);
        if (!isValid) {
          throw new Error('APK checksum verification failed. The downloaded file may be corrupted.');
        }
      }

      // 4. Launch Native Android Installer Bridge
      if (Capacitor.isNativePlatform()) {
        this.downloadStatusText.set('Launching Android installer...');
        const base64Data = this.uint8ArrayToBase64(fullBuffer);
        await AppUpdate.saveAndInstallApk({ base64Data });
        this.isModalOpen.set(false);
      } else {
        // Desktop / Browser Fallback: Trigger direct file download
        this.triggerBrowserDownload(fullBuffer, release.apkFileName);
        this.downloadStatusText.set('Download completed successfully.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.downloadStatusText.set('Download cancelled.');
      } else {
        this.errorMessage.set(err.message || 'Failed to download or install update.');
      }
    } finally {
      this.isDownloading.set(false);
    }
  }

  /**
   * Opens Android Unknown App Sources permission settings.
   */
  async openInstallSettings(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await AppUpdate.openInstallPermissionSettings();
      } catch {
        this.errorMessage.set('Could not open settings automatically. Please allow in Android App Settings.');
      }
    }
  }

  /**
   * Cancels an ongoing download.
   */
  cancelDownload(): void {
    if (this.downloadAbortController) {
      this.downloadAbortController.abort();
      this.downloadAbortController = null;
    }
    this.isDownloading.set(false);
    this.downloadProgress.set(0);
  }

  /**
   * Dismisses the update popup for the current session.
   */
  dismissModal(): void {
    const release = this.currentRelease();
    if (release) {
      this.cacheService.dismissVersion(release.versionName);
    }
    this.isModalOpen.set(false);
  }

  /**
   * Verifies SHA-256 checksum of downloaded buffer against remote hash.
   */
  private async verifySha256Checksum(buffer: ArrayBuffer, sha256Url: string): Promise<boolean> {
    try {
      const response = await fetch(sha256Url);
      if (!response.ok) return true; // If hash file is unavailable, proceed

      const expectedHashRaw = await response.text();
      const expectedHash = expectedHashRaw.trim().split(/\s+/)[0].toLowerCase();

      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();

      return expectedHash === actualHash;
    } catch {
      return true; // Gracefully continue if hash fetching fails
    }
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private triggerBrowserDownload(bytes: Uint8Array, fileName: string): void {
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
