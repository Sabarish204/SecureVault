import { Component, Input, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MaskSecretPipe } from '../../pipes/mask-secret.pipe';
import { ClipboardSafetyService } from '../../../core/services/clipboard-safety.service';

@Component({
  selector: 'app-secret-field',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MaskSecretPipe],
  template: `
    <div class="secret-field-container">
      <div class="field-header">
        <label class="field-label">{{ label }}</label>
        <span class="security-tag" [class.revealed]="isRevealed()">
          {{ isRevealed() ? 'REVEALED (Auto-hiding)' : 'MASKED' }}
        </span>
      </div>

      <div class="field-input-box">
        <span class="value-display font-mono" [class.masked]="!isRevealed()">
          {{ value | maskSecret: isRevealed() }}
        </span>

        <div class="field-actions">
          <!-- Toggle Reveal Button -->
          <button
            type="button"
            mat-icon-button
            class="action-btn"
            (click)="toggleReveal()"
            [attr.aria-label]="isRevealed() ? 'Hide ' + label : 'Reveal ' + label"
            [title]="isRevealed() ? 'Hide' : 'Reveal'"
          >
            <span class="material-symbols-outlined">
              {{ isRevealed() ? 'visibility_off' : 'visibility' }}
            </span>
          </button>

          <!-- Safe Copy Button -->
          <button
            type="button"
            mat-icon-button
            class="action-btn copy-btn"
            (click)="copySecret()"
            [attr.aria-label]="'Copy ' + label"
            title="Copy securely"
          >
            <span class="material-symbols-outlined">content_copy</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .secret-field-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .security-tag {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(100, 116, 139, 0.2);
      color: var(--text-muted);
      letter-spacing: 0.04em;
      transition: all 0.2s ease;
    }

    .security-tag.revealed {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
    }

    .field-input-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 6px 8px 6px 14px;
      min-height: 48px;
      transition: border-color 0.2s ease;
    }

    .field-input-box:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }

    .value-display {
      font-size: 0.95rem;
      color: var(--text-primary);
      word-break: break-all;
      user-select: text;
    }

    .value-display.masked {
      letter-spacing: 0.2em;
      color: var(--text-muted);
      user-select: none;
    }

    .field-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }

    .action-btn {
      color: var(--text-secondary);
      width: 38px;
      height: 38px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      color: var(--primary);
      background: rgba(56, 189, 248, 0.1);
    }

    .copy-btn:hover {
      color: var(--success);
      background: var(--success-bg);
    }
  `]
})
export class SecretFieldComponent implements OnDestroy {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() autoHideSeconds: number = 15;

  private readonly clipboard = inject(ClipboardSafetyService);
  readonly isRevealed = signal<boolean>(false);
  private autoHideTimer: any = null;

  toggleReveal(): void {
    const nextState = !this.isRevealed();
    this.isRevealed.set(nextState);

    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }

    if (nextState && this.autoHideSeconds > 0) {
      this.autoHideTimer = setTimeout(() => {
        this.isRevealed.set(false);
      }, this.autoHideSeconds * 1000);
    }
  }

  async copySecret(): Promise<void> {
    await this.clipboard.copySecret(this.value, this.label);
  }

  ngOnDestroy(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }
  }
}
