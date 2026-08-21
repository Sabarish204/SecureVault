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

export interface GitHubReleaseResult {
  release: AppReleaseInfo | null;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubReleaseService {
  private readonly DEFAULT_REPO = 'Sabarish204/SecureVault';
  private readonly API_TIMEOUT_MS = 10000;

  /**
   * Fetches the latest published stable release from GitHub.
   * Uses cache-busting and simple CORS headers to avoid preflight issues in mobile WebViews.
   */
  async getLatestRelease(repo: string = this.DEFAULT_REPO): Promise<GitHubReleaseResult> {
    const timestamp = Date.now();
    const endpoint = `https://api.github.com/repos/${repo}/releases/latest?_t=${timestamp}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          return { release: null, error: 'GitHub API rate limit reached. Please try again later.' };
        }
        return { release: null, error: `GitHub API returned HTTP ${response.status}.` };
      }

      const data = (await response.json()) as GitHubReleaseDto;

      // Validate release is valid, stable, and published
      if (!data || data.draft || data.prerelease || !data.tag_name) {
        return { release: null, error: 'No stable published release found.' };
      }

      // Locate primary APK asset
      const apkAsset = this.selectApkAsset(data.assets || []);
      if (!apkAsset) {
        return { release: null, error: 'No Android APK found in latest release.' };
      }

      // Locate optional SHA-256 integrity asset
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

      const release: AppReleaseInfo = {
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

      return { release };
    } catch (err: any) {
      const isAbort = err.name === 'AbortError';
      return {
        release: null,
        error: isAbort ? 'Connection timed out while checking GitHub.' : (err.message || 'Network connection error.')
      };
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
