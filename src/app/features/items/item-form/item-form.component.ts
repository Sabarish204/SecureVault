import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VaultStateService } from '../../../core/state/vault-state.service';
import { BankDirectoryService, IndianBank } from '../../../core/services/bank-directory.service';
import { ClipboardSafetyService } from '../../../core/services/clipboard-safety.service';
import { CardDetectorService, CardNetworkMeta } from '../../../core/services/card-detector.service';
import { CardPreviewComponent } from '../../../shared/components/card-preview/card-preview.component';
import { CardScannerModalComponent, CardScanAutoFillData } from '../../../shared/components/card-scanner-modal/card-scanner-modal.component';
import { VaultValidators } from '../../../shared/validators/vault.validators';
import {
  BankingAccountPayload,
  DecryptedVaultItem,
  PaymentCardPayload,
  VaultCategory
} from '../../../shared/models';

@Component({
  selector: 'app-item-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CardPreviewComponent,
    CardScannerModalComponent
  ],
  template: `
    <div class="form-page-wrapper animate-fade-in">
      <!-- Nav Row -->
      <div class="form-nav-row">
        <a [routerLink]="isEditMode() ? ['/items', editId()] : ['/items']" class="back-link">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Cancel</span>
        </a>
      </div>
 

      <div class="form-card glass-panel-elevated">
        <div class="form-header">
          <h1 class="form-title">{{ isEditMode() ? 'Edit Credential' : 'Add New Credential' }}</h1>
          <p class="form-desc">Sensitive data will be encrypted locally with AES-256-GCM before saving.</p>
        </div>

        <!-- Category Selector (Only for new items) -->
        <div *ngIf="!isEditMode()" class="category-selector-group">
          <label class="field-label">Category</label>
          <div class="category-pills">
            <button
              type="button"
              class="cat-pill"
              [class.active]="selectedCategory() === 'BANKING'"
              (click)="onCategoryChange('BANKING')"
            >
              <span class="material-symbols-outlined">account_balance</span>
              <span>Banking</span>
            </button>

            <button
              type="button"
              class="cat-pill"
              [class.active]="selectedCategory() === 'CREDIT_CARD'"
              (click)="onCategoryChange('CREDIT_CARD')"
            >
              <span class="material-symbols-outlined">credit_card</span>
              <span>Credit Card</span>
            </button>

            <button
              type="button"
              class="cat-pill"
              [class.active]="selectedCategory() === 'DEBIT_CARD'"
              (click)="onCategoryChange('DEBIT_CARD')"
            >
              <span class="material-symbols-outlined">payments</span>
              <span>Debit Card</span>
            </button>
          </div>
        </div>

        <!-- 1. BANKING FORM -->
        <form *ngIf="selectedCategory() === 'BANKING'" [formGroup]="bankingForm" (ngSubmit)="onSubmitBanking()" class="credential-form">
          
          <!-- Searchable Bank Dropdown Field -->
          <div class="form-field bank-dropdown-container banking-dropdown-container">
            <label class="field-label" for="bankSearchInput">Select Indian Bank / Financial Institution *</label>

            <!-- State A: Selected Bank Card -->
            <div *ngIf="selectedBank() && !isBankDropdownOpen()" class="selected-bank-card glass-panel">
              <div class="bank-avatar">
                <span class="material-symbols-outlined">account_balance</span>
              </div>
              <div class="bank-card-meta">
                <span class="bank-card-name">{{ selectedBank()!.name }}</span>
                <div class="bank-card-tags">
                  <span class="bank-tag" *ngIf="selectedBank()!.category">{{ selectedBank()!.category }}</span>
                  <span class="bank-code-tag" *ngIf="selectedBank()!.shortCode">{{ selectedBank()!.shortCode }}</span>
                </div>
              </div>
              <button
                type="button"
                class="change-bank-btn"
                (click)="openBankDropdown()"
                title="Change bank"
              >
                <span class="material-symbols-outlined">edit</span>
                <span>Change</span>
              </button>
            </div>

            <!-- State B: Searchable Input & Dropdown Menu -->
            <div *ngIf="!selectedBank() || isBankDropdownOpen()" class="bank-search-wrap">
              <div class="search-input-box">
                <span class="material-symbols-outlined input-search-icon">search</span>
                <input
                  id="bankSearchInput"
                  type="text"
                  [ngModel]="bankSearchQuery()"
                  (ngModelChange)="onBankSearchChange($event)"
                  [ngModelOptions]="{standalone: true}"
                  placeholder="Search 90+ Indian Banks (e.g. SBI, HDFC, ICICI, Axis, Amex)..."
                  class="form-input search-field font-sans"
                  autocomplete="off"
                  (focus)="openBankDropdown()"
                />
                <button
                  *ngIf="bankSearchQuery()"
                  type="button"
                  class="clear-input-btn"
                  (click)="clearBankSearch()"
                  aria-label="Clear bank search"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>

              <!-- Dropdown List -->
              <div *ngIf="isBankDropdownOpen()" class="bank-options-list glass-panel-elevated">
                <div class="options-header">
                  <span>Available Indian Banks ({{ filteredBanks().length }})</span>
                  <button type="button" class="close-list-btn" (click)="closeBankDropdown()">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div class="options-scroll">
                  <div
                    *ngFor="let bank of filteredBanks(); trackBy: trackByBankId"
                    class="bank-option-row"
                    (click)="selectBank(bank)"
                  >
                    <div class="option-icon-box">
                      <span class="material-symbols-outlined">account_balance</span>
                    </div>
                    <div class="option-meta">
                      <span class="option-name">{{ bank.name }}</span>
                      <span class="option-sub" *ngIf="bank.category">{{ bank.category }}</span>
                    </div>
                    <span class="option-code" *ngIf="bank.shortCode">{{ bank.shortCode }}</span>
                  </div>

                  <!-- Empty state or custom bank entry -->
                  <div *ngIf="filteredBanks().length === 0" class="no-banks-found">
                    <p>No listed Indian banks matching "{{ bankSearchQuery() }}"</p>
                  </div>

                  <div
                    *ngIf="bankSearchQuery().trim().length > 0"
                    class="custom-bank-option"
                    (click)="enableCustomBank(bankSearchQuery())"
                  >
                    <span class="material-symbols-outlined">add_circle</span>
                    <span>Use "<strong>{{ bankSearchQuery() }}</strong>" as Custom Bank</span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="bankingForm.get('bankName')?.invalid && bankingForm.get('bankName')?.touched" class="field-error">
              Please select or enter a bank name.
            </div>
          </div>

          <!-- Official Bank Login URL (Clickable Label / Link & Actions) -->
          <div class="form-field" *ngIf="bankingForm.get('loginUrl')?.value">
            <label class="field-label">Official Internet Banking Portal</label>
            <div class="login-url-card glass-panel">
              <div class="url-info-col">
                <div class="url-header-row">
                  <span class="material-symbols-outlined lock-icon">verified_user</span>
                  <span class="url-type-badge">NetBanking Login URL</span>
                </div>
                <!-- Clickable URL Label that opens in another tab -->
                <a
                  [href]="formatUrl(bankingForm.get('loginUrl')?.value)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="clickable-bank-url font-mono"
                  title="Open NetBanking login page in new tab"
                >
                  <span class="url-text">{{ bankingForm.get('loginUrl')?.value }}</span>
                  <span class="material-symbols-outlined open-icon">open_in_new</span>
                </a>
              </div>

              <!-- Action Buttons: Open & Copy -->
              <div class="url-actions">
                <a
                  [href]="formatUrl(bankingForm.get('loginUrl')?.value)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-action-primary"
                  title="Open official NetBanking in new tab"
                >
                  <span class="material-symbols-outlined">open_in_new</span>
                  <span>Open</span>
                </a>
                <button
                  type="button"
                  class="btn-action-secondary"
                  (click)="copyLoginUrl()"
                  title="Copy NetBanking URL to clipboard"
                >
                  <span class="material-symbols-outlined">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Custom URL Input (Only for custom banks or optional manual entry) -->
          <div class="form-field" *ngIf="isCustomBank() && !bankingForm.get('loginUrl')?.value">
            <label class="field-label" for="loginUrl">Website / NetBanking URL (Optional)</label>
            <input
              id="loginUrl"
              type="url"
              formControlName="loginUrl"
              placeholder="e.g. https://www.yourbank.com"
              class="form-input font-sans"
            />
            <div *ngIf="bankingForm.get('loginUrl')?.invalid && bankingForm.get('loginUrl')?.touched" class="field-error">
              Must be a valid web URL.
            </div>
          </div>

          <!-- Account Nickname -->
          <div class="form-field">
            <label class="field-label" for="accountNickname">Account Nickname (Optional)</label>
            <input
              id="accountNickname"
              type="text"
              formControlName="accountNickname"
              placeholder="e.g. Salary Account, Savings, Fixed Deposit"
              class="form-input font-sans"
            />
          </div>

          <!-- Username / Customer ID -->
          <div class="form-field">
            <label class="field-label" for="username">Customer ID / User ID *</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="e.g. 12345678 or demo.user"
              class="form-input font-mono"
              autocomplete="off"
            />
            <div *ngIf="bankingForm.get('username')?.invalid && bankingForm.get('username')?.touched" class="field-error">
              Customer ID / Username is required.
            </div>
          </div>

          <!-- Password / IPIN -->
          <div class="form-field">
            <label class="field-label" for="password">NetBanking Password / IPIN *</label>
            <div class="password-input-wrap">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="e.g. NOT-A-REAL-PASSWORD"
                class="form-input font-mono"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-eye"
                (click)="showPassword.set(!showPassword())"
                aria-label="Toggle password visibility"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <div *ngIf="bankingForm.get('password')?.invalid && bankingForm.get('password')?.touched" class="field-error">
              Password is required.
            </div>
          </div>

          <!-- Notes -->
          <div class="form-field">
            <label class="field-label" for="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              formControlName="notes"
              rows="3"
              placeholder="Branch IFSC, CIF number, security questions, etc."
              class="form-textarea font-sans"
            ></textarea>
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="bankingForm.invalid || isSubmitting()"
          >
            <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
            <span *ngIf="!isSubmitting()">
              {{ isEditMode() ? 'Save Changes' : 'Save to Vault' }}
            </span>
          </button>
        </form>

        <!-- 2. PAYMENT CARD FORM (CREDIT & DEBIT) -->
        <form *ngIf="selectedCategory() === 'CREDIT_CARD' || selectedCategory() === 'DEBIT_CARD'" [formGroup]="cardForm" (ngSubmit)="onSubmitCard()" class="credential-form">
          <!-- Real-Time Interactive Card Preview Mockup -->
          <div class="card-preview-form-box">
            <app-card-preview
              [cardNumber]="cardForm.get('cardNumber')?.value || ''"
              [cardholderName]="cardForm.get('cardholderName')?.value || ''"
              [expiryMonth]="cardForm.get('expiryMonth')?.value || ''"
              [expiryYear]="cardForm.get('expiryYear')?.value || ''"
              [cvv]="cardForm.get('cvv')?.value || ''"
              [nickname]="cardForm.get('cardNickname')?.value || ''"
              [bankName]="cardForm.get('bankName')?.value || ''"
              [category]="selectedCategory() === 'DEBIT_CARD' ? 'DEBIT_CARD' : 'CREDIT_CARD'"
              [customBgImage]="cardForm.get('cardImageUrl')?.value || ''"
            ></app-card-preview>
          </div>

          <!-- Physical Card Scanner Action Bar -->
          <div class="scan-card-action-bar">
            <button
              type="button"
              class="btn-scan-card"
              (click)="openCardScanner()"
            >
              <span class="material-symbols-outlined scan-icon">document_scanner</span>
              <span class="scan-btn-text">Scan Physical Card (Front & Back)</span>
              <span class="scan-pill">AUTO-FILL</span>
            </button>
          </div>

          <!-- Searchable Bank / Card Issuer Dropdown Field -->
          <div class="form-field bank-dropdown-container card-bank-dropdown-container">
            <label class="field-label" for="cardBankSearchInput">Select Issuing Bank / Card Issuer *</label>

            <!-- State A: Selected Bank Card -->
            <div *ngIf="selectedCardBank() && !isCardBankDropdownOpen()" class="selected-bank-card glass-panel">
              <div class="bank-avatar">
                <span class="material-symbols-outlined">account_balance</span>
              </div>
              <div class="bank-card-meta">
                <span class="bank-card-name">{{ selectedCardBank()!.name }}</span>
                <div class="bank-card-tags">
                  <span class="bank-tag" *ngIf="selectedCardBank()!.category">{{ selectedCardBank()!.category }}</span>
                  <span class="bank-code-tag" *ngIf="selectedCardBank()!.shortCode">{{ selectedCardBank()!.shortCode }}</span>
                </div>
              </div>
              <button
                type="button"
                class="change-bank-btn"
                (click)="openCardBankDropdown()"
                title="Change bank / issuer"
              >
                <span class="material-symbols-outlined">edit</span>
                <span>Change</span>
              </button>
            </div>

            <!-- State B: Searchable Input & Dropdown Menu -->
            <div *ngIf="!selectedCardBank() || isCardBankDropdownOpen()" class="bank-search-wrap">
              <div class="search-input-box">
                <span class="material-symbols-outlined input-search-icon">search</span>
                <input
                  id="cardBankSearchInput"
                  type="text"
                  [ngModel]="cardBankSearchQuery()"
                  (ngModelChange)="onCardBankSearchChange($event)"
                  [ngModelOptions]="{standalone: true}"
                  placeholder="Search 90+ Indian Banks & Issuers (e.g. HDFC, SBI Card, ICICI, Amex, Axis)..."
                  class="form-input search-field font-sans"
                  autocomplete="off"
                  (focus)="openCardBankDropdown()"
                />
                <button
                  *ngIf="cardBankSearchQuery()"
                  type="button"
                  class="clear-input-btn"
                  (click)="clearCardBankSearch()"
                  aria-label="Clear issuer search"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>

              <!-- Dropdown List -->
              <div *ngIf="isCardBankDropdownOpen()" class="bank-options-list glass-panel-elevated">
                <div class="options-header">
                  <span>Available Issuers & Banks ({{ filteredCardBanks().length }})</span>
                  <button type="button" class="close-list-btn" (click)="closeCardBankDropdown()">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div class="options-scroll">
                  <div
                    *ngFor="let bank of filteredCardBanks(); trackBy: trackByBankId"
                    class="bank-option-row"
                    (click)="selectCardBank(bank)"
                  >
                    <div class="option-icon-box">
                      <span class="material-symbols-outlined">account_balance</span>
                    </div>
                    <div class="option-meta">
                      <span class="option-name">{{ bank.name }}</span>
                      <span class="option-sub" *ngIf="bank.category">{{ bank.category }}</span>
                    </div>
                    <span class="option-code" *ngIf="bank.shortCode">{{ bank.shortCode }}</span>
                  </div>

                  <!-- Empty state or custom bank entry -->
                  <div *ngIf="filteredCardBanks().length === 0" class="no-banks-found">
                    <p>No listed Indian banks or issuers matching "{{ cardBankSearchQuery() }}"</p>
                  </div>

                  <div
                    *ngIf="cardBankSearchQuery().trim().length > 0"
                    class="custom-bank-option"
                    (click)="enableCardCustomBank(cardBankSearchQuery())"
                  >
                    <span class="material-symbols-outlined">add_circle</span>
                    <span>Use "<strong>{{ cardBankSearchQuery() }}</strong>" as Custom Issuer</span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="cardForm.get('bankName')?.invalid && cardForm.get('bankName')?.touched" class="field-error">
              Please select or enter an issuing bank / issuer.
            </div>
          </div>

          <div class="form-field">
            <label class="field-label" for="cardNickname">Card Nickname *</label>
            <input
              id="cardNickname"
              type="text"
              formControlName="cardNickname"
              placeholder="e.g. HDFC Regalia, ICICI Amazon Pay, SBI SimplyCLICK"
              class="form-input font-sans"
            />
            <div *ngIf="cardForm.get('cardNickname')?.invalid && cardForm.get('cardNickname')?.touched" class="field-error">
              Card nickname is required.
            </div>
          </div>

          <div class="form-field">
            <label class="field-label" for="cardholderName">Cardholder Name *</label>
            <input
              id="cardholderName"
              type="text"
              formControlName="cardholderName"
              placeholder="e.g. DEMO USER"
              class="form-input font-sans"
              style="text-transform: uppercase;"
            />
            <div *ngIf="cardForm.get('cardholderName')?.invalid && cardForm.get('cardholderName')?.touched" class="field-error">
              Cardholder name is required.
            </div>
          </div>

          <div class="form-field">
            <div class="field-label-row">
              <label class="field-label" for="cardNumber">Card Number (13-19 digits) *</label>
              <!-- Detected Network Badge -->
              <span *ngIf="detectedCardMeta()" class="detected-network-pill" [style.background]="detectedCardMeta()!.badgeBg">
                {{ detectedCardMeta()!.name }}
              </span>
            </div>

            <div class="card-number-input-wrap">
              <input
                id="cardNumber"
                type="text"
                formControlName="cardNumber"
                (input)="onCardNumberInput($event)"
                placeholder="e.g. 4111 2222 3333 4444"
                class="form-input font-mono card-number-field"
                maxlength="23"
              />
              <div class="card-brand-badge-box" [title]="detectedCardMeta()?.name || 'Card Network'">
                <!-- When network is detected, show its SVG logo -->
                <div *ngIf="detectedCardMeta()" class="network-svg-wrap" [innerHTML]="sanitizedCardLogo()"></div>
                <!-- When no network or empty, show default card icon -->
                <div *ngIf="!detectedCardMeta()" class="network-svg-wrap default-card-icon" [innerHTML]="sanitizedDefaultLogo()"></div>
              </div>
            </div>

            <!-- Unrecognized Network Warning Message -->
            <div *ngIf="isUnrecognizedCardNetwork()" class="network-warning-notice">
              <span class="material-symbols-outlined warning-icon">warning</span>
              <div class="warning-text">
                <strong>Unrecognized card network.</strong>
                <span>Supported networks: RuPay, Visa, Mastercard, American Express, Diners Club, Discover, JCB, Maestro, UnionPay.</span>
              </div>
            </div>

            <div *ngIf="cardForm.get('cardNumber')?.invalid && cardForm.get('cardNumber')?.touched" class="field-error">
              <span *ngIf="cardForm.get('cardNumber')?.errors?.['unrecognizedCardNetwork']">Unrecognized card network. Please check the digits and try again.</span>
              <span *ngIf="cardForm.get('cardNumber')?.errors?.['invalidCardFormat']">Must be 13-19 numeric digits.</span>
              <span *ngIf="cardForm.get('cardNumber')?.errors?.['luhnChecksumFailed']">Invalid card number. Please check the digits and try again.</span>
              <span *ngIf="cardForm.get('cardNumber')?.errors?.['required']">Card number is required.</span>
            </div>
          </div>

          <!-- Expiry & CVV Row -->
          <div class="form-row-dual">
            <div class="form-field">
              <label class="field-label">Expiry Month / Year *</label>
              <div class="expiry-inputs">
                <input
                  type="text"
                  formControlName="expiryMonth"
                  placeholder="MM"
                  maxlength="2"
                  class="form-input font-mono text-center"
                />
                <span class="slash">/</span>
                <input
                  type="text"
                  formControlName="expiryYear"
                  placeholder="YYYY"
                  maxlength="4"
                  class="form-input font-mono text-center"
                />
              </div>
              <div *ngIf="cardForm.errors?.['invalidExpiryMonth'] && (cardForm.get('expiryMonth')?.touched || cardForm.get('expiryYear')?.touched)" class="field-error">
                Valid month (01-12) required.
              </div>
              <div *ngIf="cardForm.errors?.['cardExpired'] && (cardForm.get('expiryMonth')?.touched || cardForm.get('expiryYear')?.touched)" class="field-error">
                Card expiry cannot be in the past.
              </div>
            </div>

            <div class="form-field">
              <label class="field-label" for="cvv">
                {{ detectedCardMeta()?.code?.name || 'CVV' }} ({{ detectedCardMeta()?.code?.size ? detectedCardMeta()!.code.size + ' digits' : '3-4 digits' }}) *
              </label>
              <input
                id="cvv"
                type="password"
                formControlName="cvv"
                [placeholder]="detectedCardMeta()?.code?.size === 4 ? '1234' : '123'"
                maxlength="4"
                class="form-input font-mono text-center"
              />
              <div *ngIf="cardForm.get('cvv')?.invalid && cardForm.get('cvv')?.touched" class="field-error">
                {{ detectedCardMeta()?.code?.size === 4 ? '4 numeric digits required.' : '3 or 4 numeric digits required.' }}
              </div>
            </div>
          </div>

          <!-- PIN (Optional) -->
          <div class="form-field">
            <label class="field-label" for="pin">ATM PIN (4-6 digits, Optional)</label>
            <input
              id="pin"
              type="password"
              formControlName="pin"
              placeholder="e.g. 1234"
              maxlength="6"
              class="form-input font-mono text-center"
              style="max-width: 160px;"
            />
            <div *ngIf="cardForm.get('pin')?.invalid && cardForm.get('pin')?.touched" class="field-error">
              Must be 4 to 6 numeric digits.
            </div>
          </div>

          <div class="form-field">
            <label class="field-label" for="cardNotes">Notes (Optional)</label>
            <textarea
              id="cardNotes"
              formControlName="notes"
              rows="3"
              placeholder="Billing address notes, customer service phone, etc."
              class="form-textarea font-sans"
            ></textarea>
          </div>

          <div class="form-field">
            <label class="field-label" for="cardImageUrl">Custom Card Image / Artwork URL (Optional)</label>
            <input
              id="cardImageUrl"
              type="text"
              formControlName="cardImageUrl"
              placeholder="e.g. Paste link to Card Insider or official card face photo"
              class="form-input font-sans"
            />
            <span style="font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); margin-top: 4px; display: block;">
              Optional. Leave blank to automatically use the high-fidelity theme for your card.
            </span>
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="cardForm.invalid || isSubmitting()"
          >
            <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
            <span *ngIf="!isSubmitting()">
              {{ isEditMode() ? 'Save Changes' : 'Save to Vault' }}
            </span>
          </button>
        </form>
      </div>

      <!-- Card Scanner Modal -->
      <app-card-scanner-modal
        *ngIf="isCardScannerOpen()"
        (cardScanned)="onCardScanned($event)"
        (close)="isCardScannerOpen.set(false)"
      ></app-card-scanner-modal>
    </div>
  `,
  styles: [`
    .form-page-wrapper {
      max-width: 640px;
      margin: 0 auto;
      padding: 20px 16px 80px 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-nav-row {
      display: flex;
      align-items: center;
    }

    .scan-card-action-bar {
      margin-bottom: 16px;
    }

    .btn-scan-card {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 18px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(129, 140, 248, 0.18) 100%);
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: var(--radius-md);
      color: #38bdf8;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(56, 189, 248, 0.15);
      transition: all 0.2s ease;
    }

    .btn-scan-card:hover {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(129, 140, 248, 0.28) 100%);
      border-color: #38bdf8;
      box-shadow: 0 6px 22px rgba(56, 189, 248, 0.3);
      transform: translateY(-1px);
    }

    .scan-icon {
      font-size: 22px;
      color: #38bdf8;
    }

    .scan-pill {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 2px 7px;
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      border-radius: 9999px;
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .back-link:hover {
      color: var(--primary);
    }

    .form-card {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .form-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .category-selector-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-pills {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .cat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 6px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cat-pill:hover {
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .cat-pill.active {
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
    }

    .credential-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-input {
      width: 100%;
      height: 48px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0 14px;
      color: var(--text-primary);
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-input:focus, .form-textarea:focus {
      border-color: var(--primary);
      box-shadow: var(--shadow-neon);
    }

    .form-textarea {
      width: 100%;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      color: var(--text-primary);
      font-size: 0.95rem;
      outline: none;
      resize: vertical;
    }

    /* Selected Bank Card */
    .selected-bank-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: var(--radius-sm);
    }

    .bank-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bank-card-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .bank-card-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bank-card-tags {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bank-tag {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .bank-code-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
    }

    .change-bank-btn {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .change-bank-btn:hover {
      color: var(--primary);
      border-color: var(--primary);
    }

    /* Bank Search Input & Dropdown */
    .bank-search-wrap {
      position: relative;
      width: 100%;
    }

    .search-input-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      font-size: 20px;
      pointer-events: none;
    }

    .search-field {
      padding-left: 40px;
      padding-right: 36px;
    }

    .clear-input-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }

    .clear-input-btn:hover {
      color: var(--text-primary);
    }

    .bank-options-list {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 50;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      max-height: 280px;
      display: flex;
      flex-direction: column;
    }

    .options-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .close-list-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .options-scroll {
      overflow-y: auto;
      max-height: 230px;
    }

    .bank-option-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: background 0.15s ease;
    }

    .bank-option-row:hover {
      background: rgba(56, 189, 248, 0.1);
    }

    .option-icon-box {
      color: var(--primary);
      display: flex;
      align-items: center;
    }

    .option-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .option-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .option-code {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
    }

    .no-banks-found {
      padding: 16px 14px;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
    }

    .custom-bank-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      background: rgba(56, 189, 248, 0.08);
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border-top: 1px solid rgba(56, 189, 248, 0.2);
    }

    .custom-bank-option:hover {
      background: rgba(56, 189, 248, 0.18);
    }

    /* Official Login URL Label / Action Card */
    .login-url-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: var(--radius-sm);
    }

    .url-info-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .url-header-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lock-icon {
      font-size: 16px;
      color: var(--success);
    }

    .url-type-badge {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }

    .clickable-bank-url {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--primary);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      word-break: break-all;
      transition: all 0.2s ease;
    }

    .clickable-bank-url:hover {
      color: #7dd3fc;
      text-decoration: underline;
    }

    .clickable-bank-url .open-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .url-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-action-primary {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-action-primary:hover {
      background: rgba(56, 189, 248, 0.25);
      border-color: var(--primary);
    }

    .btn-action-secondary {
      background: rgba(30, 41, 59, 0.8);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-action-secondary:hover {
      color: var(--text-primary);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .password-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input-wrap .form-input {
      padding-right: 44px;
    }

    .toggle-eye {
      position: absolute;
      right: 6px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
    }

    .toggle-eye:hover {
      color: var(--text-primary);
    }

    .field-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .detected-network-pill {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.2s ease-in;
    }

    .card-preview-form-box {
      margin-bottom: 24px;
    }

    .card-number-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .card-number-field {
      padding-right: 68px;
      letter-spacing: 0.06em;
    }

    .card-brand-badge-box {
      position: absolute;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 34px;
      pointer-events: none;
      transition: all 0.2s ease;
    }

    .network-svg-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .network-svg-wrap svg {
      width: 48px;
      height: 30px;
      border-radius: 4px;
    }

    .default-card-icon {
      opacity: 0.55;
    }

    .network-warning-notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 12px;
      margin-top: 4px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: var(--radius-sm);
      color: #fca5a5;
      font-size: 0.8rem;
      line-height: 1.4;
      animation: fadeIn 0.2s ease-in;
    }

    .network-warning-notice .warning-icon {
      font-size: 18px;
      color: #ef4444;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .network-warning-notice .warning-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .form-row-dual {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .expiry-inputs {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .slash {
      font-size: 1.2rem;
      color: var(--text-muted);
    }

    .text-center {
      text-align: center;
    }

    .field-error {
      font-size: 0.78rem;
      color: var(--danger);
    }

    .w-full {
      width: 100%;
    }

    @media (max-width: 500px) {
      .login-url-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .url-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class ItemFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vaultState = inject(VaultStateService);
  private readonly bankDirectory = inject(BankDirectoryService);
  private readonly clipboard = inject(ClipboardSafetyService);
  private readonly elementRef = inject(ElementRef);
  private readonly cardDetector = inject(CardDetectorService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly selectedCategory = signal<VaultCategory>('BANKING');
  readonly isEditMode = signal<boolean>(false);
  readonly editId = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  // Searchable Bank Dropdown Signals (Banking Form)
  readonly bankSearchQuery = signal<string>('');
  readonly isBankDropdownOpen = signal<boolean>(false);
  readonly selectedBank = signal<IndianBank | null>(null);
  readonly isCustomBank = signal<boolean>(false);
  readonly filteredBanks = computed(() => this.bankDirectory.searchBanks(this.bankSearchQuery()));

  // Searchable Bank Dropdown Signals (Credit / Debit Card Form)
  readonly cardBankSearchQuery = signal<string>('');
  readonly isCardBankDropdownOpen = signal<boolean>(false);
  readonly selectedCardBank = signal<IndianBank | null>(null);
  readonly isCardCustomBank = signal<boolean>(false);
  readonly filteredCardBanks = computed(() => this.bankDirectory.searchBanks(this.cardBankSearchQuery()));

  // Card Detection Signals
  readonly detectedCardMeta = signal<CardNetworkMeta | null>(null);
  readonly isUnrecognizedCardNetwork = signal<boolean>(false);
  readonly isCardScannerOpen = signal<boolean>(false);

  bankingForm!: FormGroup;
  cardForm!: FormGroup;
  private existingItem: DecryptedVaultItem | null = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isBankDropdownOpen() && !this.elementRef.nativeElement.querySelector('.banking-dropdown-container')?.contains(event.target)) {
      this.closeBankDropdown();
    }
    if (this.isCardBankDropdownOpen() && !this.elementRef.nativeElement.querySelector('.card-bank-dropdown-container')?.contains(event.target)) {
      this.closeCardBankDropdown();
    }
  }

  ngOnInit(): void {
    this.initForms();

    this.cardForm.get('cardNumber')?.valueChanges.subscribe(val => {
      this.updateDetectedCard(val);
    });

    this.route.queryParams.subscribe(params => {
      if (params['category'] && ['BANKING', 'CREDIT_CARD', 'DEBIT_CARD'].includes(params['category'])) {
        this.selectedCategory.set(params['category']);
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.editId.set(id);
        this.loadExistingItem(id);
      }
    });
  }

  openCardScanner(): void {
    this.isCardScannerOpen.set(true);
    this.cdr.markForCheck();
  }

  onCardScanned(data: CardScanAutoFillData): void {
    if (data.cardNumber) {
      const formatted = this.cardDetector.formatCardNumber(data.cardNumber);
      this.cardForm.get('cardNumber')?.setValue(formatted);
      this.cardForm.get('cardNumber')?.markAsDirty();
      this.updateDetectedCard(data.cardNumber);
    }
    if (data.cardholderName) {
      this.cardForm.get('cardholderName')?.setValue(data.cardholderName);
      this.cardForm.get('cardholderName')?.markAsDirty();
    }
    if (data.expiryMonth) {
      this.cardForm.get('expiryMonth')?.setValue(data.expiryMonth);
      this.cardForm.get('expiryMonth')?.markAsDirty();
    }
    if (data.expiryYear) {
      this.cardForm.get('expiryYear')?.setValue(data.expiryYear);
      this.cardForm.get('expiryYear')?.markAsDirty();
    }
    if (data.cvv) {
      this.cardForm.get('cvv')?.setValue(data.cvv);
      this.cardForm.get('cvv')?.markAsDirty();
    }

    // Set default nickname if empty
    if (!this.cardForm.get('cardNickname')?.value) {
      const brand = data.cardBrand || 'Card';
      const last4 = data.cardNumber ? data.cardNumber.slice(-4) : '';
      const defaultName = last4 ? `${brand} •••• ${last4}` : `${brand}`;
      this.cardForm.get('cardNickname')?.setValue(defaultName);
    }

    this.isCardScannerOpen.set(false);
    this.cdr.markForCheck();
  }

  private initForms(): void {
    this.bankingForm = this.fb.group({
      bankName: ['', [Validators.required]],
      accountNickname: [''],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      loginUrl: ['', [VaultValidators.safeUrl()]],
      notes: ['']
    });

    this.cardForm = this.fb.group(
      {
        bankName: ['', [Validators.required]],
        cardNickname: ['', [Validators.required]],
        cardholderName: ['', [Validators.required]],
        cardNumber: ['', [Validators.required, VaultValidators.luhnCardNumber(), this.validateCardNetwork()]],
        expiryMonth: ['', [Validators.required]],
        expiryYear: ['', [Validators.required]],
        cvv: ['', [Validators.required, VaultValidators.cvv()]],
        pin: ['', [VaultValidators.pin()]],
        notes: [''],
        cardImageUrl: ['']
      },
      { validators: VaultValidators.cardExpiry('expiryMonth', 'expiryYear') }
    );
  }

  async loadExistingItem(id: string): Promise<void> {
    try {
      const decrypted = await this.vaultState.getItemDetails(id);
      if (!decrypted) {
        this.router.navigate(['/items']);
        return;
      }
      this.existingItem = decrypted;
      this.selectedCategory.set(decrypted.category);

      if (decrypted.category === 'BANKING') {
        const payload = decrypted.payload as BankingAccountPayload;
        this.bankingForm.patchValue({
          bankName: payload.bankName,
          accountNickname: payload.accountNickname || '',
          username: payload.username,
          password: payload.password,
          loginUrl: payload.loginUrl || '',
          notes: payload.notes || ''
        });

        // Match existing bank name in directory if available
        const matched = this.bankDirectory.getBankByName(payload.bankName);
        if (matched) {
          this.selectedBank.set(matched);
          this.bankSearchQuery.set(matched.name);
        } else {
          this.isCustomBank.set(true);
          this.bankSearchQuery.set(payload.bankName);
        }
      } else if (decrypted.category === 'CREDIT_CARD' || decrypted.category === 'DEBIT_CARD') {
        const payload = decrypted.payload as PaymentCardPayload;
        const formattedNumber = this.cardDetector.formatCardNumber(payload.cardNumber);
        this.cardForm.patchValue({
          bankName: payload.bankName || '',
          cardNickname: payload.cardNickname,
          cardholderName: payload.cardholderName,
          cardNumber: formattedNumber,
          expiryMonth: payload.expiryMonth,
          expiryYear: payload.expiryYear,
          cvv: payload.cvv,
          pin: payload.pin || '',
          notes: payload.notes || '',
          cardImageUrl: payload.cardImageUrl || ''
        });
        this.updateDetectedCard(payload.cardNumber);

        if (payload.bankName) {
          const matched = this.bankDirectory.getBankByName(payload.bankName);
          if (matched) {
            this.selectedCardBank.set(matched);
            this.cardBankSearchQuery.set(matched.name);
          } else {
            this.isCardCustomBank.set(true);
            this.cardBankSearchQuery.set(payload.bankName);
          }
        }
      }
    } catch {
      this.router.navigate(['/items']);
    }
  }

  onCategoryChange(cat: VaultCategory): void {
    this.selectedCategory.set(cat);
  }

  // --- Bank Dropdown Search & Selection Methods ---
  openBankDropdown(): void {
    this.isBankDropdownOpen.set(true);
  }

  closeBankDropdown(): void {
    this.isBankDropdownOpen.set(false);
  }

  onBankSearchChange(query: string): void {
    this.bankSearchQuery.set(query);
    this.isBankDropdownOpen.set(true);
  }

  clearBankSearch(): void {
    this.bankSearchQuery.set('');
    this.selectedBank.set(null);
    this.bankingForm.patchValue({ bankName: '', loginUrl: '' });
  }

  selectBank(bank: IndianBank): void {
    this.selectedBank.set(bank);
    this.isCustomBank.set(false);
    this.bankSearchQuery.set(bank.name);
    this.bankingForm.patchValue({
      bankName: bank.name,
      loginUrl: bank.loginUrl
    });
    this.isBankDropdownOpen.set(false);
  }

  enableCustomBank(customName: string): void {
    const trimmed = customName.trim();
    this.selectedBank.set(null);
    this.isCustomBank.set(true);
    this.bankingForm.patchValue({
      bankName: trimmed
    });
    this.bankSearchQuery.set(trimmed);
    this.isBankDropdownOpen.set(false);
  }

  copyLoginUrl(): void {
    const url = this.bankingForm.get('loginUrl')?.value;
    if (url) {
      this.clipboard.copyText(url, 'NetBanking URL');
    }
  }

  formatUrl(url?: string): string {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  }

  async onSubmitBanking(): Promise<void> {
    if (this.bankingForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const val = this.bankingForm.value;
    const payload: BankingAccountPayload = {
      bankName: val.bankName.trim(),
      accountNickname: val.accountNickname?.trim() || undefined,
      username: val.username.trim(),
      password: val.password,
      loginUrl: val.loginUrl?.trim() || undefined,
      notes: val.notes?.trim() || undefined
    };

    const title = payload.accountNickname ? `${payload.bankName} (${payload.accountNickname})` : payload.bankName;
    const subtitle = payload.username;

    try {
      const saved = await this.vaultState.saveItem({
        id: this.existingItem ? this.existingItem.id : undefined,
        category: 'BANKING',
        title,
        subtitle,
        payload,
        createdAt: this.existingItem ? this.existingItem.createdAt : undefined
      });
      this.router.navigate(['/items', saved.id]);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // --- Card Bank Dropdown Search & Selection Methods ---
  openCardBankDropdown(): void {
    this.isCardBankDropdownOpen.set(true);
  }

  closeCardBankDropdown(): void {
    this.isCardBankDropdownOpen.set(false);
  }

  onCardBankSearchChange(query: string): void {
    this.cardBankSearchQuery.set(query);
    this.isCardBankDropdownOpen.set(true);
  }

  clearCardBankSearch(): void {
    this.cardBankSearchQuery.set('');
    this.selectedCardBank.set(null);
    this.cardForm.patchValue({ bankName: '' });
  }

  selectCardBank(bank: IndianBank): void {
    this.selectedCardBank.set(bank);
    this.isCardCustomBank.set(false);
    this.cardBankSearchQuery.set(bank.name);
    this.cardForm.patchValue({
      bankName: bank.name
    });
    // Auto-suggest card nickname if currently empty
    const currentNickname = this.cardForm.get('cardNickname')?.value;
    if (!currentNickname || currentNickname.trim() === '') {
      const typeLabel = this.selectedCategory() === 'DEBIT_CARD' ? 'Debit Card' : 'Credit Card';
      const label = bank.shortCode ? `${bank.shortCode} ${typeLabel}` : `${bank.name} ${typeLabel}`;
      this.cardForm.patchValue({ cardNickname: label });
    }
    this.isCardBankDropdownOpen.set(false);
  }

  enableCardCustomBank(customName: string): void {
    const trimmed = customName.trim();
    this.selectedCardBank.set(null);
    this.isCardCustomBank.set(true);
    this.cardForm.patchValue({
      bankName: trimmed
    });
    this.cardBankSearchQuery.set(trimmed);
    this.isCardBankDropdownOpen.set(false);
  }

  // --- Card Detection & Formatting Methods ---
  private validateCardNetwork(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const clean = String(control.value).replace(/\D/g, '');
      if (clean.length >= 4 && this.cardDetector.isUnrecognizedNetwork(clean)) {
        return { unrecognizedCardNetwork: true };
      }
      return null;
    };
  }

  updateDetectedCard(val: string | null | undefined): void {
    const detected = this.cardDetector.detectCard(val);
    this.detectedCardMeta.set(detected);
    this.isUnrecognizedCardNetwork.set(this.cardDetector.isUnrecognizedNetwork(val));
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.cardDetector.formatCardNumber(input.value);
    if (formatted !== input.value) {
      input.value = formatted;
      this.cardForm.get('cardNumber')?.setValue(formatted, { emitModelToViewChange: false });
    }
  }

  sanitizedCardLogo(): SafeHtml {
    const meta = this.detectedCardMeta();
    if (!meta) return '';
    return this.sanitizer.bypassSecurityTrustHtml(meta.svgLogo);
  }

  sanitizedDefaultLogo(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.cardDetector.getGenericCardSvg());
  }

  async onSubmitCard(): Promise<void> {
    if (this.cardForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const val = this.cardForm.value;
    const cleanCardNumber = String(val.cardNumber).replace(/\s+/g, '');
    const payload: PaymentCardPayload = {
      bankName: val.bankName?.trim() || undefined,
      cardNickname: val.cardNickname.trim(),
      cardholderName: val.cardholderName.trim().toUpperCase(),
      cardNumber: cleanCardNumber,
      expiryMonth: String(val.expiryMonth).padStart(2, '0'),
      expiryYear: String(val.expiryYear).length === 2 ? `20${val.expiryYear}` : String(val.expiryYear),
      cvv: String(val.cvv).trim(),
      pin: val.pin ? String(val.pin).trim() : undefined,
      notes: val.notes?.trim() || undefined,
      cardImageUrl: val.cardImageUrl?.trim() || undefined
    };

    const title = payload.cardNickname;
    const lastFour = cleanCardNumber.slice(-4);
    const subtitle = `•••• •••• •••• ${lastFour}`;

    try {
      const saved = await this.vaultState.saveItem({
        id: this.existingItem ? this.existingItem.id : undefined,
        category: this.selectedCategory(),
        title,
        subtitle,
        payload,
        createdAt: this.existingItem ? this.existingItem.createdAt : undefined
      });
      this.router.navigate(['/items', saved.id]);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  trackByBankId(_index: number, bank: IndianBank): number {
    return bank.id;
  }
}
