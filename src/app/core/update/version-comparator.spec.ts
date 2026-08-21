import { describe, it, expect } from 'vitest';
import { parseSemVer, compareSemVer, isUpdateAvailable } from './version-comparator';

describe('VersionComparator', () => {
  describe('parseSemVer', () => {
    it('should parse standard semantic version strings', () => {
      expect(parseSemVer('1.0.0')).toEqual([1, 0, 0]);
      expect(parseSemVer('1.10.4')).toEqual([1, 10, 4]);
      expect(parseSemVer('2.0')).toEqual([2, 0]);
    });

    it('should handle leading "v" and "V" prefixes', () => {
      expect(parseSemVer('v1.0.0')).toEqual([1, 0, 0]);
      expect(parseSemVer('V2.5.1')).toEqual([2, 5, 1]);
    });

    it('should strip pre-release identifiers and build metadata', () => {
      expect(parseSemVer('1.2.3-beta.1')).toEqual([1, 2, 3]);
      expect(parseSemVer('v1.0.5+20260821')).toEqual([1, 0, 5]);
    });

    it('should handle malformed or empty inputs safely', () => {
      expect(parseSemVer('')).toEqual([0]);
      expect(parseSemVer('abc')).toEqual([0]);
    });
  });

  describe('compareSemVer', () => {
    it('should identify newer versions correctly', () => {
      expect(compareSemVer('1.0.0', '1.1.0')).toBe(-1);
      expect(compareSemVer('1.9.0', '1.10.0')).toBe(-1);
      expect(compareSemVer('1.9.9', '1.10.0')).toBe(-1);
      expect(compareSemVer('1.99.99', '2.0.0')).toBe(-1);
      expect(compareSemVer('v1.0.1', 'v1.0.2')).toBe(-1);
    });

    it('should identify older versions correctly', () => {
      expect(compareSemVer('1.10.0', '1.9.0')).toBe(1);
      expect(compareSemVer('2.0.0', '1.99.99')).toBe(1);
      expect(compareSemVer('v1.2.0', '1.1.0')).toBe(1);
    });

    it('should identify equal versions correctly', () => {
      expect(compareSemVer('1.0.0', '1.0.0')).toBe(0);
      expect(compareSemVer('v1.5.0', '1.5.0')).toBe(0);
      expect(compareSemVer('1.0', '1.0.0')).toBe(0);
    });
  });

  describe('isUpdateAvailable', () => {
    it('should return true when latest semver is higher', () => {
      expect(isUpdateAvailable({ versionName: '1.0.0' }, { versionName: '1.0.1' })).toBe(true);
      expect(isUpdateAvailable({ versionName: '1.9.0' }, { versionName: '1.10.0' })).toBe(true);
    });

    it('should return false when latest semver is equal or lower', () => {
      expect(isUpdateAvailable({ versionName: '1.0.0' }, { versionName: '1.0.0' })).toBe(false);
      expect(isUpdateAvailable({ versionName: '1.5.0' }, { versionName: '1.4.9' })).toBe(false);
    });

    it('should prioritize versionCode when available', () => {
      expect(
        isUpdateAvailable(
          { versionName: '1.0.0', versionCode: 5 },
          { versionName: '1.0.0', versionCode: 6 }
        )
      ).toBe(true);

      expect(
        isUpdateAvailable(
          { versionName: '1.0.0', versionCode: 10 },
          { versionName: '1.0.0', versionCode: 10 }
        )
      ).toBe(false);

      expect(
        isUpdateAvailable(
          { versionName: '1.0.0', versionCode: 10 },
          { versionName: '1.0.0', versionCode: 8 }
        )
      ).toBe(false);
    });
  });
});
