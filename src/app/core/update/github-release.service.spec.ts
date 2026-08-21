import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubReleaseService, GitHubReleaseDto } from './github-release.service';

describe('GitHubReleaseService', () => {
  let service: GitHubReleaseService;

  beforeEach(() => {
    service = new GitHubReleaseService();
    vi.restoreAllMocks();
  });

  describe('selectApkAsset', () => {
    it('should return null when no assets are provided', () => {
      expect(service.selectApkAsset([])).toBeNull();
    });

    it('should select versioned SecureVault-v*.apk when present', () => {
      const assets = [
        { id: 1, name: 'other-file.zip', browser_download_url: 'http://zip', size: 100, content_type: 'zip' },
        { id: 2, name: 'SecureVault-v1.0.5.apk', browser_download_url: 'http://v1.0.5.apk', size: 5000, content_type: 'apk' },
        { id: 3, name: 'SecureVault.apk', browser_download_url: 'http://generic.apk', size: 5000, content_type: 'apk' }
      ];
      const selected = service.selectApkAsset(assets);
      expect(selected?.name).toBe('SecureVault-v1.0.5.apk');
    });

    it('should select SecureVault.apk if no versioned name is present', () => {
      const assets = [
        { id: 1, name: 'README.md', browser_download_url: 'http://readme', size: 100, content_type: 'txt' },
        { id: 2, name: 'SecureVault.apk', browser_download_url: 'http://generic.apk', size: 5000, content_type: 'apk' }
      ];
      const selected = service.selectApkAsset(assets);
      expect(selected?.name).toBe('SecureVault.apk');
    });

    it('should fallback to any APK if available', () => {
      const assets = [
        { id: 1, name: 'app-release.apk', browser_download_url: 'http://app.apk', size: 5000, content_type: 'apk' }
      ];
      const selected = service.selectApkAsset(assets);
      expect(selected?.name).toBe('app-release.apk');
    });
  });

  describe('getLatestRelease', () => {
    it('should parse valid GitHub release successfully', async () => {
      const mockRelease: GitHubReleaseDto = {
        id: 123,
        tag_name: 'v1.0.8',
        name: 'SecureVault v1.0.8',
        body: 'Security updates and new Indian bank portals',
        html_url: 'https://github.com/Sabarish204/SecureVault/releases/tag/v1.0.8',
        published_at: '2026-08-21T12:00:00Z',
        draft: false,
        prerelease: false,
        assets: [
          { id: 1, name: 'SecureVault-v1.0.8.apk', browser_download_url: 'https://example.com/SecureVault.apk', size: 10485760, content_type: 'application/vnd.android.package-archive' },
          { id: 2, name: 'SecureVault.apk.sha256', browser_download_url: 'https://example.com/sha256', size: 64, content_type: 'text/plain' }
        ]
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRelease
      } as any);

      const release = await service.getLatestRelease('Sabarish204/SecureVault');

      expect(release).not.toBeNull();
      expect(release?.tagName).toBe('v1.0.8');
      expect(release?.versionName).toBe('1.0.8');
      expect(release?.versionCode).toBe(8);
      expect(release?.apkFileName).toBe('SecureVault-v1.0.8.apk');
      expect(release?.sha256DownloadUrl).toBe('https://example.com/sha256');
    });

    it('should ignore draft releases and return null', async () => {
      const mockRelease: GitHubReleaseDto = {
        id: 124,
        tag_name: 'v1.0.9',
        name: 'Draft Release',
        body: '',
        html_url: '',
        published_at: '',
        draft: true,
        prerelease: false,
        assets: []
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRelease
      } as any);

      const release = await service.getLatestRelease();
      expect(release).toBeNull();
    });

    it('should ignore prereleases and return null', async () => {
      const mockRelease: GitHubReleaseDto = {
        id: 125,
        tag_name: 'v1.1.0-alpha',
        name: 'Pre Release',
        body: '',
        html_url: '',
        published_at: '',
        draft: false,
        prerelease: true,
        assets: []
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRelease
      } as any);

      const release = await service.getLatestRelease();
      expect(release).toBeNull();
    });

    it('should gracefully handle network error and return null', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error (offline)'));

      const release = await service.getLatestRelease();
      expect(release).toBeNull();
    });
  });
});
