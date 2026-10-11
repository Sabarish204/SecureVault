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
  FeedbackAttachment,
  FeedbackCategory,
  FeedbackDeviceInfo,
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

          <!-- Attach Screenshots Section (Max 3) -->
          <div class="form-group">
            <div class="label-row">
              <label class="form-label">
                Attach Pictures / Screenshots <span class="optional-label">(Max 3)</span>
              </label>
              <span class="char-count">{{ attachments.length }}/3</span>
            </div>

            <!-- Uploaded Thumbnails Preview Grid -->
            <div *ngIf="attachments.length > 0" class="attachments-grid">
              <div *ngFor="let att of attachments; let i = index" class="attachment-preview-card animate-fade-in">
                <img [src]="att.dataUrl" [alt]="att.name" class="preview-thumbnail" />
                <button
                  type="button"
                  class="btn-remove-attachment"
                  (click)="removeAttachment(i)"
                  title="Remove picture"
                  aria-label="Remove picture"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
                <span class="attachment-name" [title]="att.name">{{ att.name }}</span>
              </div>
            </div>

            <!-- Add Picture Button (available if < 3 pictures) -->
            <div *ngIf="attachments.length < 3" class="upload-trigger-container">
              <input
                #fileInput
                type="file"
                accept="image/*"
                multiple
                class="hidden-file-input"
                (change)="onFilesSelected($event)"
              />
              <button
                type="button"
                class="btn-attach-image"
                (click)="fileInput.click()"
                [disabled]="isCompressingImages() || isSubmitting()"
              >
                <span class="material-symbols-outlined attach-icon" [class.animate-spin]="isCompressingImages()">
                  {{ isCompressingImages() ? 'sync' : 'add_photo_alternate' }}
                </span>
                <span *ngIf="!isCompressingImages()">Add Screenshot / Picture ({{ 3 - attachments.length }} left)</span>
                <span *ngIf="isCompressingImages()">Optimizing image...</span>
              </button>
            </div>
          </div>

          <!-- Diagnostics Info (Smartphone Model & Android/OS Version) -->
          <div class="diagnostics-toggle">
            <div class="diagnostics-card">
              <span class="material-symbols-outlined diag-icon">smartphone</span>
              <div class="diagnostics-info-text">
                <span class="diag-title">Device Diagnostics Attached</span>
                <span class="diag-desc">
                  <strong>{{ diagnosticInfo().deviceModel }}</strong> ({{ diagnosticInfo().osVersion }}) • {{ diagnosticInfo().appVersion }}
                </span>
              </div>
            </div>
          </div>

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
      padding: 2px 0;
    }

    .diagnostics-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: var(--radius-sm);
    }

    .diag-icon {
      font-size: 24px;
      color: var(--primary);
      flex-shrink: 0;
    }

    .diagnostics-info-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .diag-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-secondary);
      letter-spacing: 0.02em;
    }

    .diag-desc {
      font-size: 0.74rem;
      color: var(--text-muted);
      line-height: 1.35;
      word-break: break-word;
    }

    .diag-desc strong {
      color: var(--text-primary);
    }

    .optional-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 400;
      margin-left: 4px;
    }

    .attachments-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .attachment-preview-card {
      position: relative;
      width: 76px;
      height: 76px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid rgba(56, 189, 248, 0.3);
      background: rgba(15, 23, 42, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .btn-remove-attachment {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.75);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: background 0.15s ease;
    }

    .btn-remove-attachment:hover {
      background: #ef4444;
      color: #ffffff;
    }

    .btn-remove-attachment .material-symbols-outlined {
      font-size: 13px;
    }

    .attachment-name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.75);
      font-size: 0.58rem;
      color: var(--text-secondary);
      padding: 2px 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    .hidden-file-input {
      display: none;
    }

    .btn-attach-image {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed rgba(255, 255, 255, 0.18);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-attach-image:hover:not(:disabled) {
      background: rgba(56, 189, 248, 0.08);
      border-color: var(--primary);
      color: var(--text-primary);
    }

    .btn-attach-image:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .attach-icon {
      font-size: 19px;
      color: var(--primary);
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
  attachments: FeedbackAttachment[] = [];

  readonly isSubmitting = signal<boolean>(false);
  readonly isCheckingNetwork = signal<boolean>(false);
  readonly isCompressingImages = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  readonly diagnosticInfo = signal<FeedbackDeviceInfo>(this.feedbackService.getDeviceDiagnosticInfoSync());

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const availableSlots = 3 - this.attachments.length;
    if (availableSlots <= 0) return;

    const filesToProcess = Array.from(input.files).slice(0, availableSlots);
    this.isCompressingImages.set(true);

    try {
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await this.compressImage(file);
        this.attachments.push(compressed);
      }
    } catch (err) {
      console.warn('Image processing failed:', err);
    } finally {
      this.isCompressingImages.set(false);
      input.value = '';
    }
  }

  removeAttachment(index: number): void {
    if (index >= 0 && index < this.attachments.length) {
      this.attachments.splice(index, 1);
    }
  }

  /**
   * Compresses image using HTML5 Canvas to max 1280px dimension & 0.82 JPEG quality.
   * Reduces multi-megabyte photos to lightweight ~200KB-350KB payloads.
   */
  private compressImage(file: File): Promise<FeedbackAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              name: file.name,
              type: file.type || 'image/jpeg',
              size: file.size,
              dataUrl: e.target?.result as string
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({
            name: file.name,
            type: 'image/jpeg',
            size: Math.round((dataUrl.length * 3) / 4),
            dataUrl
          });
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

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
    // Asynchronously resolve precise native smartphone model and Android version
    this.feedbackService.getDeviceDiagnosticInfo().then(info => {
      this.diagnosticInfo.set(info);
    }).catch(() => {});
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

    // Ensure we have latest native device diagnostic info with full smartphone model
    let info = this.diagnosticInfo();
    try {
      info = await this.feedbackService.getDeviceDiagnosticInfo();
      this.diagnosticInfo.set(info);
    } catch {
      // Keep existing diagnostic info
    }

    const payload: FeedbackPayload = {
      category: this.selectedCategory,
      title: this.title.trim(),
      description: this.description.trim(),
      includeDeviceInfo: true,
      deviceInfo: info,
      attachments: [...this.attachments]
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
