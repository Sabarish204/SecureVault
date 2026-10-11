import { ChangeDetectionStrategy, Component, Input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MaskCardPipe } from '../../pipes/mask-card.pipe';
import { MaskCvvPipe } from '../../pipes/mask-cvv.pipe';
import { ClipboardSafetyService } from '../../../core/services/clipboard-safety.service';
import { CardDetectorService, CardNetworkMeta } from '../../../core/services/card-detector.service';
import { CardThemeService, CardTheme } from '../../../core/services/card-theme.service';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MaskCardPipe, MaskCvvPipe],
  template: `
    <div
      class="card-mockup"
      [style.background]="mockupBackground"
      [style.box-shadow]="mockupShadow"
    >
      <!-- Background Vector Artwork Overlay -->
      <div class="card-art-overlay" *ngIf="sanitizedArtOverlay" [innerHTML]="sanitizedArtOverlay"></div>
      <div class="card-ambient-overlay"></div>
      
      <!-- Top Row: Type, Chip, Co-Brand & Network -->
      <div class="card-top">
        <div class="chip-container">
          <div class="emv-chip" [class.silver]="theme.chipColor === 'silver'"></div>
          <span class="material-symbols-outlined contactless-icon">contactless</span>
        </div>
        <div class="card-badges-row">
          <div class="card-cobrand-wrap" *ngIf="sanitizedCoBrand" [innerHTML]="sanitizedCoBrand"></div>
          <div class="card-type-badge" [style.background]="theme.cardTypeBadgeBg || 'rgba(255, 255, 255, 0.15)'">
            {{ category === 'DEBIT_CARD' ? 'DEBIT' : 'CREDIT' }}
          </div>
          <div class="card-network-badge" *ngIf="detectedNetwork">
            {{ detectedNetwork.name }}
          </div>
        </div>
      </div>

      <!-- Card Nickname / Bank Name -->
      <div class="card-bank-info">
        <div class="card-bank-text-wrap">
          <span class="card-bank-name" *ngIf="bankName || theme.bankName">{{ bankName || theme.bankName }}</span>
          <span class="card-nickname">{{ nickname || theme.productName }}</span>
        </div>
      </div>

      <!-- Card Number with Mask & Actions -->
      <div class="card-number-row">
        <span class="card-number font-mono">
          {{ cardNumber | maskCard: isNumberRevealed() }}
        </span>
        <div class="card-mini-actions">
          <button
            type="button"
            class="mini-btn"
            (click)="toggleNumberReveal()"
            [title]="isNumberRevealed() ? 'Hide number' : 'Reveal number'"
            [attr.aria-label]="isNumberRevealed() ? 'Hide card number' : 'Reveal card number'"
          >
            <span class="material-symbols-outlined">
              {{ isNumberRevealed() ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
          <button
            type="button"
            class="mini-btn"
            (click)="copyCardNumber()"
            title="Copy card number"
            aria-label="Copy card number"
          >
            <span class="material-symbols-outlined">content_copy</span>
          </button>
        </div>
      </div>

      <!-- Bottom Row: Cardholder, Expiry, CVV -->
      <div class="card-bottom">
        <div class="card-holder-col">
          <span class="col-label">CARDHOLDER</span>
          <span class="col-value">{{ cardholderName || 'CARDHOLDER NAME' }}</span>
        </div>

        <div class="card-expiry-col">
          <span class="col-label">EXPIRES</span>
          <span class="col-value font-mono">{{ expiryMonth || 'MM' }}/{{ expiryYear ? expiryYear.slice(-2) : 'YY' }}</span>
        </div>

        <div class="card-cvv-col" *ngIf="cvv">
          <span class="col-label">CVV</span>
          <div class="cvv-flex">
            <span class="col-value font-mono">{{ cvv | maskCvv: isCvvRevealed() }}</span>
            <button
              type="button"
              class="cvv-toggle-btn"
              (click)="toggleCvvReveal()"
              [title]="isCvvRevealed() ? 'Hide CVV' : 'Reveal CVV'"
              [attr.aria-label]="isCvvRevealed() ? 'Hide CVV' : 'Reveal CVV'"
            >
              <span class="material-symbols-outlined icon-small">
                {{ isCvvRevealed() ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-mockup {
      position: relative;
      width: 100%;
      max-width: 420px;
      margin: 0 auto 20px auto;
      height: auto;
      min-height: 220px;
      border-radius: 18px;
      padding: 20px 24px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
      color: #ffffff;
      overflow: hidden;
      box-sizing: border-box;
      transition: background 0.3s ease, box-shadow 0.3s ease;
      z-index: 1;
    }

    .card-art-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }

    .card-ambient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.12) 0%, transparent 60%);
      pointer-events: none;
      z-index: 1;
    }

    .card-top, .card-bank-info, .card-number-row, .card-bottom {
      position: relative;
      z-index: 2;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chip-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .emv-chip {
      width: 38px;
      height: 28px;
      border-radius: 5px;
      background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
      border: 1px solid #b45309;
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .emv-chip.silver {
      background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
      border: 1px solid #64748b;
    }

    .emv-chip::after {
      content: '';
      position: absolute;
      top: 30%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(0, 0, 0, 0.3);
    }

    .contactless-icon {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.7);
    }

    .card-badges-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-cobrand-wrap {
      display: flex;
      align-items: center;
    }

    .card-type-badge {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .card-network-badge {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .card-bank-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0;
    }

    .card-bank-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .card-bank-name {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.75);
    }

    .card-nickname {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.25;
    }

    .card-number-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-number {
      font-size: clamp(0.92rem, 3.8vw, 1.15rem);
      font-weight: 600;
      letter-spacing: clamp(0.04em, 1.2vw, 0.12em);
      color: #ffffff;
      white-space: nowrap;
    }

    .card-mini-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .mini-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.75);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .mini-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
    }

    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      padding-top: 2px;
    }

    .card-holder-col {
      flex: 1;
      min-width: 0;
      margin-right: 8px;
    }

    .card-expiry-col, .card-cvv-col {
      flex-shrink: 0;
    }

    .card-holder-col, .card-expiry-col, .card-cvv-col {
      display: flex;
      flex-direction: column;
    }

    .col-label {
      font-size: 0.62rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.08em;
      margin-bottom: 2px;
      text-transform: uppercase;
    }

    .col-value {
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      word-break: break-word;
      line-height: 1.3;
    }

    .cvv-flex {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .cvv-toggle-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0;
      display: inline-flex;
    }

    .icon-small {
      font-size: 16px;
    }

    @media (max-width: 400px) {
      .card-mockup {
        padding: 16px 16px;
        min-height: 200px;
        gap: 12px;
      }
      .card-number {
        font-size: clamp(0.82rem, 3.5vw, 0.98rem);
        letter-spacing: clamp(0.02em, 0.8vw, 0.08em);
      }
      .card-badges-row {
        gap: 4px;
      }
      .card-type-badge, .card-network-badge {
        padding: 3px 6px;
        font-size: 0.68rem;
      }
    }
  `]
})
export class CardPreviewComponent {
  @Input({ required: true }) cardNumber!: string;
  @Input({ required: true }) cardholderName!: string;
  @Input({ required: true }) expiryMonth!: string;
  @Input({ required: true }) expiryYear!: string;
  @Input() cvv?: string;
  @Input() nickname?: string;
  @Input() bankName?: string;
  @Input() category: 'CREDIT_CARD' | 'DEBIT_CARD' = 'CREDIT_CARD';
  @Input() customBgImage?: string;

  private readonly clipboard = inject(ClipboardSafetyService);
  private readonly cardDetector = inject(CardDetectorService);
  private readonly cardThemeService = inject(CardThemeService);
  private readonly sanitizer = inject(DomSanitizer);

  get detectedNetwork(): CardNetworkMeta | null {
    return this.cardDetector.detectCard(this.cardNumber);
  }

  get theme(): CardTheme {
    return this.cardThemeService.resolveTheme(
      this.cardNumber,
      this.bankName,
      this.nickname,
      this.category
    );
  }

  get sanitizedArtOverlay(): SafeHtml | null {
    const svg = this.theme.artOverlaySvg;
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : null;
  }

  get sanitizedCoBrand(): SafeHtml | null {
    const svg = this.theme.coBrandLogoSvg;
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : null;
  }

  get mockupBackground(): string {
    if (this.customBgImage) {
      return `url('${this.customBgImage}') center/cover no-repeat, ${this.theme.background}`;
    }
    return this.theme.background;
  }

  get mockupShadow(): string {
    return `0 20px 35px -10px rgba(0, 0, 0, 0.8), 0 0 25px ${this.theme.accentGlow}`;
  }

  readonly isNumberRevealed = signal<boolean>(false);
  readonly isCvvRevealed = signal<boolean>(false);

  toggleNumberReveal(): void {
    this.isNumberRevealed.set(!this.isNumberRevealed());
  }

  toggleCvvReveal(): void {
    this.isCvvRevealed.set(!this.isCvvRevealed());
  }

  async copyCardNumber(): Promise<void> {
    await this.clipboard.copySecret(this.cardNumber.replace(/\s+/g, ''), 'Card Number');
  }
}
