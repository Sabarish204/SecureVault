import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VaultStateService } from '../../../core/state/vault-state.service';
import { ClipboardSafetyService } from '../../../core/services/clipboard-safety.service';
import { SecretFieldComponent } from '../../../shared/components/secret-field/secret-field.component';
import { CardPreviewComponent } from '../../../shared/components/card-preview/card-preview.component';
import {
  BankingAccountPayload,
  DecryptedVaultItem,
  PaymentCardPayload
} from '../../../shared/models';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    SecretFieldComponent,
    CardPreviewComponent
  ],
  template: `
    <div class="detail-page-wrapper animate-fade-in" *ngIf="item(); else loadingOrNotFound">
      <!-- Top Navigation Row -->
      <div class="detail-nav-row">
        <a routerLink="/items" class="back-link">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Back to Vault</span>
        </a>

        <div class="detail-actions">
          <a [routerLink]="['/items', item()!.id, 'edit']" class="btn-secondary">
            <span class="material-symbols-outlined">edit</span>
            <span>Edit</span>
          </a>
          <button type="button" class="btn-danger" (click)="onDeleteClick()">
            <span class="material-symbols-outlined">delete</span>
            <span>Delete</span>
          </button>
        </div>
      </div>

       

      <!-- Main Item Container -->
      <div class="detail-card glass-panel-elevated">
        <!-- Item Header -->
        <div class="item-header-block">
          <div class="item-badge" [ngClass]="getCategoryClass(item()!.category)">
            <span class="material-symbols-outlined">{{ getCategoryIcon(item()!.category) }}</span>
            <span>{{ formatCategory(item()!.category) }}</span>
          </div>
          <h1 class="item-title">{{ item()!.title }}</h1>
          <span class="item-timestamp">Last updated: {{ item()!.updatedAt | date:'medium' }}</span>
        </div>

        <!-- BANKING ACCOUNT DETAILS -->
        <div *ngIf="item()!.category === 'BANKING'" class="fields-section">
          <!-- Bank Name & Account Nickname -->
          <div class="info-group">
            <label class="info-label">Bank Name</label>
            <div class="info-value-box">
              <span>{{ getBankingPayload().bankName }}</span>
              <button type="button" class="icon-action-btn" (click)="copyText(getBankingPayload().bankName, 'Bank Name')">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>

          <div class="info-group" *ngIf="getBankingPayload().accountNickname">
            <label class="info-label">Account Nickname</label>
            <div class="info-value-box">
              <span>{{ getBankingPayload().accountNickname }}</span>
            </div>
          </div>

          <!-- Username -->
          <div class="info-group">
            <label class="info-label">Username / Login ID</label>
            <div class="info-value-box font-mono">
              <span>{{ getBankingPayload().username }}</span>
              <button type="button" class="icon-action-btn" (click)="copyText(getBankingPayload().username, 'Username')">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>

          <!-- Password with Mask & Safe Copy -->
          <app-secret-field
            label="Password"
            [value]="getBankingPayload().password"
            [autoHideSeconds]="15"
          ></app-secret-field>

          <!-- Website / Login URL -->
          <div class="info-group" *ngIf="getBankingPayload().loginUrl">
            <label class="info-label">Login URL</label>
            <div class="info-value-box url-box">
              <a [href]="formatUrl(getBankingPayload().loginUrl)" target="_blank" rel="noopener noreferrer" class="url-link">
                <span>{{ getBankingPayload().loginUrl }}</span>
                <span class="material-symbols-outlined open-icon">open_in_new</span>
              </a>
              <button type="button" class="icon-action-btn" (click)="copyText(getBankingPayload().loginUrl!, 'Login URL')">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="info-group" *ngIf="getBankingPayload().notes">
            <label class="info-label">Notes</label>
            <div class="notes-box">
              <p>{{ getBankingPayload().notes }}</p>
            </div>
          </div>
        </div>

        <!-- PAYMENT CARD DETAILS (CREDIT & DEBIT) -->
        <div *ngIf="item()!.category === 'CREDIT_CARD' || item()!.category === 'DEBIT_CARD'" class="fields-section">
          <!-- Visual Realistic Card Mockup -->
          <app-card-preview
            [cardNumber]="getCardPayload().cardNumber"
            [cardholderName]="getCardPayload().cardholderName"
            [expiryMonth]="getCardPayload().expiryMonth"
            [expiryYear]="getCardPayload().expiryYear"
            [cvv]="getCardPayload().cvv"
            [nickname]="getCardPayload().cardNickname"
            [category]="item()!.category === 'DEBIT_CARD' ? 'DEBIT_CARD' : 'CREDIT_CARD'"
          ></app-card-preview>

          <!-- Cardholder Name -->
          <div class="info-group">
            <label class="info-label">Cardholder Name</label>
            <div class="info-value-box">
              <span>{{ getCardPayload().cardholderName }}</span>
              <button type="button" class="icon-action-btn" (click)="copyText(getCardPayload().cardholderName, 'Cardholder Name')">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>

          <!-- Card Number Field with SecretField -->
          <app-secret-field
            label="Card Number"
            [value]="getCardPayload().cardNumber"
            [autoHideSeconds]="20"
          ></app-secret-field>

          <!-- Expiry & CVV Row -->
          <div class="dual-row">
            <div class="info-group">
              <label class="info-label">Expiry Date</label>
              <div class="info-value-box font-mono">
                <span>{{ getCardPayload().expiryMonth }}/{{ getCardPayload().expiryYear }}</span>
              </div>
            </div>

            <div class="info-group">
              <label class="info-label">CVV / Security Code</label>
              <app-secret-field
                label="CVV"
                [value]="getCardPayload().cvv"
                [autoHideSeconds]="15"
              ></app-secret-field>
            </div>
          </div>

          <!-- PIN if present -->
          <div *ngIf="getCardPayload().pin">
            <app-secret-field
              label="Card PIN"
              [value]="getCardPayload().pin!"
              [autoHideSeconds]="10"
            ></app-secret-field>
          </div>

          <!-- Notes -->
          <div class="info-group" *ngIf="getCardPayload().notes">
            <label class="info-label">Notes</label>
            <div class="notes-box">
              <p>{{ getCardPayload().notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading or Not Found Template -->
    <ng-template #loadingOrNotFound>
      <div class="loading-wrapper">
        <mat-spinner diameter="40" color="primary"></mat-spinner>
        <p>Decrypting vault record...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .detail-page-wrapper {
      max-width: 720px;
      margin: 0 auto;
      padding: 20px 16px 80px 16px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .detail-nav-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .back-link:hover {
      color: var(--primary);
    }

    .detail-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-card {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .item-header-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
    }

    .item-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      width: fit-content;
    }

    .item-badge.cat-banking { background: rgba(129, 140, 248, 0.15); color: var(--accent); }
    .item-badge.cat-credit { background: rgba(251, 191, 36, 0.15); color: var(--warning); }
    .item-badge.cat-debit { background: rgba(52, 211, 153, 0.15); color: var(--success); }

    .item-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .item-timestamp {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .fields-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .url-box {
      overflow: hidden;
    }

    .url-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--primary);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .url-link:hover {
      text-decoration: underline;
    }

    .open-icon {
      font-size: 16px;
    }

    .notes-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      font-size: 0.88rem;
      color: var(--text-secondary);
      white-space: pre-wrap;
    }

    .icon-action-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      padding: 4px;
      border-radius: 6px;
    }

    .icon-action-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.1);
    }

    .dual-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 300px;
      color: var(--text-secondary);
    }
  `]
})
export class ItemDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vaultState = inject(VaultStateService);
  private readonly clipboard = inject(ClipboardSafetyService);

  readonly item = signal<DecryptedVaultItem | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadItem(id);
      }
    });
  }

  async loadItem(id: string): Promise<void> {
    try {
      const decrypted = await this.vaultState.getItemDetails(id);
      if (decrypted) {
        this.item.set(decrypted);
      } else {
        this.router.navigate(['/items']);
      }
    } catch {
      this.router.navigate(['/items']);
    }
  }

  getBankingPayload(): BankingAccountPayload {
    return this.item()!.payload as BankingAccountPayload;
  }

  getCardPayload(): PaymentCardPayload {
    return this.item()!.payload as PaymentCardPayload;
  }

  formatUrl(url?: string): string {
    if (!url) return '#';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  }

  async copyText(val: string, label: string): Promise<void> {
    await this.clipboard.copyText(val, label);
  }

  async onDeleteClick(): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete "${this.item()!.title}"?`);
    if (confirmed && this.item()) {
      await this.vaultState.deleteItem(this.item()!.id);
      this.router.navigate(['/items']);
    }
  }

  getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'BANKING': return 'account_balance';
      case 'CREDIT_CARD': return 'credit_card';
      case 'DEBIT_CARD': return 'payments';
      default: return 'key';
    }
  }

  getCategoryClass(cat: string): string {
    switch (cat) {
      case 'BANKING': return 'cat-banking';
      case 'CREDIT_CARD': return 'cat-credit';
      case 'DEBIT_CARD': return 'cat-debit';
      default: return 'cat-other';
    }
  }

  formatCategory(cat: string): string {
    switch (cat) {
      case 'BANKING': return 'Banking';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'DEBIT_CARD': return 'Debit Card';
      default: return 'Other';
    }
  }
}
