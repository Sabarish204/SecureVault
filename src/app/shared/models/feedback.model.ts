export type FeedbackCategory = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'GENERAL';

export interface FeedbackCategoryOption {
  value: FeedbackCategory;
  label: string;
  icon: string;
  tagClass: string;
}

export interface FeedbackDeviceInfo {
  appVersion: string;
  platform: string;
  deviceModel: string;
  osVersion: string;
  screenResolution: string;
  timestamp: number;
}

export interface FeedbackPayload {
  category: FeedbackCategory;
  title: string;
  description: string;
  includeDeviceInfo: boolean;
  deviceInfo?: FeedbackDeviceInfo;
}

export interface FeedbackSubmissionResult {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  openedInBrowser?: boolean;
  message: string;
}
