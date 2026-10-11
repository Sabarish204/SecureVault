import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../../core/services/feedback.service';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import {
  FeedbackCategory,
  FeedbackPayload,
  FeedbackSubmissionResult
} from '../../models/feedback.model';

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      #modalBackdrop
      class="feedback-modal-backdrop animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedbackModalTitle"
      (click)="onBackdropClick($event)"
    >
      <div
        #modalCard
        class="feedback-modal-card glass-panel-elevated"
        tabindex="-1"
        role="document"
        (click)="$event.stopPropagation()"
      >
        
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="icon-badge">
            <span class="material-symbols-outlined header-icon">rate_review</span>
          </div>
          <div class="title-meta">
            <h2 id="feedbackModalTitle" class="modal-title">Feedback & Suggestions</h2>
            <p class="modal-subtitle">Help us improve SecureVault.</p>
          </div>
          <button
            type="button"
            class="close-btn"
            (click)="close.emit()"
            aria-label="Close dialog"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Offline Warning Banner -->
        <div *ngIf="!network.isOnline()" class="offline-banner animate-fade-in">
          <span class="material-symbols-outlined offline-icon">wifi_off</span>
          <div class="offline-text">
            <span class="offline-title">Device Offline</span>
            <span class="offline-desc">
              No internet connection detected. Please connect to Wi-Fi or mobile data to submit feedback.
            </span>
          </div>
          <button
            type="button"
            class="btn-retry-check"
            (click)="retryConnection()"
            [disabled]="isCheckingNetwork()"
            title="Check connection again"
          >
            <span class="material-symbols-outlined" [class.animate-spin]="isCheckingNetwork()">
              {{ isCheckingNetwork() ? 'sync' : 'refresh' }}
            </span>
            <span>Check</span>
          </button>
        </div>

        <!-- Submission Error Alert -->
        <div *ngIf="errorMessage()" class="error-banner animate-fade-in">
          <span class="material-symbols-outlined">error</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Form Body -->
        <form class="feedback-form" (ngSubmit)="onSubmit()">
          
          <!-- Category Chips -->
          <div class="form-group">
            <label class="form-label">Category</label>
            <div class="category-chips">
              <button
                type="button"
                *ngFor="let cat of feedbackService.categories"
                class="category-chip"
                [class.active]="selectedCategory === cat.value"
                (click)="selectedCategory = cat.value"
              >
                <span class="material-symbols-outlined chip-icon">{{ cat.icon }}</span>
                <span>{{ cat.label }}</span>
              </button>
            </div>
          </div>

          <!-- Subject / Title -->
          <div class="form-group">
            <label class="form-label" for="feedbackTitle">
              Title / Summary <span class="required">*</span>
            </label>
            <input
              #titleInput
              id="feedbackTitle"
              type="text"
              class="form-input"
              [(ngModel)]="title"
              name="feedbackTitle"
              placeholder="e.g., Add fingerprint timeout or export to Google Drive"
              maxlength="100"
              required
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <div class="label-row">
              <label class="form-label" for="feedbackDesc">
                Details & Suggestions <span class="required">*</span>
              </label>
              <span class="char-count">{{ description.length }}/1000</span>
            </div>
            <textarea
              id="feedbackDesc"
              class="form-textarea"
              [(ngModel)]="description"
              name="feedbackDesc"
              rows="4"
              placeholder="Explain the feature you would like to see, or details about the issue..."
              maxlength="1000"
              required
            ></textarea>
          </div>

          <!-- Diagnostics Info (Always Attached & Required) -->
          <!-- <div class="diagnostics-toggle">
            <label class="checkbox-container disabled-checkbox">
              <input
                type="checkbox"
                [checked]="true"
                disabled
                name="includeDeviceInfo"
              />
              <span class="checkmark"></span>
              <div class="diagnostics-info-text">
                <span class="diag-title">Device diagnostics attached (Required)</span>
                <span class="diag-desc">
                  App version ({{ diagnosticInfo.appVersion }}) and platform ({{ diagnosticInfo.platform }})
                </span>
              </div>
            </label>
          </div> -->

          <!-- Actions -->
          <div class="modal-actions">
            <button
              type="submit"
              class="btn-primary flex-1"
              [disabled]="isSubmitting() || !network.isOnline() || !title.trim() || !description.trim()"
            >
              <span class="material-symbols-outlined" [class.animate-spin]="isSubmitting()">
                {{ isSubmitting() ? 'sync' : 'send' }}
              </span>
              <span>{{ isSubmitting() ? 'Submitting...' : 'Submit Feedback' }}</span>
            </button>

            <button
              type="button"
              class="btn-secondary"
              (click)="close.emit()"
              [disabled]="isSubmitting()"
            >
              <span>Cancel</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  `,
  styles: [`
    .feedback-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100%;
      height: 100dvh;
      background: rgba(4, 7, 13, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: max(16px, env(safe-area-inset-top, 16px)) 16px max(24px, env(safe-area-inset-bottom, 24px)) 16px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      z-index: 9999;
    }

    .feedback-modal-card {
      width: 100%;
      max-width: 520px;
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid rgba(56, 189, 248, 0.35);
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.12), 0 20px 40px rgba(0, 0, 0, 0.7);
      outline: none;
      margin-top: 0;
    }

    @media (min-width: 641px) {
      .feedback-modal-backdrop {
        align-items: center;
        padding: 24px 16px;
      }
      .feedback-modal-card {
        max-height: 90vh;
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-icon {
      color: var(--primary);
      font-size: 24px;
    }

    .title-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .offline-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: rgba(251, 191, 36, 0.12);
      border: 1px solid rgba(251, 191, 36, 0.4);
    }

    .offline-icon {
      color: var(--warning);
      font-size: 22px;
      flex-shrink: 0;
    }

    .offline-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .offline-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #fde68a;
    }

    .offline-desc {
      font-size: 0.74rem;
      color: var(--text-secondary);
      line-height: 1.35;
    }

    .btn-retry-check {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.74rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .btn-retry-check:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      color: var(--text-primary);
    }

    .btn-retry-check .material-symbols-outlined {
      font-size: 14px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      font-size: 0.8rem;
    }

    .feedback-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .required {
      color: var(--danger);
    }

    .char-count {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .category-chips {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    @media (max-width: 480px) {
      .category-chips {
        grid-template-columns: 1fr;
      }
    }

    .category-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .category-chip:hover {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .category-chip.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 700;
    }

    .chip-icon {
      font-size: 18px;
    }

    .form-input {
      width: 100%;
      height: 42px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0 12px;
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      border-color: var(--primary);
      box-shadow: var(--shadow-neon);
    }

    .form-textarea {
      width: 100%;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
      resize: vertical;
      font-family: inherit;
      transition: all 0.2s ease;
      box-sizing: border-box;
      line-height: 1.4;
    }

    .form-textarea:focus {
      border-color: var(--primary);
      box-shadow: var(--shadow-neon);
    }

    .diagnostics-toggle {
      padding: 4px 0;
    }

    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
    }

    .checkbox-container.disabled-checkbox {
      cursor: default;
      opacity: 0.9;
    }

    .checkbox-container input {
      accent-color: var(--primary);
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
    }

    .checkbox-container input:disabled {
      cursor: default;
    }

    .diagnostics-info-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .diag-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .diag-desc {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .modal-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 6px;
    }

    .flex-1 {
      flex: 1;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class FeedbackModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalBackdrop') modalBackdrop?: ElementRef<HTMLDivElement>;
  @ViewChild('modalCard') modalCard?: ElementRef<HTMLDivElement>;
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;

  readonly feedbackService = inject(FeedbackService);
  readonly network = inject(NetworkStatusService);

  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<FeedbackSubmissionResult>();

  selectedCategory: FeedbackCategory = 'FEATURE';
  title: string = '';
  description: string = '';
  includeDeviceInfo: boolean = true;

  readonly isSubmitting = signal<boolean>(false);
  readonly isCheckingNetwork = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  readonly diagnosticInfo = this.feedbackService.getDeviceDiagnosticInfo();

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSubmitting()) {
      this.close.emit();
    }
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  ngAfterViewInit(): void {
    // Focus the popup card and ensure it starts at the top position of the device viewport
    requestAnimationFrame(() => {
      if (this.modalCard?.nativeElement) {
        this.modalCard.nativeElement.scrollTop = 0;
        this.modalCard.nativeElement.focus({ preventScroll: true });
      }
      setTimeout(() => {
        if (this.titleInput?.nativeElement) {
          this.titleInput.nativeElement.focus({ preventScroll: true });
        }
      }, 50);
    });
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  async retryConnection(): Promise<void> {
    this.isCheckingNetwork.set(true);
    try {
      await this.network.checkConnectivity();
    } finally {
      this.isCheckingNetwork.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim() || !this.description.trim()) {
      this.errorMessage.set('Please provide both a title and details.');
      return;
    }

    if (!this.network.isOnline()) {
      this.errorMessage.set('Please connect to the internet to submit feedback.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: FeedbackPayload = {
      category: this.selectedCategory,
      title: this.title.trim(),
      description: this.description.trim(),
      includeDeviceInfo: true,
      deviceInfo: this.diagnosticInfo
    };

    try {
      const result = await this.feedbackService.submitFeedback(payload);
      if (result.success) {
        if (result.openedInBrowser && result.issueUrl) {
          window.open(result.issueUrl, '_blank');
        }
        this.submitted.emit(result);
        this.close.emit();
      } else {
        this.errorMessage.set(result.message || 'Submission failed.');
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'An unexpected error occurred.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
