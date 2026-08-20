import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaskCardPipe } from '../../pipes/mask-card.pipe';
import { MaskCvvPipe } from '../../pipes/mask-cvv.pipe';
import { ClipboardSafetyService } from '../../../core/services/clipboard-safety.service';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  imports: [CommonModule, MaskCardPipe, MaskCvvPipe],
  template: `
    <div class="card-mockup" [class.debit-card]="category === 'DEBIT_CARD'">
      <div class="card-ambient-overlay"></div>
      
      <!-- Top Row: Type & Chip -->
      <div class="card-top">
        <div class="chip-container">
          <div class="emv-chip"></div>
          <span class="material-symbols-outlined contactless-icon">contactless</span>
        </div>
        <div class="card-type-badge">
          {{ category === 'DEBIT_CARD' ? 'DEBIT' : 'CREDIT' }}
        </div>
      </div>

      <!-- Card Nickname / Bank Name -->
      <div class="card-bank-info">
        <span class="card-nickname">{{ nickname || 'Personal Card' }}</span>
        <span class="test-label">TEST DATA</span>
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
      aspect-ratio: 1.586;
      border-radius: 18px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(129, 140, 248, 0.15);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
      overflow: hidden;
      box-sizing: border-box;
    }

    .card-mockup.debit-card {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #0f172a 100%);
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(52, 211, 153, 0.15);
    }

    .card-ambient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 60%);
      pointer-events: none;
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

    .card-type-badge {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
    }

    .card-bank-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: -6px;
    }

    .card-nickname {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: rgba(255, 255, 255, 0.95);
    }

    .test-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.2);
      border: 1px dashed rgba(251, 191, 36, 0.4);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .card-number-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .card-number {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: #ffffff;
    }

    .card-mini-actions {
      display: flex;
      align-items: center;
      gap: 4px;
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
    }

    .col-value {
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
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
        padding: 14px 16px;
      }
      .card-number {
        font-size: 0.98rem;
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
  @Input() category: 'CREDIT_CARD' | 'DEBIT_CARD' = 'CREDIT_CARD';

  private readonly clipboard = inject(ClipboardSafetyService);
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
