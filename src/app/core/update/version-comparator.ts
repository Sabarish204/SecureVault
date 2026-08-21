/**
 * Semantic version and build code comparison utility.
 * Safely handles tag prefixes ('v1.0.0' vs '1.0.0'), multi-digit subversions
 * (e.g., 1.9.0 < 1.10.0, 1.10.0 > 1.9.9, 2.0.0 > 1.99.99), and build codes.
 */

export interface VersionInfo {
  versionName: string;
  versionCode?: number;
}

/**
 * Normalizes a version string into an array of integers.
 * Strips leading 'v', pre-release metadata, and non-numeric suffixes.
 * Example: 'v1.10.3-beta' -> [1, 10, 3]
 */
export function parseSemVer(version: string): number[] {
  if (!version || typeof version !== 'string') {
    return [0];
  }

  // Remove leading 'v' or 'V'
  let clean = version.trim().replace(/^v/i, '');

  // Strip pre-release or build metadata (e.g. -beta, +build)
  const hyphenIdx = clean.indexOf('-');
  if (hyphenIdx !== -1) {
    clean = clean.substring(0, hyphenIdx);
  }
  const plusIdx = clean.indexOf('+');
  if (plusIdx !== -1) {
    clean = clean.substring(0, plusIdx);
  }

  const parts = clean.split('.').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });

  return parts.length > 0 ? parts : [0];
}

/**
 * Compares two semantic version strings.
 * Returns:
 *   -1 if v1 < v2  (v2 is newer)
 *    0 if v1 === v2 (same version)
 *    1 if v1 > v2  (v1 is newer)
 */
export function compareSemVer(v1: string, v2: string): number {
  const parts1 = parseSemVer(v1);
  const parts2 = parseSemVer(v2);

  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Determines whether an update is available based on installed vs latest versions.
 * If versionCodes are provided and valid, versionCode comparison takes precedence.
 * Otherwise, falls back to semantic version comparison.
 */
export function isUpdateAvailable(
  installed: VersionInfo,
  latest: VersionInfo
): boolean {
  // 1. If both have valid versionCodes, compare codes directly
  if (
    typeof installed.versionCode === 'number' &&
    typeof latest.versionCode === 'number' &&
    installed.versionCode > 0 &&
    latest.versionCode > 0
  ) {
    return latest.versionCode > installed.versionCode;
  }

  // 2. Otherwise, compare semantic version strings
  return compareSemVer(installed.versionName, latest.versionName) === -1;
}
