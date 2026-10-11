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

export interface FeedbackAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 data URL for display and transfer
}

export interface FeedbackPayload {
  category: FeedbackCategory;
  title: string;
  description: string;
  includeDeviceInfo: boolean;
  deviceInfo?: FeedbackDeviceInfo;
  attachments?: FeedbackAttachment[];
}

export interface FeedbackSubmissionResult {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  openedInBrowser?: boolean;
  message: string;
}
