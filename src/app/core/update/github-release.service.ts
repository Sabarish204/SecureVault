import { Injectable } from '@angular/core';

export interface GitHubAsset {
  id: number;
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface GitHubReleaseDto {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
}

export interface AppReleaseInfo {
  tagName: string;
  versionName: string;
  versionCode?: number;
  releaseNotes: string;
  releaseUrl: string;
  publishedAt: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes: number;
  sha256DownloadUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubReleaseService {
  private readonly DEFAULT_REPO = 'Sabarish204/SecureVault';
  private readonly API_TIMEOUT_MS = 8000;

  /**
   * Fetches the latest published stable release from GitHub.
   * Completely offline-resilient: catches all errors and fails silently.
   */
  async getLatestRelease(repo: string = this.DEFAULT_REPO): Promise<AppReleaseInfo | null> {
    // 1. Fast offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }

    const endpoint = `https://api.github.com/repos/${repo}/releases/latest`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Non-200 responses (e.g. 404, 403 rate limit) handled silently
        return null;
      }

      const data = (await response.json()) as GitHubReleaseDto;

      // 2. Validate release is valid, stable, and published
      if (!data || data.draft || data.prerelease || !data.tag_name) {
        return null;
      }

      // 3. Locate the primary APK asset
      const apkAsset = this.selectApkAsset(data.assets || []);
      if (!apkAsset) {
        return null;
      }

      // 4. Locate optional SHA-256 integrity asset
      const sha256Asset = this.selectSha256Asset(data.assets || [], apkAsset.name);

      const versionName = data.tag_name.replace(/^v/i, '').trim();

      // Extract optional build/versionCode if present in tag (e.g., v1.0.14 -> 14)
      let versionCode: number | undefined;
      const tagParts = versionName.split('.');
      if (tagParts.length >= 3) {
        const buildNum = parseInt(tagParts[tagParts.length - 1], 10);
        if (!isNaN(buildNum) && buildNum > 0) {
          versionCode = buildNum;
        }
      }

      return {
        tagName: data.tag_name,
        versionName,
        versionCode,
        releaseNotes: data.body ? data.body.trim() : 'No release notes provided.',
        releaseUrl: data.html_url || `https://github.com/${repo}/releases`,
        publishedAt: data.published_at || new Date().toISOString(),
        apkDownloadUrl: apkAsset.browser_download_url,
        apkFileName: apkAsset.name,
        apkSizeBytes: apkAsset.size || 0,
        sha256DownloadUrl: sha256Asset?.browser_download_url
      };
    } catch {
      // Catch network drops, timeouts, DNS failures, and CORS issues silently
      return null;
    }
  }

  /**
   * Selects the most appropriate APK asset from the release assets list.
   * Prefers files matching 'SecureVault-*.apk' or 'SecureVault.apk', then any '*.apk'.
   */
  selectApkAsset(assets: GitHubAsset[]): GitHubAsset | null {
    if (!assets || assets.length === 0) {
      return null;
    }

    const apkAssets = assets.filter(a => a.name && a.name.toLowerCase().endsWith('.apk'));

    if (apkAssets.length === 0) {
      return null;
    }

    // 1. Prefer versioned SecureVault-v*.apk
    const versionedSecureVault = apkAssets.find(a =>
      /securevault-v?[\d.]+\.apk$/i.test(a.name)
    );
    if (versionedSecureVault) return versionedSecureVault;

    // 2. Prefer generic SecureVault.apk
    const namedSecureVault = apkAssets.find(a =>
      a.name.toLowerCase().includes('securevault')
    );
    if (namedSecureVault) return namedSecureVault;

    // 3. Fallback to first APK asset
    return apkAssets[0];
  }

  /**
   * Selects matching SHA-256 checksum asset if available.
   */
  private selectSha256Asset(assets: GitHubAsset[], apkName: string): GitHubAsset | undefined {
    return assets.find(
      a =>
        a.name === `${apkName}.sha256` ||
        a.name === 'SecureVault.apk.sha256' ||
        a.name.toLowerCase().endsWith('.sha256')
    );
  }
}
