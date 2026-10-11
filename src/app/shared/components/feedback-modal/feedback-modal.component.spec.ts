import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FeedbackModalComponent } from './feedback-modal.component';
import { FeedbackService } from '../../../core/services/feedback.service';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { AppUpdateService } from '../../../core/update/app-update.service';
import { GitHubReleaseService } from '../../../core/update/github-release.service';

describe('FeedbackModalComponent', () => {
  let component: FeedbackModalComponent;
  let network: NetworkStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeedbackModalComponent],
      providers: [
        FeedbackService,
        NetworkStatusService,
        AppUpdateService,
        GitHubReleaseService
      ]
    });

    const fixture = TestBed.createComponent(FeedbackModalComponent);
    component = fixture.componentInstance;
    network = TestBed.inject(NetworkStatusService);
  });

  it('should initialize with FEATURE as default category', () => {
    expect(component.selectedCategory).toBe('FEATURE');
    expect(component.title).toBe('');
    expect(component.description).toBe('');
    expect(component.includeDeviceInfo).toBe(true);
  });

  it('should validate required fields before submission', async () => {
    component.title = '';
    component.description = '';

    await component.onSubmit();
    expect(component.errorMessage()).toContain('Please provide both a title and details');
  });

  it('should validate network connection before submission', async () => {
    component.title = 'Dark mode';
    component.description = 'Add dark mode please';

    network.isOnline.set(false);
    await component.onSubmit();

    expect(component.errorMessage()).toContain('connect to the internet');
  });

  it('should lock document body scroll on init and release on destroy', () => {
    component.ngOnInit();
    expect(document.body.style.overflow).toBe('hidden');

    component.ngOnDestroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('should emit close on Escape key press', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    component.onEscapePress();
    expect(closed).toBe(true);
  });

  it('should emit close when clicking directly on backdrop', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    const backdropEl = document.createElement('div');
    const mockEvent = {
      target: backdropEl,
      currentTarget: backdropEl
    } as unknown as MouseEvent;

    component.onBackdropClick(mockEvent);
    expect(closed).toBe(true);
  });
});
