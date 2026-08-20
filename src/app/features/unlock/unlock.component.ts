import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VaultStateService } from '../../core/state/vault-state.service';
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
            {{ isSetupMode() ? 'Create Master Password' : 'Unlock SecureVault' }}
          </h1>
          <p class="hero-subtitle">
            {{ isSetupMode() 
              ? 'Your master password derives a 256-bit AES-GCM encryption key using PBKDF2 with 600,000 iterations. It is never stored or transmitted.' 
              : 'Enter your master password to decrypt and access your personal credentials.' 
            }}
          </p>
        </div>

        <!-- Security Test Data Notice -->
        <div class="test-data-banner">
          <span class="material-symbols-outlined" style="font-size: 16px;">verified_user</span>
          <span>Security Notice: Use ONLY test/dummy credentials</span>
        </div>

        <!-- Setup Form (First-Time User) -->
        <form *ngIf="isSetupMode()" [formGroup]="setupForm" (ngSubmit)="onSetupSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="newPassword">Master Password</label>
            <div class="input-container">
              <input
                id="newPassword"
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="masterPassword"
                placeholder="Enter strong master password (min 8 chars)"
                class="vault-input font-mono"
                autocomplete="new-password"
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
            <!-- Password Strength Bar -->
            <div class="strength-bar-wrapper">
              <div class="strength-meter" [ngClass]="passwordStrengthClass()"></div>
              <span class="strength-label">{{ passwordStrengthLabel() }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Master Password</label>
            <div class="input-container">
              <input
                id="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Re-enter master password"
                class="vault-input font-mono"
                autocomplete="new-password"
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
              Passwords do not match.
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

        <!-- Unlock Form (Existing Vault) -->
        <form *ngIf="!isSetupMode()" [formGroup]="unlockForm" (ngSubmit)="onUnlockSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="unlockPassword">Master Password</label>
            <div class="input-container">
              <input
                id="unlockPassword"
                [type]="showUnlockPassword() ? 'text' : 'password'"
                formControlName="masterPassword"
                placeholder="Enter your master password"
                class="vault-input font-mono"
                autocomplete="current-password"
                autofocus
              />
              <button
                type="button"
                class="visibility-btn"
                (click)="showUnlockPassword.set(!showUnlockPassword())"
                aria-label="Toggle password visibility"
              >
                <span class="material-symbols-outlined">
                  {{ showUnlockPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <div *ngIf="errorMessage()" class="form-error">
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
  `]
})
export class UnlockComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly vaultState = inject(VaultStateService);

  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly showUnlockPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

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
      masterPassword: ['', [Validators.required]]
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    const p1 = g.get('masterPassword')?.value;
    const p2 = g.get('confirmPassword')?.value;
    return p1 === p2 ? null : { mismatch: true };
  }

  passwordStrengthLabel(): string {
    const val = this.setupForm?.get('masterPassword')?.value || '';
    if (!val) return 'Empty';
    if (val.length < 8) return 'Weak';
    const hasNum = /\d/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    const hasUpper = /[A-Z]/.test(val);
    if (val.length >= 12 && hasNum && hasSpecial && hasUpper) return 'Strong';
    if (val.length >= 8 && (hasNum || hasSpecial)) return 'Good';
    return 'Fair';
  }

  passwordStrengthClass(): string {
    const label = this.passwordStrengthLabel().toLowerCase();
    return label;
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
        this.errorMessage.set('Incorrect master password. Please try again.');
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
    }
  }
}
