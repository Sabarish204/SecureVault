import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NetworkStatusService } from './network-status.service';
import { AppUpdateService } from '../update/app-update.service';
import {
  FeedbackCategory,
  FeedbackCategoryOption,
  FeedbackDeviceInfo,
  FeedbackPayload,
  FeedbackSubmissionResult
} from '../../shared/models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly network = inject(NetworkStatusService);
  private readonly appUpdate = inject(AppUpdateService);

  readonly REPO_PATH = 'Sabarish204/SecureVault';
  /**
   * Optional proxy endpoint URL (e.g. Cloudflare Worker).
   * If not set or offline, falls back to direct GitHub issue creation.
   */
  proxyEndpoint: string = 'https://securevault-feedback.sabarish204.workers.dev';

  readonly isOpen = signal<boolean>(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  readonly categories: FeedbackCategoryOption[] = [
    { value: 'FEATURE', label: 'Feature Suggestion', icon: 'lightbulb', tagClass: 'tag-feature' },
    { value: 'BUG', label: 'Bug Report', icon: 'pest_control', tagClass: 'tag-bug' },
    { value: 'IMPROVEMENT', label: 'Improvement', icon: 'bolt', tagClass: 'tag-improvement' },
    { value: 'GENERAL', label: 'General Feedback', icon: 'chat', tagClass: 'tag-general' }
  ];

  /**
   * Known smartphone model prefixes mapped to consumer marketing names
   */
  readonly SMARTPHONE_MODELS: Record<string, string> = {
    // Samsung Galaxy A Series
    'SM-A556': 'Samsung Galaxy A55 5G',
    'SM-A546': 'Samsung Galaxy A54 5G',
    'SM-A536': 'Samsung Galaxy A53 5G',
    'SM-A528': 'Samsung Galaxy A52s 5G',
    'SM-A526': 'Samsung Galaxy A52 5G',
    'SM-A525': 'Samsung Galaxy A52 4G',
    'SM-A356': 'Samsung Galaxy A35 5G',
    'SM-A346': 'Samsung Galaxy A34 5G',
    'SM-A336': 'Samsung Galaxy A33 5G',
    'SM-A256': 'Samsung Galaxy A25 5G',
    'SM-A245': 'Samsung Galaxy A24',
    'SM-A156': 'Samsung Galaxy A15 5G',
    'SM-A155': 'Samsung Galaxy A15 4G',
    'SM-A146': 'Samsung Galaxy A14 5G',
    'SM-A145': 'Samsung Galaxy A14 4G',
    'SM-A057': 'Samsung Galaxy A05s',
    'SM-A055': 'Samsung Galaxy A05',
    'SM-A736': 'Samsung Galaxy A73 5G',

    // Samsung Galaxy S Series
    'SM-S928': 'Samsung Galaxy S24 Ultra',
    'SM-S926': 'Samsung Galaxy S24+',
    'SM-S921': 'Samsung Galaxy S24',
    'SM-S918': 'Samsung Galaxy S23 Ultra',
    'SM-S916': 'Samsung Galaxy S23+',
    'SM-S911': 'Samsung Galaxy S23',
    'SM-S908': 'Samsung Galaxy S22 Ultra',
    'SM-S906': 'Samsung Galaxy S22+',
    'SM-S901': 'Samsung Galaxy S22',
    'SM-G998': 'Samsung Galaxy S21 Ultra 5G',
    'SM-G996': 'Samsung Galaxy S21+ 5G',
    'SM-G991': 'Samsung Galaxy S21 5G',
    'SM-G990': 'Samsung Galaxy S21 FE 5G',
    'SM-S711': 'Samsung Galaxy S23 FE',
    'SM-S721': 'Samsung Galaxy S24 FE',
    'SM-G781': 'Samsung Galaxy S20 FE 5G',
    'SM-G780': 'Samsung Galaxy S20 FE',

    // Samsung Galaxy M & F Series
    'SM-M556': 'Samsung Galaxy M55 5G',
    'SM-M546': 'Samsung Galaxy M54 5G',
    'SM-M346': 'Samsung Galaxy M34 5G',
    'SM-M146': 'Samsung Galaxy M14 5G',
    'SM-F546': 'Samsung Galaxy F54 5G',
    'SM-F346': 'Samsung Galaxy F34 5G',

    // Samsung Galaxy Z Series
    'SM-F956': 'Samsung Galaxy Z Fold 6',
    'SM-F946': 'Samsung Galaxy Z Fold 5',
    'SM-F936': 'Samsung Galaxy Z Fold 4',
    'SM-F741': 'Samsung Galaxy Z Flip 6',
    'SM-F731': 'Samsung Galaxy Z Flip 5',
    'SM-F721': 'Samsung Galaxy Z Flip 4',

    // Google Pixel
    'PIXEL 9 PRO XL': 'Google Pixel 9 Pro XL',
    'PIXEL 9 PRO': 'Google Pixel 9 Pro',
    'PIXEL 9': 'Google Pixel 9',
    'PIXEL 8A': 'Google Pixel 8a',
    'PIXEL 8 PRO': 'Google Pixel 8 Pro',
    'PIXEL 8': 'Google Pixel 8',
    'PIXEL 7A': 'Google Pixel 7a',
    'PIXEL 7 PRO': 'Google Pixel 7 Pro',
    'PIXEL 7': 'Google Pixel 7',
    'PIXEL 6A': 'Google Pixel 6a',
    'PIXEL 6 PRO': 'Google Pixel 6 Pro',
    'PIXEL 6': 'Google Pixel 6',

    // OnePlus
    'CPH2581': 'OnePlus 12',
    'CPH2609': 'OnePlus 12R',
    'CPH2449': 'OnePlus 11',
    'CPH2613': 'OnePlus Nord CE 4',
    'CPH2513': 'OnePlus Nord 3',

    // Nothing
    'A063': 'Nothing Phone (1)',
    'A065': 'Nothing Phone (2)',
    'A142': 'Nothing Phone (2a)'
  };

  /**
   * Resolves technical hardware codes (like 'SM-A556B') into consumer marketing names
   * (e.g. 'Samsung Galaxy A55 5G (SM-A556B)').
   */
  resolveFullSmartphoneModel(rawModel: string, manufacturer?: string): string {
    if (!rawModel || rawModel === 'Generic Device') {
      return manufacturer ? `${this.capitalize(manufacturer)} Smartphone` : 'Android Smartphone';
    }

    const cleanModel = rawModel.trim();

    // If already contains friendly branding, return as-is
    if (
      cleanModel.includes('Galaxy') ||
      cleanModel.includes('Pixel') ||
      cleanModel.includes('OnePlus') ||
      cleanModel.includes('Nothing Phone')
    ) {
      return cleanModel;
    }

    const upperModel = cleanModel.toUpperCase();

    // Check Samsung SM-xxxx model prefixes
    const samsungMatch = upperModel.match(/SM-([A-Z0-9]{4})/i);
    if (samsungMatch) {
      const code = `SM-${samsungMatch[1].toUpperCase()}`;
      const marketingName = this.SMARTPHONE_MODELS[code];
      if (marketingName) {
        return `${marketingName} (${cleanModel})`;
      }
      return cleanModel.toLowerCase().startsWith('samsung')
        ? cleanModel
        : `Samsung ${cleanModel}`;
    }

    // Check direct matching in known models dictionary
    for (const [key, name] of Object.entries(this.SMARTPHONE_MODELS)) {
      if (upperModel.includes(key)) {
        return `${name} (${cleanModel})`;
      }
    }

    // If manufacturer provided and not in model string
    if (manufacturer && !cleanModel.toLowerCase().startsWith(manufacturer.toLowerCase())) {
      return `${this.capitalize(manufacturer)} ${cleanModel}`;
    }

    return cleanModel;
  }

  private capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Parses user-agent string as fallback for web/desktop or when native call fails
   */
  private parseUserAgentInfo(): { deviceModel: string; osVersion: string } {
    if (typeof navigator === 'undefined') {
      return { deviceModel: 'Generic Device', osVersion: 'Unknown OS' };
    }
    const ua = navigator.userAgent || '';

    // Check for Android: e.g. "Linux; Android 14; SM-A556B" or "Android 13; Pixel 8"
    const androidMatch = ua.match(/Android\s+([0-9.]+)(?:;\s*([^;)]+))?/i);
    if (androidMatch) {
      const osVer = `Android ${androidMatch[1]}`;
      let rawModel = androidMatch[2] ? androidMatch[2].trim() : '';
      if (rawModel) {
        rawModel = rawModel.replace(/\s*Build\/.*$/i, '').trim();
      }
      const model = rawModel && !['K', 'wv', 'Mobile'].includes(rawModel)
        ? this.resolveFullSmartphoneModel(rawModel)
        : 'Android Smartphone';
      return { deviceModel: model, osVersion: osVer };
    }

    if (/iPhone/i.test(ua)) {
      const iosMatch = ua.match(/OS\s+([0-9_]+)/i);
      const ver = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
      return { deviceModel: 'Apple iPhone', osVersion: ver };
    }

    if (/iPad/i.test(ua)) {
      const iosMatch = ua.match(/OS\s+([0-9_]+)/i);
      const ver = iosMatch ? `iPadOS ${iosMatch[1].replace(/_/g, '.')}` : 'iPadOS';
      return { deviceModel: 'Apple iPad', osVersion: ver };
    }

    if (/Windows NT/i.test(ua)) {
      const winMatch = ua.match(/Windows NT\s+([0-9.]+)/i);
      const verMap: Record<string, string> = { '10.0': '10 / 11', '6.3': '8.1', '6.1': '7' };
      const winVer = winMatch ? (verMap[winMatch[1]] || winMatch[1]) : '';
      return { deviceModel: 'Desktop PC', osVersion: `Windows ${winVer}` };
    }

    if (/Macintosh/i.test(ua)) {
      return { deviceModel: 'Apple Mac', osVersion: 'macOS' };
    }

    if (/Linux/i.test(ua)) {
      return { deviceModel: 'Linux Device', osVersion: 'Linux' };
    }

    return { deviceModel: 'Web / Desktop Client', osVersion: 'Browser' };
  }

  /**
   * Synchronously collects device diagnostic info with immediate user-agent parsing
   */
  getDeviceDiagnosticInfoSync(): FeedbackDeviceInfo {
    const isNative = Capacitor.isNativePlatform();
    const platform = isNative ? 'Android APK (Native)' : 'Web Browser / Desktop';
    const screenResolution = typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`
      : 'N/A';

    const parsed = this.parseUserAgentInfo();

    return {
      appVersion: `v${this.appUpdate.installedVersion()}`,
      platform,
      deviceModel: parsed.deviceModel,
      osVersion: parsed.osVersion,
      screenResolution,
      timestamp: Date.now()
    };
  }

  /**
   * Asynchronously collects comprehensive native smartphone model (e.g. "Samsung Galaxy A55 5G (SM-A556B)"),
   * Android version (e.g. "Android 14 (API 34)"), and app diagnostics.
   */
  async getDeviceDiagnosticInfo(): Promise<FeedbackDeviceInfo> {
    const baseInfo = this.getDeviceDiagnosticInfoSync();

    if (Capacitor.isNativePlatform()) {
      try {
        const nativeInfo = await this.appUpdate.getNativeDeviceInfo();
        if (nativeInfo && nativeInfo.model && nativeInfo.model !== 'Unknown') {
          const manufacturer = this.capitalize(nativeInfo.manufacturer || '');
          const rawModel = (nativeInfo.model || '').trim();
          const androidVer = nativeInfo.androidVersion || '';
          const sdkInt = nativeInfo.sdkInt ? ` (API ${nativeInfo.sdkInt})` : '';

          const fullModel = this.resolveFullSmartphoneModel(rawModel, manufacturer);

          return {
            ...baseInfo,
            deviceModel: fullModel,
            osVersion: `Android ${androidVer}${sdkInt}`.trim()
          };
        }
      } catch {
        // Fall back gracefully to base user-agent diagnostic info
      }
    }

    return baseInfo;
  }

  /**
   * Formats the user's feedback into structured markdown for the GitHub issue.
   */
  formatIssueBody(payload: FeedbackPayload): string {
    const categoryLabel = this.categories.find(c => c.value === payload.category)?.label || payload.category;
    let body = `### Category\n${categoryLabel}\n\n### Description\n${payload.description.trim()}\n`;

    if (payload.includeDeviceInfo && payload.deviceInfo) {
      const isAndroid = (payload.deviceInfo.osVersion || '').toLowerCase().includes('android');
      const modelLabel = isAndroid ? 'Smartphone Model' : 'Device Model';
      const osLabel = isAndroid ? 'Android Version' : 'OS Version';

      body += `\n---\n### 📱 Environment & Diagnostics\n`;
      body += `- **${modelLabel}**: ${payload.deviceInfo.deviceModel || 'N/A'}\n`;
      body += `- **${osLabel}**: ${payload.deviceInfo.osVersion || 'N/A'}\n`;
      body += `- **App Version**: ${payload.deviceInfo.appVersion}\n`;
      body += `- **Platform**: ${payload.deviceInfo.platform}\n`;
      body += `- **Viewport**: ${payload.deviceInfo.screenResolution}\n`;
      body += `- **Timestamp**: ${new Date(payload.deviceInfo.timestamp).toUTCString()}\n`;
    }

    if (payload.attachments && payload.attachments.length > 0) {
      body += `\n---\n### 📸 Attachments\n`;
      body += `*${payload.attachments.length} screenshot(s) attached.*  \n`;
    }

    body += `\n> *Submitted via SecureVault in-app feedback.*`;
    return body;
  }

  /**
   * Generates a pre-filled direct GitHub Issue URL on the repository.
   */
  generateGitHubIssueUrl(payload: FeedbackPayload): string {
    const title = `[${payload.category}] ${payload.title.trim()}`;
    const body = this.formatIssueBody(payload);
    const labels = this.getCategoryLabels(payload.category).join(',');

    const params = new URLSearchParams({
      title,
      body,
      labels
    });

    return `https://github.com/${this.REPO_PATH}/issues/new?${params.toString()}`;
  }

  getCategoryLabels(category: FeedbackCategory): string[] {
    switch (category) {
      case 'FEATURE':
        return ['enhancement', 'user-suggestion'];
      case 'BUG':
        return ['bug', 'user-report'];
      case 'IMPROVEMENT':
        return ['improvement', 'user-feedback'];
      case 'GENERAL':
      default:
        return ['user-feedback'];
    }
  }

  /**
   * Submits feedback to the GitHub repository.
   * If a proxy endpoint is configured, submits via API directly.
   * Otherwise, provides the direct GitHub issue creation link.
   */
  async submitFeedback(payload: FeedbackPayload): Promise<FeedbackSubmissionResult> {
    const isOnline = await this.network.checkConnectivity();
    if (!isOnline) {
      return {
        success: false,
        message: 'No active internet connection detected. Please connect your device to Wi-Fi or mobile data.'
      };
    }

    // Ensure full native smartphone diagnostics info is included
    if (payload.includeDeviceInfo) {
      if (!payload.deviceInfo || !payload.deviceInfo.deviceModel || payload.deviceInfo.deviceModel === 'Generic Device') {
        try {
          payload.deviceInfo = await this.getDeviceDiagnosticInfo();
        } catch {
          // Keep existing deviceInfo
        }
      }
    }

    if (this.proxyEndpoint) {
      try {
        const response = await fetch(this.proxyEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `[${payload.category}] ${payload.title.trim()}`,
            body: this.formatIssueBody(payload),
            labels: this.getCategoryLabels(payload.category),
            attachments: payload.attachments || []
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            issueUrl: data.issueUrl,
            issueNumber: data.issueNumber,
            message: 'Feedback submitted successfully! Thank you for helping improve SecureVault.'
          };
        }
      } catch (err) {
        console.warn('Proxy submission failed, falling back to direct GitHub issue URL:', err);
      }
    }

    // Direct GitHub fallback
    const issueUrl = this.generateGitHubIssueUrl(payload);
    return {
      success: true,
      issueUrl,
      openedInBrowser: true,
      message: 'Opening GitHub Issues in your browser to submit your suggestion...'
    };
  }
}
