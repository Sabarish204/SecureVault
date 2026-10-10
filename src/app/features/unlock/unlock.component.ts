import { Component, inject, signal, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VaultStateService } from '../../core/state/vault-state.service';
import { BiometricService } from '../../core/services/biometric.service';
import { VaultValidators } from '../../shared/validators/vault.validators';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="unlock-page-wrapper">
      <div class="unlock-card glass-panel-elevated animate-fade-in">
        <!-- Shield Icon Header -->
        <div class="card-hero">
          <div class="shield-badge">
            <span class="material-symbols-outlined shield-icon">
              {{ isSetupMode() ? 'lock_person' : 'lock' }}
            </span>
          </div>
          <h1 class="hero-title">
            {{ isSetupMode() ? 'Create 4-Digit Master PIN' : 'Unlock SecureVault' }}
          </h1>
          <p class="hero-subtitle">
            {{ isSetupMode() 
              ? 'Your 4-digit PIN derives a 256-bit AES-GCM encryption key using PBKDF2 with 600,000 iterations. Quick to enter and easy to remember.' 
              : 'Enter your 4-digit master PIN to decrypt and access your personal credentials.' 
            }}
          </p>
        </div>

        <!-- Setup Form (First-Time User) -->
        <form *ngIf="isSetupMode()" [formGroup]="setupForm" (ngSubmit)="onSetupSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="newPassword">Master Password (4-Digit PIN)</label>
            <div class="input-container">
              <input
                id="newPassword"
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="masterPassword"
                placeholder="Enter 4-digit PIN (e.g. 1234)"
                class="vault-input font-mono"
                autocomplete="new-password"
                maxlength="4"
                inputmode="numeric"
                pattern="[0-9]*"
                (keydown)="onSetupKeyDown($event)"
              />
              <button
                type="button"
                class="visibility-btn"
                (click)="showNewPassword.set(!showNewPassword())"
                aria-label="Toggle password visibility"
              >
                <span class="material-symbols-outlined">
                  {{ showNewPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <div *ngIf="setupForm.get('masterPassword')?.invalid && (setupForm.get('masterPassword')?.touched || setupForm.get('masterPassword')?.dirty)" class="form-error">
              Must be exactly 4 digits (0-9).
            </div>
            <!-- Password Strength Bar -->
            <div class="strength-bar-wrapper">
              <div class="strength-meter" [ngClass]="passwordStrengthClass()"></div>
              <span class="strength-label">{{ passwordStrengthLabel() }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Master PIN</label>
            <div class="input-container">
              <input
                id="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Re-enter 4-digit PIN"
                class="vault-input font-mono"
                autocomplete="new-password"
                maxlength="4"
                inputmode="numeric"
                pattern="[0-9]*"
                (keydown)="onSetupKeyDown($event)"
              />
              <button
                type="button"
                class="visibility-btn"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                aria-label="Toggle password visibility"
              >
                <span class="material-symbols-outlined">
                  {{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <div *ngIf="setupForm.errors?.['mismatch'] && setupForm.get('confirmPassword')?.touched" class="form-error">
              PINs do not match.
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="setupForm.invalid || isSubmitting()"
          >
            <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
            <span *ngIf="!isSubmitting()">Create Vault & Unlock</span>
          </button>
        </form>

        <!-- Biometric / Fingerprint Unlock (if enabled) -->
        <div *ngIf="!isSetupMode() && biometric.isEnabled()" class="biometric-unlock-section">
          <button
            type="button"
            class="biometric-trigger-btn"
            (click)="triggerBiometricUnlock()"
            [disabled]="isSubmitting() || biometric.isAuthenticating()"
            aria-label="Unlock with Fingerprint"
          >
            <div class="fingerprint-radar">
              <span class="material-symbols-outlined fingerprint-icon">fingerprint</span>
              <span class="radar-pulse"></span>
            </div>
            <div class="biometric-btn-text">
              <span class="biometric-title">Unlock with {{ biometric.biometryName() }}</span>
              <span class="biometric-subtitle">Touch sensor for instant access</span>
            </div>
          </button>

          <div class="divider-with-text">
            <span>OR ENTER 4-DIGIT PIN</span>
          </div>
        </div>

        <!-- Unlock Form (Existing Vault) -->
        <form *ngIf="!isSetupMode()" [formGroup]="unlockForm" (ngSubmit)="onUnlockSubmit()" class="auth-form">
          <div class="form-group pin-entry-group">
            <div class="pin-header-row">
              <label class="form-label">Master PIN</label>
              <button
                type="button"
                class="pin-visibility-toggle"
                (click)="showUnlockPassword.set(!showUnlockPassword())"
                aria-label="Toggle PIN visibility"
                [attr.aria-pressed]="showUnlockPassword()"
              >
                <span class="material-symbols-outlined visibility-icon">
                  {{ showUnlockPassword() ? 'visibility_off' : 'visibility' }}
                </span>
                <span class="toggle-text">{{ showUnlockPassword() ? 'Hide' : 'Show' }}</span>
              </button>
            </div>

            <!-- 4 Distinct Digit Textboxes with Auto-Focus and Numeric-Only Keyboard -->
            <div
              class="pin-boxes-container"
              [class.shake-animation]="isShaking()"
              (paste)="onDigitPaste($event)"
            >
              <input
                #pinInput
                id="pin-digit-0"
                [type]="showUnlockPassword() ? 'text' : 'password'"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                class="pin-box"
                [class.has-value]="pinDigits[0] !== ''"
                [value]="pinDigits[0]"
                (beforeinput)="onDigitBeforeInput($event)"
                (input)="onDigitInput($event, 0)"
                (keydown)="onDigitKeyDown($event, 0)"
                (focus)="onDigitFocus(0)"
                aria-label="PIN digit 1"
              />
              <input
                #pinInput
                id="pin-digit-1"
                [type]="showUnlockPassword() ? 'text' : 'password'"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                class="pin-box"
                [class.has-value]="pinDigits[1] !== ''"
                [value]="pinDigits[1]"
                (beforeinput)="onDigitBeforeInput($event)"
                (input)="onDigitInput($event, 1)"
                (keydown)="onDigitKeyDown($event, 1)"
                (focus)="onDigitFocus(1)"
                aria-label="PIN digit 2"
              />
              <input
                #pinInput
                id="pin-digit-2"
                [type]="showUnlockPassword() ? 'text' : 'password'"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                class="pin-box"
                [class.has-value]="pinDigits[2] !== ''"
                [value]="pinDigits[2]"
                (beforeinput)="onDigitBeforeInput($event)"
                (input)="onDigitInput($event, 2)"
                (keydown)="onDigitKeyDown($event, 2)"
                (focus)="onDigitFocus(2)"
                aria-label="PIN digit 3"
              />
              <input
                #pinInput
                id="pin-digit-3"
                [type]="showUnlockPassword() ? 'text' : 'password'"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                class="pin-box"
                [class.has-value]="pinDigits[3] !== ''"
                [value]="pinDigits[3]"
                (beforeinput)="onDigitBeforeInput($event)"
                (input)="onDigitInput($event, 3)"
                (keydown)="onDigitKeyDown($event, 3)"
                (focus)="onDigitFocus(3)"
                aria-label="PIN digit 4"
              />
            </div>

            <div *ngIf="errorMessage()" class="form-error text-center">
              {{ errorMessage() }}
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="unlockForm.invalid || isSubmitting()"
          >
            <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
            <span *ngIf="!isSubmitting()" style="display: inline-flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined">lock_open</span>
              Unlock Vault
            </span>
          </button>

          <!-- Reset / Forgotten Master Password -->
          <div class="reset-section">
            <button
              type="button"
              class="reset-link-btn"
              (click)="onResetVaultClick()"
            >
              Reset Vault (Clear all local data)
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .unlock-page-wrapper {
      min-height: calc(100vh - var(--header-height));
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .unlock-card {
      width: 100%;
      max-width: 440px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin: 0 auto;
    }

    .card-hero {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .shield-badge {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.3) 100%);
      border: 1px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
    }

    .shield-icon {
      font-size: 34px;
      color: var(--primary);
    }

    .hero-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .hero-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .pin-entry-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }

    .pin-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 300px;
    }

    .pin-visibility-toggle {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .pin-visibility-toggle:hover {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-primary);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .visibility-icon {
      font-size: 16px;
    }

    .pin-boxes-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      margin: 8px 0;
    }

    .pin-box {
      width: 56px;
      height: 62px;
      background: rgba(15, 23, 42, 0.85);
      border: 1.5px solid var(--border-subtle);
      border-radius: 14px;
      color: var(--text-primary);
      font-size: 1.6rem;
      font-weight: 700;
      text-align: center;
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      outline: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25);
      caret-color: var(--primary);
      -webkit-appearance: none;
      -moz-appearance: textfield;
    }

    .pin-box::-webkit-outer-spin-button,
    .pin-box::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .pin-box:focus {
      border-color: var(--primary);
      background: rgba(15, 23, 42, 0.98);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25), 0 0 20px rgba(56, 189, 248, 0.25);
      transform: translateY(-2px);
    }

    .pin-box.has-value {
      border-color: rgba(56, 189, 248, 0.45);
      background: rgba(22, 34, 60, 0.9);
    }

    .pin-box[type="password"] {
      font-size: 2rem;
      letter-spacing: 0;
    }

    @keyframes pin-shake {
      0%, 100% { transform: translateX(0); }
      15%, 45%, 75% { transform: translateX(-8px); }
      30%, 60%, 90% { transform: translateX(8px); }
    }

    .shake-animation {
      animation: pin-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .text-center {
      text-align: center;
    }

    @media (max-width: 360px) {
      .pin-boxes-container {
        gap: 8px;
      }
      .pin-box {
        width: 48px;
        height: 54px;
        font-size: 1.4rem;
        border-radius: 10px;
      }
    }

    .form-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .vault-input {
      width: 100%;
      height: 48px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0 44px 0 14px;
      color: var(--text-primary);
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .vault-input:focus {
      border-color: var(--primary);
      box-shadow: var(--shadow-neon);
    }

    .visibility-btn {
      position: absolute;
      right: 6px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      border-radius: 6px;
    }

    .visibility-btn:hover {
      color: var(--text-primary);
    }

    .strength-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .strength-meter {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .strength-meter.weak {
      background: var(--danger);
      width: 25%;
    }

    .strength-meter.fair {
      background: var(--warning);
      width: 50%;
    }

    .strength-meter.good {
      background: #60a5fa;
      width: 75%;
    }

    .strength-meter.strong {
      background: var(--success);
      width: 100%;
    }

    .strength-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      min-width: 45px;
      text-align: right;
    }

    .form-error {
      font-size: 0.78rem;
      color: var(--danger);
      margin-top: 4px;
    }

    .w-full {
      width: 100%;
    }

    .reset-section {
      text-align: center;
      margin-top: 8px;
    }

    .reset-link-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.78rem;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s ease;
    }

    .reset-link-btn:hover {
      color: var(--danger);
    }

    .biometric-unlock-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 4px;
    }

    .biometric-trigger-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(129, 140, 248, 0.15) 100%);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: var(--radius-md, 14px);
      cursor: pointer;
      color: var(--text-primary);
      transition: all 0.25s ease;
      text-align: left;
      position: relative;
      overflow: hidden;
      width: 100%;
    }

    .biometric-trigger-btn:hover {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.25) 100%);
      border-color: var(--primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(56, 189, 248, 0.2);
    }

    .biometric-trigger-btn:active {
      transform: translateY(0);
    }

    .fingerprint-radar {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(56, 189, 248, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .fingerprint-icon {
      font-size: 28px;
      color: var(--primary);
      z-index: 2;
    }

    .radar-pulse {
      position: absolute;
      inset: -4px;
      border-radius: 18px;
      border: 2px solid rgba(56, 189, 248, 0.4);
      animation: pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      70% {
        transform: scale(1.15);
        opacity: 0;
      }
      100% {
        transform: scale(1.15);
        opacity: 0;
      }
    }

    .biometric-btn-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .biometric-title {
      font-size: 0.96rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .biometric-subtitle {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .divider-with-text {
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .divider-with-text::before,
    .divider-with-text::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--border-subtle);
    }

    .divider-with-text span {
      padding: 0 10px;
    }
  `]
})
export class UnlockComponent implements OnInit, AfterViewInit {
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private readonly fb = inject(FormBuilder);
  readonly vaultState = inject(VaultStateService);
  readonly biometric = inject(BiometricService);

  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly showUnlockPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly isShaking = signal<boolean>(false);

  pinDigits: string[] = ['', '', '', ''];

  setupForm!: FormGroup;
  unlockForm!: FormGroup;

  isSetupMode(): boolean {
    return !this.vaultState.isInitialized();
  }

  ngOnInit(): void {
    this.setupForm = this.fb.group(
      {
        masterPassword: ['', [Validators.required, VaultValidators.masterPassword()]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );

    this.unlockForm = this.fb.group({
      masterPassword: ['', [Validators.required, VaultValidators.masterPassword()]]
    });

    // Auto-prompt fingerprint unlock on launch if enabled
    if (!this.isSetupMode() && this.biometric.isEnabled()) {
      setTimeout(() => {
        this.triggerBiometricUnlock();
      }, 350);
    }
  }

  ngAfterViewInit(): void {
    if (!this.isSetupMode() && !this.biometric.isEnabled()) {
      setTimeout(() => {
        this.focusBox(0);
      }, 100);
    }
  }

  async triggerBiometricUnlock(): Promise<void> {
    if (this.isSubmitting() || this.biometric.isAuthenticating()) return;
    this.errorMessage.set('');

    const pin = await this.biometric.authenticateAndGetPin();
    if (pin) {
      this.isSubmitting.set(true);
      try {
        const ok = await this.vaultState.unlockVault(pin);
        if (!ok) {
          this.errorMessage.set('Fingerprint credentials did not match vault key. Please enter your PIN.');
          this.focusBox(0);
        }
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      this.focusBox(0);
    }
  }

  onSetupKeyDown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDigitBeforeInput(event: any): void {
    if (event.data && !/^\d+$/.test(event.data)) {
      event.preventDefault();
    }
  }

  onDigitKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.pinDigits[index] !== '') {
        this.pinDigits[index] = '';
        this.setInputValue(index, '');
        this.syncUnlockForm();
      } else if (index > 0) {
        this.pinDigits[index - 1] = '';
        this.setInputValue(index - 1, '');
        this.syncUnlockForm();
        this.focusBox(index - 1);
      }
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      if (this.pinDigits[index] !== '') {
        this.pinDigits[index] = '';
        this.setInputValue(index, '');
        this.syncUnlockForm();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusBox(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 3) {
      event.preventDefault();
      this.focusBox(index + 1);
      return;
    }

    // Allow navigation and shortcuts
    const allowed = ['Tab', 'Enter', 'Escape'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    // Disallow any non-numeric character
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value || '';
    const digitsOnly = rawValue.replace(/\D/g, '');

    // If multiple digits were pasted/inserted directly into input
    if (digitsOnly.length > 1) {
      this.populatePastedDigits(digitsOnly);
      return;
    }

    if (digitsOnly.length === 1) {
      this.pinDigits[index] = digitsOnly;
      input.value = digitsOnly;
      this.syncUnlockForm();

      if (this.pinDigits.every(d => d !== '')) {
        setTimeout(() => {
          this.onUnlockSubmit();
        }, 50);
      } else if (index < 3) {
        this.focusBox(index + 1);
      }
    } else {
      this.pinDigits[index] = '';
      input.value = '';
      this.syncUnlockForm();
    }
  }

  onDigitPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly) {
      this.populatePastedDigits(digitsOnly);
    }
  }

  private populatePastedDigits(digitsStr: string): void {
    const digits = digitsStr.slice(0, 4).split('');
    for (let i = 0; i < 4; i++) {
      this.pinDigits[i] = digits[i] || '';
      this.setInputValue(i, this.pinDigits[i]);
    }
    this.syncUnlockForm();

    if (this.pinDigits.every(d => d !== '')) {
      this.focusBox(3);
      setTimeout(() => {
        this.onUnlockSubmit();
      }, 50);
    } else {
      this.focusBox(Math.min(digits.length, 3));
    }
  }

  onDigitFocus(index: number): void {
    const el = this.pinInputs?.toArray()[index]?.nativeElement;
    if (el) {
      el.select();
    }
  }

  focusBox(index: number): void {
    const el = this.pinInputs?.toArray()[index]?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }

  private setInputValue(index: number, val: string): void {
    const el = this.pinInputs?.toArray()[index]?.nativeElement;
    if (el) {
      el.value = val;
    }
  }

  private syncUnlockForm(): void {
    const pin = this.pinDigits.join('');
    this.unlockForm.get('masterPassword')?.setValue(pin);
    this.unlockForm.get('masterPassword')?.markAsDirty();
    this.unlockForm.get('masterPassword')?.updateValueAndValidity();
  }

  clearPin(): void {
    this.pinDigits = ['', '', '', ''];
    this.pinInputs?.forEach(ref => {
      if (ref.nativeElement) {
        ref.nativeElement.value = '';
      }
    });
    this.syncUnlockForm();
    setTimeout(() => {
      this.focusBox(0);
    }, 50);
  }

  private triggerShake(): void {
    this.isShaking.set(true);
    setTimeout(() => {
      this.isShaking.set(false);
    }, 500);
  }

  private passwordMatchValidator(g: FormGroup) {
    const p1 = g.get('masterPassword')?.value;
    const p2 = g.get('confirmPassword')?.value;
    return p1 === p2 ? null : { mismatch: true };
  }

  passwordStrengthLabel(): string {
    const val = this.setupForm?.get('masterPassword')?.value || '';
    if (!val) return 'Empty';
    if (!/^\d+$/.test(val)) return 'Digits only';
    if (val.length < 4) return `${val.length}/4 digits`;
    if (/^(.)\1{3}$/.test(val)) return 'Fair (Repeated)';
    if (['0123', '1234', '2345', '3456', '4567', '5678', '6789'].includes(val)) return 'Fair (Sequential)';
    return 'Ready (4 Digits)';
  }

  passwordStrengthClass(): string {
    const val = this.setupForm?.get('masterPassword')?.value || '';
    if (!val) return '';
    if (!/^\d+$/.test(val) || val.length < 4) return 'weak';
    if (/^(.)\1{3}$/.test(val) || ['0123', '1234', '2345', '3456', '4567', '5678', '6789'].includes(val)) return 'fair';
    return 'strong';
  }

  async onSetupSubmit(): Promise<void> {
    if (this.setupForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const password = this.setupForm.get('masterPassword')?.value;
    try {
      await this.vaultState.setupVault(password);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onUnlockSubmit(): Promise<void> {
    if (this.unlockForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const password = this.unlockForm.get('masterPassword')?.value;
    try {
      const success = await this.vaultState.unlockVault(password);
      if (!success) {
        this.errorMessage.set('Incorrect master PIN. Please try again.');
        this.triggerShake();
        this.clearPin();
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onResetVaultClick(): Promise<void> {
    const confirmed = confirm('Are you sure you want to reset your vault? All locally encrypted records will be deleted.');
    if (confirmed) {
      await this.vaultState.resetEntireVault();
      this.setupForm.reset();
      this.unlockForm.reset();
      this.clearPin();
    }
  }
}
