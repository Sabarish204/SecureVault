import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardOcrService, CardScanResult } from '../../../core/services/card-ocr.service';

export interface CardScanAutoFillData {
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardBrand?: string;
}

@Component({
  selector: 'app-card-scanner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scanner-backdrop animate-fade-in" (click)="onBackdropClick($event)">
      <div class="scanner-card glass-panel" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="scanner-header">
          <div class="scanner-title-group">
            <span class="material-symbols-outlined header-icon">document_scanner</span>
            <div>
              <h2 class="scanner-title">Physical Card Scanner</h2>
              <p class="scanner-subtitle">100% on-device local OCR • Zero cloud uploads</p>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="onClose()" aria-label="Close scanner">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Step Tabs: Front Side vs Back Side -->
        <div class="step-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'FRONT'"
            (click)="switchTab('FRONT')"
          >
            <span class="material-symbols-outlined">credit_card</span>
            <span>1. Front Side</span>
            <span class="tab-check-badge" *ngIf="extractedCardNumber">✓</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'BACK'"
            (click)="switchTab('BACK')"
          >
            <span class="material-symbols-outlined">lock</span>
            <span>2. Back Side (CVV)</span>
            <span class="tab-check-badge" *ngIf="extractedCvv">✓</span>
          </button>
        </div>

        <!-- Viewfinder / Camera Section -->
        <div class="viewfinder-container">
          <!-- Video Stream or Photo Preview -->
          <video
            #videoElement
            class="camera-stream"
            [class.hidden]="!isCameraActive() || capturedImagePreview()"
            playsinline
            muted
          ></video>

          <img
            *ngIf="capturedImagePreview()"
            [src]="capturedImagePreview()"
            class="captured-preview-img"
            alt="Captured Card"
          />

          <!-- Card Overlay Guide Frame -->
          <div class="card-guide-frame" [class.scanning]="isProcessing()">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>

            <!-- Laser Scanning Beam Animation -->
            <div class="scanner-laser" *ngIf="isProcessing()"></div>

            <div class="guide-label" *ngIf="!isProcessing()">
              {{ activeTab() === 'FRONT' ? 'Position FRONT of card here' : 'Position BACK (CVV strip) here' }}
            </div>
          </div>

          <!-- Camera Inactive / Permission Required Fallback Overlay -->
          <div class="camera-fallback-overlay" *ngIf="!isCameraActive() && !capturedImagePreview()">
            <span class="material-symbols-outlined fallback-icon">photo_camera</span>
            <p class="fallback-title">Camera Preview Inactive</p>
            <p class="fallback-subtitle">Use live camera or upload photo from device</p>
            <button type="button" class="btn-start-camera" (click)="startCamera()">
              <span class="material-symbols-outlined">videocam</span>
              <span>Start Camera</span>
            </button>
          </div>
        </div>

        <!-- Processing State Indicator -->
        <div class="processing-bar" *ngIf="isProcessing()">
          <div class="processing-spinner"></div>
          <span class="processing-text">Reading {{ activeTab() === 'FRONT' ? 'Card Number & Expiry' : 'CVV' }} with on-device OCR...</span>
        </div>

        <!-- Error Banner -->
        <div class="scan-error-banner" *ngIf="errorMessage()">
          <span class="material-symbols-outlined">error</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Capture / Action Controls -->
        <div class="capture-controls">
          <button
            *ngIf="isCameraActive() && !capturedImagePreview()"
            type="button"
            class="btn-shutter"
            (click)="captureSnapshot()"
            [disabled]="isProcessing()"
          >
            <div class="shutter-inner">
              <span class="material-symbols-outlined">camera</span>
            </div>
            <span>Capture {{ activeTab() === 'FRONT' ? 'Front' : 'Back' }}</span>
          </button>

          <label class="btn-upload-file">
            <span class="material-symbols-outlined">upload_file</span>
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              (change)="onFileSelected($event)"
              style="display: none;"
            />
          </label>

          <button
            *ngIf="capturedImagePreview()"
            type="button"
            class="btn-retake"
            (click)="retakePhoto()"
            [disabled]="isProcessing()"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Retake</span>
          </button>
        </div>

        <!-- Extracted Data Review Sheet -->
        <div class="review-sheet">
          <div class="review-sheet-header">
            <span class="material-symbols-outlined">fact_check</span>
            <span>Detected Details (Review & Edit)</span>
          </div>

          <div class="detected-fields-grid">
            <!-- Card Number -->
            <div class="field-box" [class.highlight]="extractedCardNumber">
              <label class="field-box-label">Card Number</label>
              <input
                type="text"
                class="field-box-input font-mono"
                [(ngModel)]="extractedCardNumber"
                placeholder="Not detected yet"
              />
            </div>

            <!-- Cardholder Name -->
            <div class="field-box" [class.highlight]="extractedCardholderName">
              <label class="field-box-label">Cardholder Name</label>
              <input
                type="text"
                class="field-box-input"
                [(ngModel)]="extractedCardholderName"
                placeholder="e.g. JOHN DOE"
              />
            </div>

            <!-- Expiry Date (MM/YY) -->
            <div class="field-box-dual">
              <div class="field-box flex-1" [class.highlight]="extractedExpiryMonth">
                <label class="field-box-label">Expiry Month</label>
                <input
                  type="text"
                  maxlength="2"
                  class="field-box-input font-mono"
                  [(ngModel)]="extractedExpiryMonth"
                  placeholder="MM"
                />
              </div>

              <div class="field-box flex-1" [class.highlight]="extractedExpiryYear">
                <label class="field-box-label">Expiry Year</label>
                <input
                  type="text"
                  maxlength="4"
                  class="field-box-input font-mono"
                  [(ngModel)]="extractedExpiryYear"
                  placeholder="YY"
                />
              </div>
            </div>

            <!-- CVV -->
            <div class="field-box" [class.highlight]="extractedCvv">
              <label class="field-box-label">CVV / CVC (Back Side)</label>
              <input
                type="password"
                maxlength="4"
                class="field-box-input font-mono"
                [(ngModel)]="extractedCvv"
                placeholder="CVV"
              />
            </div>
          </div>
        </div>

        <!-- Final Modal Actions -->
        <div class="scanner-modal-footer">
          <button type="button" class="btn-cancel" (click)="onClose()">
            Cancel
          </button>

          <button
            type="button"
            class="btn-apply-fill"
            (click)="applyAndAutoFill()"
            [disabled]="!canAutoFill()"
          >
            <span class="material-symbols-outlined">auto_fix_high</span>
            <span>Auto-Fill Card Details</span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .scanner-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    }

    .scanner-card {
      width: 100%;
      max-width: 540px;
      background: rgba(13, 19, 33, 0.98);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.2);
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
    }

    .scanner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
    }

    .scanner-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 28px;
      color: var(--primary);
      background: rgba(56, 189, 248, 0.15);
      padding: 8px;
      border-radius: 10px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .scanner-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .scanner-subtitle {
      font-size: 0.72rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-close:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.1);
    }

    /* Tabs */
    .step-tabs {
      display: flex;
      gap: 8px;
      background: rgba(15, 23, 42, 0.7);
      padding: 4px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn.active {
      background: rgba(56, 189, 248, 0.2);
      color: var(--primary);
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
    }

    .tab-check-badge {
      background: #22c55e;
      color: #0f172a;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 900;
    }

    /* Viewfinder Camera Area */
    .viewfinder-container {
      position: relative;
      width: 100%;
      height: 230px;
      background: #030712;
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .camera-stream {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .camera-stream.hidden {
      display: none;
    }

    .captured-preview-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    /* Bounding Box Frame */
    .card-guide-frame {
      position: absolute;
      width: 82%;
      height: 72%;
      border: 1.5px dashed rgba(56, 189, 248, 0.5);
      border-radius: 12px;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
    }

    .card-guide-frame.scanning {
      border-color: #38bdf8;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 20px rgba(56, 189, 248, 0.4);
    }

    .corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: #38bdf8;
      border-style: solid;
    }

    .corner.top-left {
      top: -2px;
      left: -2px;
      border-width: 3px 0 0 3px;
      border-top-left-radius: 8px;
    }

    .corner.top-right {
      top: -2px;
      right: -2px;
      border-width: 3px 3px 0 0;
      border-top-right-radius: 8px;
    }

    .corner.bottom-left {
      bottom: -2px;
      left: -2px;
      border-width: 0 0 3px 3px;
      border-bottom-left-radius: 8px;
    }

    .corner.bottom-right {
      bottom: -2px;
      right: -2px;
      border-width: 0 3px 3px 0;
      border-bottom-right-radius: 8px;
    }

    .guide-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      background: rgba(0, 0, 0, 0.65);
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.04em;
    }

    /* Laser Scanning Animation */
    .scanner-laser {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, #38bdf8, transparent);
      box-shadow: 0 0 14px #38bdf8;
      animation: laserScan 1.6s ease-in-out infinite alternate;
    }

    @keyframes laserScan {
      0% { top: 5%; }
      100% { top: 92%; }
    }

    /* Camera Fallback */
    .camera-fallback-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-align: center;
      padding: 16px;
    }

    .fallback-icon {
      font-size: 40px;
      color: var(--text-muted);
    }

    .fallback-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .fallback-subtitle {
      font-size: 0.76rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .btn-start-camera {
      margin-top: 8px;
      background: rgba(56, 189, 248, 0.2);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: var(--radius-sm);
      padding: 8px 16px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* Processing Bar */
    .processing-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
    }

    .processing-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(56, 189, 248, 0.3);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .processing-text {
      font-size: 0.8rem;
      color: #38bdf8;
      font-weight: 600;
    }

    .scan-error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-sm);
      color: #fca5a5;
      font-size: 0.78rem;
    }

    /* Controls */
    .capture-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .btn-shutter {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      color: #0f172a;
      border: none;
      border-radius: 9999px;
      padding: 10px 22px;
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(56, 189, 248, 0.4);
      transition: all 0.2s ease;
    }

    .btn-shutter:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 22px rgba(56, 189, 248, 0.6);
    }

    .shutter-inner {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-upload-file, .btn-retake {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 9px 14px;
      color: var(--text-primary);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-upload-file:hover, .btn-retake:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Review Sheet */
    .review-sheet {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .review-sheet-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detected-fields-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    @media (min-width: 500px) {
      .detected-fields-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .field-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      transition: border-color 0.2s ease;
    }

    .field-box.highlight {
      border-color: rgba(56, 189, 248, 0.5);
      background: rgba(56, 189, 248, 0.06);
    }

    .field-box-dual {
      display: flex;
      gap: 8px;
    }

    .field-box-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .field-box-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.86rem;
      font-weight: 600;
      outline: none;
      width: 100%;
    }

    .field-box-input::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
      font-weight: 400;
    }

    /* Modal Footer */
    .scanner-modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 16px;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-apply-fill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      color: #0f172a;
      border: none;
      border-radius: var(--radius-sm);
      padding: 10px 20px;
      font-size: 0.88rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(56, 189, 248, 0.4);
      transition: all 0.2s ease;
    }

    .btn-apply-fill:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 22px rgba(56, 189, 248, 0.6);
    }

    .btn-apply-fill:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `]
})
export class CardScannerModalComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @Output() cardScanned = new EventEmitter<CardScanAutoFillData>();
  @Output() close = new EventEmitter<void>();

  private readonly cardOcr = inject(CardOcrService);

  readonly activeTab = signal<'FRONT' | 'BACK'>('FRONT');
  readonly isCameraActive = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly capturedImagePreview = signal<string | null>(null);

  // Extracted values
  extractedCardNumber = '';
  extractedCardholderName = '';
  extractedExpiryMonth = '';
  extractedExpiryYear = '';
  extractedCvv = '';
  extractedBrand = '';

  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    // Attempt camera start automatically
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  switchTab(tab: 'FRONT' | 'BACK'): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    // Reset captured preview to show live camera for the new side
    this.capturedImagePreview.set(null);
    if (!this.isCameraActive()) {
      this.startCamera();
    }
  }

  async startCamera(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    this.stopCamera();
    this.errorMessage.set('');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      this.isCameraActive.set(true);

      setTimeout(() => {
        if (this.videoElement?.nativeElement && this.mediaStream) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
          this.videoElement.nativeElement.play().catch(() => {});
        }
      }, 50);
    } catch {
      this.isCameraActive.set(false);
      // Fallback cleanly to file upload if camera permission denied
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive.set(false);
  }

  captureSnapshot(): void {
    if (!this.videoElement?.nativeElement) return;
    const video = this.videoElement.nativeElement;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.capturedImagePreview.set(dataUrl);

    // Process snapshot with OCR
    this.processImageForOcr(canvas);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        this.capturedImagePreview.set(img.src);
        this.processImageForOcr(img);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  retakePhoto(): void {
    this.capturedImagePreview.set(null);
    this.errorMessage.set('');
    if (!this.isCameraActive()) {
      this.startCamera();
    }
  }

  async processImageForOcr(source: HTMLImageElement | HTMLCanvasElement): Promise<void> {
    this.isProcessing.set(true);
    this.errorMessage.set('');

    try {
      if (this.activeTab() === 'FRONT') {
        const result = await this.cardOcr.scanFrontSide(source);
        if (result.cardNumber) {
          this.extractedCardNumber = result.formattedCardNumber || result.cardNumber;
          this.extractedBrand = result.cardBrand || '';
        }
        if (result.expiryMonth) {
          this.extractedExpiryMonth = result.expiryMonth;
        }
        if (result.expiryYear) {
          this.extractedExpiryYear = result.expiryYear;
        }
        if (result.cardholderName) {
          this.extractedCardholderName = result.cardholderName;
        }

        if (!result.cardNumber && !result.expiryMonth && !result.cardholderName) {
          this.errorMessage.set(
            'Could not clearly detect card numbers. Please align card inside the frame with good lighting or enter manually.'
          );
        }
      } else {
        // Back side (CVV)
        const result = await this.cardOcr.scanBackSide(source);
        if (result.cvv) {
          this.extractedCvv = result.cvv;
        } else {
          this.errorMessage.set(
            'Could not clearly detect CVV digits. Please align the signature strip area with good lighting.'
          );
        }
      }
    } catch (err: any) {
      console.warn('OCR processing error:', err);
      this.errorMessage.set('Scan failed. Please try with clearer lighting or enter manually.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  canAutoFill(): boolean {
    return !!(
      this.extractedCardNumber ||
      this.extractedExpiryMonth ||
      this.extractedCardholderName ||
      this.extractedCvv
    );
  }

  applyAndAutoFill(): void {
    this.cardScanned.emit({
      cardNumber: this.extractedCardNumber.replace(/\D/g, ''),
      cardholderName: this.extractedCardholderName.trim(),
      expiryMonth: this.extractedExpiryMonth.trim(),
      expiryYear: this.extractedExpiryYear.trim(),
      cvv: this.extractedCvv.trim(),
      cardBrand: this.extractedBrand
    });
    this.onClose();
  }

  onClose(): void {
    this.stopCamera();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    this.onClose();
  }
}
