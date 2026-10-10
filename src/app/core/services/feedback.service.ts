import { Injectable, inject } from '@angular/core';
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

  readonly categories: FeedbackCategoryOption[] = [
    { value: 'FEATURE', label: 'Feature Suggestion', icon: 'lightbulb', tagClass: 'tag-feature' },
    { value: 'BUG', label: 'Bug Report', icon: 'pest_control', tagClass: 'tag-bug' },
    { value: 'IMPROVEMENT', label: 'Improvement', icon: 'bolt', tagClass: 'tag-improvement' },
    { value: 'GENERAL', label: 'General Feedback', icon: 'chat', tagClass: 'tag-general' }
  ];

  /**
   * Collects non-invasive device diagnostic info (app version, OS/platform, screen).
   */
  getDeviceDiagnosticInfo(): FeedbackDeviceInfo {
    const isNative = Capacitor.isNativePlatform();
    const platform = isNative ? 'Android APK (Native)' : 'Web Browser / Desktop';
    const screenResolution = typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`
      : 'N/A';

    return {
      appVersion: `v${this.appUpdate.installedVersion()}`,
      platform,
      screenResolution,
      timestamp: Date.now()
    };
  }

  /**
   * Formats the user's feedback into structured markdown for the GitHub issue.
   */
  formatIssueBody(payload: FeedbackPayload): string {
    const categoryLabel = this.categories.find(c => c.value === payload.category)?.label || payload.category;
    let body = `### Category\n${categoryLabel}\n\n### Description\n${payload.description.trim()}\n`;

    if (payload.includeDeviceInfo && payload.deviceInfo) {
      body += `\n---\n### 📱 Environment & Diagnostics\n`;
      body += `- **App Version**: ${payload.deviceInfo.appVersion}\n`;
      body += `- **Platform**: ${payload.deviceInfo.platform}\n`;
      body += `- **Viewport**: ${payload.deviceInfo.screenResolution}\n`;
      body += `- **Timestamp**: ${new Date(payload.deviceInfo.timestamp).toUTCString()}\n`;
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
            labels: this.getCategoryLabels(payload.category)
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
