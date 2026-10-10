import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FeedbackService } from './feedback.service';
import { NetworkStatusService } from './network-status.service';
import { AppUpdateService } from '../update/app-update.service';
import { GitHubReleaseService } from '../update/github-release.service';
import { FeedbackPayload } from '../../shared/models/feedback.model';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let network: NetworkStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeedbackService,
        NetworkStatusService,
        AppUpdateService,
        GitHubReleaseService
      ]
    });

    service = TestBed.inject(FeedbackService);
    network = TestBed.inject(NetworkStatusService);
  });

  const mockPayload: FeedbackPayload = {
    category: 'FEATURE',
    title: 'Add biometric quick-switch',
    description: 'Would love to quickly switch between fingerprint and PIN from the lock screen.',
    includeDeviceInfo: true,
    deviceInfo: {
      appVersion: 'v1.0.4',
      platform: 'Android APK (Native)',
      screenResolution: '412x915',
      timestamp: 1728590000000
    }
  };

  it('should format issue body correctly with diagnostics info', () => {
    const body = service.formatIssueBody(mockPayload);
    expect(body).toContain('Feature Suggestion');
    expect(body).toContain('Would love to quickly switch');
    expect(body).toContain('App Version');
    expect(body).toContain('v1.0.4');
    expect(body).toContain('Android APK');
  });

  it('should omit diagnostics when includeDeviceInfo is false', () => {
    const body = service.formatIssueBody({
      ...mockPayload,
      includeDeviceInfo: false
    });
    expect(body).not.toContain('Environment & Diagnostics');
    expect(body).toContain('Would love to quickly switch');
  });

  it('should generate a valid pre-filled GitHub Issue URL', () => {
    const url = service.generateGitHubIssueUrl(mockPayload);
    expect(url).toContain('https://github.com/Sabarish204/SecureVault/issues/new');
    expect(url).toContain('Add+biometric+quick-switch');
    expect(url).toContain('enhancement');
  });

  it('should map categories to correct GitHub labels', () => {
    expect(service.getCategoryLabels('FEATURE')).toContain('enhancement');
    expect(service.getCategoryLabels('BUG')).toContain('bug');
    expect(service.getCategoryLabels('IMPROVEMENT')).toContain('improvement');
    expect(service.getCategoryLabels('GENERAL')).toContain('user-feedback');
  });

  it('should return offline error when network is disconnected', async () => {
    const originalCheck = network.checkConnectivity;
    network.checkConnectivity = async () => false;

    const result = await service.submitFeedback(mockPayload);
    expect(result.success).toBe(false);
    expect(result.message).toContain('No active internet connection');

    network.checkConnectivity = originalCheck;
  });

  it('should provide direct GitHub URL fallback when proxy is empty', async () => {
    const originalCheck = network.checkConnectivity;
    network.checkConnectivity = async () => true;

    service.proxyEndpoint = '';
    const result = await service.submitFeedback(mockPayload);

    expect(result.success).toBe(true);
    expect(result.openedInBrowser).toBe(true);
    expect(result.issueUrl).toBeTruthy();
    expect(result.issueUrl).toContain('https://github.com/Sabarish204/SecureVault/issues/new');

    network.checkConnectivity = originalCheck;
  });
});
