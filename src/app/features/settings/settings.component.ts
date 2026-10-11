import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VaultStateService } from '../../core/state/vault-state.service';
import { VaultStorageService } from '../../core/persistence/vault-storage.service';
import { PwaService } from '../../core/services/pwa.service';
import { AppUpdateService } from '../../core/update/app-update.service';
import { VaultBackupService } from '../../core/backup/vault-backup.service';
import { BiometricService } from '../../core/services/biometric.service';
import { RestoreConfirmDialogComponent } from '../../shared/components/restore-confirm-dialog/restore-confirm-dialog.component';
import { BackupInspectionResult, ExportBackupResult } from '../../shared/models/backup.model';
import { FeedbackService } from '../../core/services/feedback.service';
import { NetworkStatusService } from '../../core/services/network-status.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, RestoreConfirmDialogComponent],
  template: `
    <div class="settings-wrapper animate-fade-in">
      <div class="settings-header">
        <h1 class="page-title">Vault Security & Settings</h1>
        <!-- <p class="page-desc">Manage cryptographic preferences and local persistence.</p> -->
      </div>

      <!-- Security Invariants Overview -->
      <!-- <div class="settings-card glass-panel-elevated">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">security</span>
          <h2 class="card-title">Cryptographic Architecture</h2>
        </div>

        <div class="specs-grid">
          <div class="spec-item">
            <span class="spec-label">Key Derivation</span>
            <span class="spec-val">PBKDF2-HMAC-SHA256</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">PBKDF2 Iterations</span>
            <span class="spec-val">600,000 rounds</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Cipher Algorithm</span>
            <span class="spec-val">AES-256-GCM (Authenticated)</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">IV / Nonce</span>
            <span class="spec-val">96-bit (Unique per record)</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Persistence Engine</span>
            <span class="spec-val">Local IndexedDB (No Plaintext)</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Master Key Lifetime</span>
            <span class="spec-val">Volatile memory only</span>
          </div>
        </div>
      </div> -->

      <!-- Auto-Lock Preferences -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">timer</span>
          <h2 class="card-title">Inactivity Auto-Lock</h2>
        </div>
        <p class="card-desc">Automatically dereferences memory encryption keys and locks vault when idle.</p>

        <div class="timeout-options">
          <button
            type="button"
            class="timeout-btn"
            [class.active]="vaultState.autoLockMinutes() === 1"
            (click)="setAutoLock(1)"
          >
            1 Minute
          </button>
          <button
            type="button"
            class="timeout-btn"
            [class.active]="vaultState.autoLockMinutes() === 3"
            (click)="setAutoLock(3)"
          >
            3 Minutes (Default)
          </button>
          <button
            type="button"
            class="timeout-btn"
            [class.active]="vaultState.autoLockMinutes() === 5"
            (click)="setAutoLock(5)"
          >
            5 Minutes
          </button>
          <button
            type="button"
            class="timeout-btn"
            [class.active]="vaultState.autoLockMinutes() === 10"
            (click)="setAutoLock(10)"
          >
            10 Minutes
          </button>
        </div>
      </div>

      <!-- Master Password / PIN Management -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">pin</span>
          <h2 class="card-title">Master Password / PIN</h2>
        </div>
        <p class="card-desc">Your 4-digit PIN secures your vault. You can change your 4-digit PIN at any time.</p>

        <div *ngIf="!showChangePinForm()" class="pin-status-box">
          <div class="pin-meta">
            <span class="pin-status-title">Vault Master PIN</span>
            <span class="pin-status-desc">4-Digit Master PIN active</span>
          </div>
          <button type="button" class="btn-secondary" (click)="openChangePinForm()">
            <span class="material-symbols-outlined">edit</span>
            <span>Change 4-Digit PIN</span>
          </button>
        </div>

        <div *ngIf="showChangePinForm()" class="change-pin-box">
          <div class="form-group">
            <label class="form-label" for="newSettingsPin">New 4-Digit PIN</label>
            <div class="input-container">
              <input
                id="newSettingsPin"
                [type]="showNewPin() ? 'text' : 'password'"
                [(ngModel)]="newPinValue"
                placeholder="Enter 4-digit PIN (e.g. 1234)"
                class="vault-input font-mono"
                maxlength="4"
                inputmode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                class="visibility-btn"
                (click)="showNewPin.set(!showNewPin())"
                aria-label="Toggle PIN visibility"
              >
                <span class="material-symbols-outlined">
                  {{ showNewPin() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmSettingsPin">Confirm New PIN</label>
            <div class="input-container">
              <input
                id="confirmSettingsPin"
                [type]="showConfirmPin() ? 'text' : 'password'"
                [(ngModel)]="confirmPinValue"
                placeholder="Re-enter 4-digit PIN"
                class="vault-input font-mono"
                maxlength="4"
                inputmode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                class="visibility-btn"
                (click)="showConfirmPin.set(!showConfirmPin())"
                aria-label="Toggle PIN visibility"
              >
                <span class="material-symbols-outlined">
                  {{ showConfirmPin() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <div *ngIf="pinErrorMessage()" class="form-error">
            {{ pinErrorMessage() }}
          </div>

          <div class="pin-actions">
            <button
              type="button"
              class="btn-primary"
              [disabled]="isChangingPin()"
              (click)="saveNewPin()"
            >
              <span class="material-symbols-outlined">check</span>
              <span>{{ isChangingPin() ? 'Updating...' : 'Save New PIN' }}</span>
            </button>
            <button
              type="button"
              class="btn-secondary"
              (click)="cancelChangePin()"
              [disabled]="isChangingPin()"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Biometric & Fingerprint Security -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">fingerprint</span>
          <h2 class="card-title">Biometric / {{ biometric.biometryName() }} Unlock</h2>
        </div>
        <p class="card-desc">
          Unlock your vault with your fingerprint. Your 4-digit Master PIN is encrypted using Android Keystore hardware protection.
        </p>

        <!-- Hardware Status Indicator -->
        <div class="biometric-status-banner" [class.available]="biometric.isHardwareAvailable()">
          <span class="material-symbols-outlined status-badge-icon">
            {{ biometric.isHardwareAvailable() ? 'verified_user' : 'sensors_off' }}
          </span>
          <div class="status-banner-info">
            <span class="status-banner-title">
              {{ biometric.isHardwareAvailable() ? biometric.biometryName() + ' Sensor Ready' : 'Biometric Sensor Unavailable' }}
            </span>
            <span class="status-banner-desc">
              {{ biometric.isHardwareAvailable()
                ? (biometric.hasEnrolledBiometrics() ? 'Biometrics enrolled and ready for hardware authentication' : 'No fingerprints enrolled in device settings')
                : 'Device does not report biometric hardware or permissions are required' }}
            </span>
          </div>
        </div>

        <!-- Biometric Activation Box -->
        <div class="pin-status-box">
          <div class="pin-meta">
            <span class="pin-status-title">Fingerprint Unlock</span>
            <span class="pin-status-desc" [style.color]="biometric.isEnabled() ? 'var(--success)' : 'var(--text-muted)'">
              {{ biometric.isEnabled() ? 'Active & Protected by Android Keystore' : 'Disabled — Requires PIN every time' }}
            </span>
          </div>
          
          <div *ngIf="biometric.isEnabled()">
            <button
              type="button"
              class="btn-danger-outline"
              (click)="onDisableBiometrics()"
              [disabled]="biometric.isAuthenticating()"
            >
              <span class="material-symbols-outlined">lock_reset</span>
              <span>Disable Fingerprint</span>
            </button>
          </div>

          <div *ngIf="!biometric.isEnabled()">
            <button
              type="button"
              class="btn-primary"
              (click)="openEnableBiometricModal()"
              [disabled]="biometric.isAuthenticating() || isEnablingBiometric()"
            >
              <span class="material-symbols-outlined">fingerprint</span>
              <span>Enable {{ biometric.biometryName() }}</span>
            </button>
          </div>
        </div>

        <!-- Enable Biometric Confirmation Form -->
        <div *ngIf="showEnableBiometricForm()" class="change-pin-box animate-fade-in">
          <div class="form-group">
            <label class="form-label" for="bioConfirmPin">Confirm Master PIN to Activate</label>
            <div class="input-container">
              <input
                id="bioConfirmPin"
                type="password"
                [(ngModel)]="enableBioPinValue"
                placeholder="Enter your 4-digit Master PIN"
                class="vault-input font-mono"
                maxlength="4"
                inputmode="numeric"
                pattern="[0-9]*"
              />
            </div>
            <p class="helper-text">
              Enter your current PIN once to authorize encryption into the device hardware Keystore.
            </p>
          </div>

          <div *ngIf="bioErrorMessage()" class="form-error">
            {{ bioErrorMessage() }}
          </div>

          <div class="pin-actions">
            <button
              type="button"
              class="btn-primary"
              [disabled]="isEnablingBiometric()"
              (click)="confirmEnableBiometric()"
            >
              <span class="material-symbols-outlined">fingerprint</span>
              <span>{{ isEnablingBiometric() ? 'Scanning Fingerprint...' : 'Scan Fingerprint & Activate' }}</span>
            </button>
            <button
              type="button"
              class="btn-secondary"
              (click)="cancelEnableBiometric()"
              [disabled]="isEnablingBiometric()"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- App Updates & Version Info -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">system_update</span>
          <h2 class="card-title">App Version & Updates</h2>
        </div>
        <p class="card-desc">Check GitHub Releases for the latest stable build and security patches.</p>

        <div class="pwa-status-box">
          <span class="material-symbols-outlined status-icon" style="color: var(--primary);">info</span>
          <div class="pwa-meta">
            <span class="pwa-status-title">Current Installed Version</span>
            <span class="pwa-status-desc font-mono">v{{ appUpdate.installedVersion() }} (Build {{ appUpdate.installedCode() }})</span>
          </div>
        </div>

        <button type="button" class="btn-secondary" (click)="onManualUpdateCheck()" [disabled]="appUpdate.isChecking()">
          <span class="material-symbols-outlined" [class.animate-spin]="appUpdate.isChecking()">sync</span>
          <span>{{ appUpdate.isChecking() ? 'Checking GitHub...' : 'Check for Updates' }}</span>
        </button>
      </div>

      <!-- Progressive Web App (PWA) & Offline Info -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">smartphone</span>
          <h2 class="card-title">Progressive Web App (PWA)</h2>
        </div>
        <p class="card-desc">Install SecureVault to your home screen for instant access and full offline availability.</p>

        <div class="pwa-status-box" [class.installed]="pwa.isInstalled()">
          <span class="material-symbols-outlined status-icon">
            {{ pwa.isInstalled() ? 'check_circle' : 'offline_pin' }}
          </span>
          <div class="pwa-meta">
            <span class="pwa-status-title">
              {{ pwa.isInstalled() ? 'Installed as Standalone App' : 'Service Worker & Offline Ready' }}
            </span>
            <span class="pwa-status-desc">
              {{ pwa.isInstalled() ? 'Running with zero browser chrome and high performance.' : 'Local vault works 100% offline without internet connection.' }}
            </span>
          </div>
        </div>

        <div *ngIf="pwa.canInstall()">
          <button type="button" class="btn-primary" (click)="pwa.promptInstall()">
            <span class="material-symbols-outlined">install_mobile</span>
            <span>Install SecureVault to Home Screen</span>
          </button>
        </div>

        <div *ngIf="pwa.isIos() && !pwa.isInstalled()" class="ios-install-hint">
          <span class="material-symbols-outlined" style="color: var(--warning); font-size: 18px;">info</span>
          <span><strong>iOS Safari:</strong> Tap the <strong>Share</strong> icon and select <strong>"Add to Home Screen"</strong>.</span>
        </div>
      </div>

      <!-- Backup & Restore -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">settings_backup_restore</span>
          <h2 class="card-title">Encrypted Backup & Restore</h2>
        </div>
        <p class="card-desc">Safely backup and restore your entire vault data in an encrypted, password-protected <code>.svbackup</code> file format.</p>

        <div class="backup-actions-grid">
          <!-- Export Backup -->
          <div class="backup-subcard">
            <div class="subcard-header">
              <span class="material-symbols-outlined" style="color: var(--primary);">cloud_download</span>
              <span class="subcard-title">Export Backup</span>
            </div>
            <!-- <p class="subcard-desc">Create a secure AES-256-GCM encrypted backup package with zero plaintext secrets.</p> -->
            <button
              type="button"
              class="btn-primary"
              (click)="onExportBackup()"
              [disabled]="backupService.isExporting()"
            >
              <span class="material-symbols-outlined" [class.animate-spin]="backupService.isExporting()">
                {{ backupService.isExporting() ? 'sync' : 'download' }}
              </span>
              <span>{{ backupService.isExporting() ? 'Encrypting...' : 'Export .svbackup File' }}</span>
            </button>
          </div>

          <!-- Restore Backup -->
          <div class="backup-subcard">
            <div class="subcard-header">
              <span class="material-symbols-outlined" style="color: var(--warning);">cloud_upload</span>
              <span class="subcard-title">Restore Backup</span>
            </div>
            <p class="subcard-desc">Restore your cards, banking details, and credentials from a previous <code>.svbackup</code> file.</p>
            
            <input
              #backupFileInput
              type="file"
              (change)="onBackupFileSelected($event)"
              accept=".svbackup,.json,text/plain,application/octet-stream,*/*"
              style="display: none;"
            />
            
            <button
              type="button"
              class="btn-secondary"
              (click)="backupFileInput.click()"
              [disabled]="backupService.isImporting()"
            >
              <span class="material-symbols-outlined" [class.animate-spin]="backupService.isImporting()">
                {{ backupService.isImporting() ? 'sync' : 'upload_file' }}
              </span>
              <span>{{ backupService.isImporting() ? 'Reading File...' : 'Select .svbackup File' }}</span>
            </button>
          </div>
        </div>

        <!-- Export Result Feedback Box -->
        <div *ngIf="lastExportResult()" class="export-result-card animate-fade-in">
          <div class="result-header">
            <div class="result-icon-badge">
              <span class="material-symbols-outlined">check_circle</span>
            </div>
            <div class="result-header-text">
              <div class="result-title-row">
                <h3 class="result-title">Backup Exported Successfully</h3>
                <span class="result-badge">{{ lastExportResult()!.isNative ? 'Mobile Storage' : 'Browser Download' }}</span>
              </div>
              <span class="result-filename font-mono">{{ lastExportResult()!.filename }}</span>
            </div>
            <button
              type="button"
              class="dismiss-btn"
              (click)="dismissExportResult()"
              aria-label="Dismiss export details"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Exact Location / Path Section -->
          <div class="result-path-box">
            <div class="path-header">
              <span class="material-symbols-outlined path-icon">folder_open</span>
              <span class="path-label">
                {{ lastExportResult()!.isNative ? 'Saved Mobile Location (Documents):' : 'Saved Desktop Location:' }}
              </span>
            </div>
            <div class="path-val-row">
              <code class="path-code font-mono">{{ lastExportResult()!.displayPath }}</code>
              <button
                type="button"
                class="btn-copy-path"
                (click)="copyExportPath()"
                [title]="hasCopiedPath() ? 'Copied!' : 'Copy full path to clipboard'"
              >
                <span class="material-symbols-outlined">{{ hasCopiedPath() ? 'done' : 'content_copy' }}</span>
                <span>{{ hasCopiedPath() ? 'Copied' : 'Copy Path' }}</span>
              </button>
            </div>
          </div>

          <!-- Metadata Tags -->
          <div class="result-meta-row">
            <span class="meta-tag">
              <span class="material-symbols-outlined">lock</span>
              AES-256-GCM
            </span>
            <span class="meta-tag highlight">
              <span class="material-symbols-outlined">database</span>
              {{ lastExportResult()!.recordCount }} Records
            </span>
            <span class="meta-tag">
              <span class="material-symbols-outlined">straighten</span>
              {{ formatBytes(lastExportResult()!.fileSizeBytes) }}
            </span>
          </div>

          <!-- Actions: View / Share & Inspection -->
          <div class="result-actions-row">
            <button
              type="button"
              class="btn-primary flex-1"
              (click)="onShareExportedFile()"
            >
              <span class="material-symbols-outlined">{{ lastExportResult()!.isNative ? 'share' : 'visibility' }}</span>
              <span>{{ lastExportResult()!.isNative ? 'View / Share Backup File' : 'View / Inspect File' }}</span>
            </button>

            <button
              type="button"
              class="btn-secondary"
              (click)="openExportInspection()"
            >
              <span class="material-symbols-outlined">info</span>
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Feedback & Suggestions -->
      <div class="settings-card glass-panel">
        <div class="card-title-row">
          <span class="material-symbols-outlined icon-accent">rate_review</span>
          <h2 class="card-title">Feedback & Suggestions</h2>
        </div>
        <p class="card-desc">
          Have an idea for a new feature, or found a bug? Send your suggestions.
        </p>

        <!-- Network Status Pill -->
        <div class="feedback-network-box" [class.offline]="!network.isOnline()">
          <span class="material-symbols-outlined status-dot-icon">
            {{ network.isOnline() ? 'wifi' : 'wifi_off' }}
          </span>
          <div class="network-status-meta">
            <span class="network-status-title">
              {{ network.isOnline() ? 'Connected to Internet' : 'Device is Offline' }}
            </span>
            <span class="network-status-desc">
              {{ network.isOnline()
                ? 'Online and ready to submit feedback.'
                : 'Connect to Wi-Fi or mobile data to submit suggestions.' }}
            </span>
          </div>
        </div>

        <div>
          <button
            type="button"
            class="btn-primary"
            (click)="openFeedbackModal()"
          >
            <span class="material-symbols-outlined">send</span>
            <span>Send Feedback or Suggestion</span>
          </button>
        </div>
      </div>

      <!-- Danger Zone: Reset Vault -->
      <div class="settings-card glass-panel danger-zone">
        <div class="card-title-row">
          <span class="material-symbols-outlined" style="color: var(--danger);">warning</span>
          <h2 class="card-title" style="color: var(--danger);">Danger Zone</h2>
        </div>
        <p class="card-desc">Erase all records and reset your master password from this device.</p>

        <button type="button" class="btn-danger" (click)="resetVault()">
          <span class="material-symbols-outlined">delete_forever</span>
          <span>Reset Entire Vault</span>
        </button>
      </div>
    </div>

    <!-- Restore Confirmation Modal Dialog -->
    <app-restore-confirm-dialog
      *ngIf="pendingInspection()"
      [inspection]="pendingInspection()!"
      [isRestoring]="isRestoringBackup()"
      [errorMessage]="restoreErrorMessage()"
      (restore)="onConfirmRestore($event)"
      (cancel)="onCancelRestore()"
    ></app-restore-confirm-dialog>

    <!-- Export Inspection Modal Dialog -->
    <div *ngIf="showExportInspectionModal() && lastExportResult()" class="restore-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div class="restore-modal-card glass-panel-elevated">
        
        <div class="modal-header">
          <div class="icon-badge" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4);">
            <span class="material-symbols-outlined" style="color: var(--success); font-size: 28px;">verified_user</span>
          </div>
          <div class="title-meta">
            <h2 class="modal-title">Backup Verification</h2>
            <p class="modal-subtitle">Cryptographic envelope generated & validated.</p>
          </div>
        </div>

        <div class="backup-meta-box">
          <div class="meta-row">
            <span class="meta-label">File Name:</span>
            <span class="meta-val font-mono" style="word-break: break-all; font-size: 0.76rem;">{{ lastExportResult()!.filename }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Location:</span>
            <span class="meta-val font-mono" style="word-break: break-all; color: var(--primary); font-size: 0.76rem;">{{ lastExportResult()!.displayPath }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Created At:</span>
            <span class="meta-val">{{ lastExportResult()!.createdAt | date:'medium' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Total Records:</span>
            <span class="meta-val font-mono highlight">{{ lastExportResult()!.recordCount }} item(s)</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">File Size:</span>
            <span class="meta-val font-mono">{{ formatBytes(lastExportResult()!.fileSizeBytes) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Encryption:</span>
            <span class="meta-val font-mono">AES-256-GCM (PBKDF2 600,000 rds)</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Backup UUID:</span>
            <span class="meta-val font-mono" style="font-size: 0.72rem; color: var(--text-muted);">{{ lastExportResult()!.backupId }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button
            *ngIf="lastExportResult()!.isNative"
            type="button"
            class="btn-primary flex-1"
            (click)="onShareExportedFile()"
          >
            <span class="material-symbols-outlined">share</span>
            <span>View / Share File</span>
          </button>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeExportInspection()"
          >
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>

  `,
  styles: [`
    .settings-wrapper {
      max-width: 760px;
      margin: 0 auto;
      padding: 20px 16px 80px 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .settings-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .page-desc {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .settings-card {
      padding: 22px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon-accent {
      color: var(--primary);
      font-size: 24px;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .card-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .specs-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 14px;
    }

    @media (min-width: 600px) {
      .specs-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .spec-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .spec-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .spec-val {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .timeout-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    @media (min-width: 600px) {
      .timeout-options {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .timeout-btn {
      padding: 10px 8px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .timeout-btn:hover {
      color: var(--text-primary);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .timeout-btn.active {
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      font-weight: 700;
    }

    .pwa-status-box {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
    }

    .pwa-status-box.installed {
      border-color: rgba(52, 211, 153, 0.3);
      background: rgba(52, 211, 153, 0.05);
    }

    .pwa-status-box .status-icon {
      font-size: 28px;
      color: var(--primary);
    }

    .pwa-status-box.installed .status-icon {
      color: var(--success);
    }

    .pwa-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .pwa-status-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .pwa-status-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .ios-install-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: rgba(251, 191, 36, 0.08);
      border: 1px dashed rgba(251, 191, 36, 0.3);
      font-size: 0.82rem;
      color: #fde68a;
    }

    .backup-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 6px;
    }

    .backup-subcard {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .subcard-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subcard-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .subcard-desc {
      font-size: 0.78rem;
      color: var(--text-secondary);
      line-height: 1.4;
      flex: 1;
    }

    .danger-zone {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.04);
    }

    .pin-status-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }

    .pin-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .pin-status-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .pin-status-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .change-pin-box {
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 16px;
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
      height: 44px;
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

    .form-error {
      font-size: 0.8rem;
      color: var(--danger);
    }

    .pin-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }

    .biometric-status-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
    }

    .biometric-status-banner.available {
      border-color: rgba(34, 197, 94, 0.3);
      background: rgba(34, 197, 94, 0.06);
    }

    .status-badge-icon {
      font-size: 22px;
      color: var(--text-muted);
    }

    .biometric-status-banner.available .status-badge-icon {
      color: var(--success);
    }

    .status-banner-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-banner-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .status-banner-desc {
      font-size: 0.76rem;
      color: var(--text-secondary);
    }

    .btn-danger-outline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: var(--danger);
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.15);
      border-color: var(--danger);
    }

    .helper-text {
      font-size: 0.76rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .export-result-card {
      margin-top: 16px;
      padding: 16px;
      border-radius: var(--radius-sm);
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.35);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .result-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--success);
    }

    .result-header-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .result-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .result-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .result-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .result-filename {
      font-size: 0.78rem;
      color: var(--text-secondary);
      word-break: break-all;
    }

    .dismiss-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: color 0.2s ease;
    }

    .dismiss-btn:hover {
      color: var(--text-primary);
    }

    .result-path-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .path-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .path-icon {
      font-size: 16px;
      color: var(--primary);
    }

    .path-label {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .path-val-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .path-code {
      font-size: 0.78rem;
      color: #38bdf8;
      word-break: break-all;
      flex: 1;
      min-width: 0;
    }

    .btn-copy-path {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.74rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .btn-copy-path:hover {
      background: rgba(255, 255, 255, 0.12);
      color: var(--text-primary);
    }

    .btn-copy-path .material-symbols-outlined {
      font-size: 14px;
    }

    .result-meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .meta-tag.highlight {
      color: var(--primary);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .meta-tag .material-symbols-outlined {
      font-size: 13px;
    }

    .result-actions-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }

    .feedback-network-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: rgba(34, 197, 94, 0.06);
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .feedback-network-box.offline {
      background: rgba(251, 191, 36, 0.08);
      border-color: rgba(251, 191, 36, 0.35);
    }

    .feedback-network-box .status-dot-icon {
      color: var(--success);
      font-size: 22px;
    }

    .feedback-network-box.offline .status-dot-icon {
      color: var(--warning);
    }

    .network-status-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .network-status-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .network-status-desc {
      font-size: 0.76rem;
      color: var(--text-secondary);
    }

    .restore-modal-backdrop {
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
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
      z-index: 9999;
    }

    .restore-modal-card {
      width: 100%;
      max-width: 480px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid rgba(56, 189, 248, 0.35);
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.15), 0 20px 40px rgba(0, 0, 0, 0.7);
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .backup-meta-box {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;
    }

    .meta-label {
      color: var(--text-muted);
    }

    .meta-val {
      color: var(--text-primary);
      font-weight: 600;
    }

    .meta-val.highlight {
      color: var(--primary);
    }

    .modal-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 6px;
    }
  `]
})
export class SettingsComponent {
  readonly vaultState = inject(VaultStateService);
  readonly biometric = inject(BiometricService);
  readonly pwa = inject(PwaService);
  readonly appUpdate = inject(AppUpdateService);
  readonly backupService = inject(VaultBackupService);
  private readonly storage = inject(VaultStorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly lastExportResult = signal<ExportBackupResult | null>(null);
  readonly showExportInspectionModal = signal<boolean>(false);
  readonly hasCopiedPath = signal<boolean>(false);

  readonly network = inject(NetworkStatusService);
  readonly feedbackService = inject(FeedbackService);

  readonly pendingInspection = signal<BackupInspectionResult | null>(null);
  readonly isRestoringBackup = signal<boolean>(false);
  readonly restoreErrorMessage = signal<string>('');
  private pendingBackupPasswordAttempt: string = '';

  // 4-Digit Master PIN Management
  readonly showChangePinForm = signal<boolean>(false);
  readonly showNewPin = signal<boolean>(false);
  readonly showConfirmPin = signal<boolean>(false);
  readonly isChangingPin = signal<boolean>(false);
  readonly pinErrorMessage = signal<string>('');
  newPinValue: string = '';
  confirmPinValue: string = '';

  // Biometric Management
  readonly showEnableBiometricForm = signal<boolean>(false);
  readonly isEnablingBiometric = signal<boolean>(false);
  readonly bioErrorMessage = signal<string>('');
  enableBioPinValue: string = '';

  openEnableBiometricModal(): void {
    this.enableBioPinValue = '';
    this.bioErrorMessage.set('');
    this.showEnableBiometricForm.set(true);
  }

  cancelEnableBiometric(): void {
    this.enableBioPinValue = '';
    this.bioErrorMessage.set('');
    this.showEnableBiometricForm.set(false);
  }

  async confirmEnableBiometric(): Promise<void> {
    const pin = (this.enableBioPinValue || '').trim();
    if (!/^\d{4}$/.test(pin)) {
      this.bioErrorMessage.set('Please enter your 4-digit Master PIN.');
      return;
    }

    this.isEnablingBiometric.set(true);
    this.bioErrorMessage.set('');
    try {
      const success = await this.biometric.enableBiometric(pin);
      if (success) {
        this.cancelEnableBiometric();
      }
    } finally {
      this.isEnablingBiometric.set(false);
    }
  }

  async onDisableBiometrics(): Promise<void> {
    const confirmed = confirm('Disable fingerprint unlock? You will need to enter your 4-digit PIN to access your vault.');
    if (confirmed) {
      await this.biometric.disableBiometric();
    }
  }

  openChangePinForm(): void {
    this.newPinValue = '';
    this.confirmPinValue = '';
    this.pinErrorMessage.set('');
    this.showChangePinForm.set(true);
  }

  cancelChangePin(): void {
    this.newPinValue = '';
    this.confirmPinValue = '';
    this.pinErrorMessage.set('');
    this.showChangePinForm.set(false);
  }

  async saveNewPin(): Promise<void> {
    const p1 = (this.newPinValue || '').trim();
    const p2 = (this.confirmPinValue || '').trim();

    if (!/^\d{4}$/.test(p1)) {
      this.pinErrorMessage.set('Master PIN must be exactly 4 digits (0-9).');
      return;
    }

    if (p1 !== p2) {
      this.pinErrorMessage.set('PINs do not match.');
      return;
    }

    this.isChangingPin.set(true);
    this.pinErrorMessage.set('');
    try {
      const ok = await this.vaultState.changeMasterPassword(p1);
      if (ok) {
        this.cancelChangePin();
      }
    } finally {
      this.isChangingPin.set(false);
    }
  }

  async onManualUpdateCheck(): Promise<void> {
    const result = await this.appUpdate.checkForUpdates(true);
    if (result.status === 'UP_TO_DATE') {
      this.snackBar.open(`SecureVault is up to date (v${this.appUpdate.installedVersion()}).`, 'Close', {
        duration: 3000,
        panelClass: 'snack-info'
      });
    } else if (result.status === 'CHECK_FAILED') {
      this.snackBar.open(result.message || 'Unable to check for updates. Please check your internet connection.', 'Close', {
        duration: 4000,
        panelClass: 'snack-error'
      });
    }
  }

  setAutoLock(minutes: number): void {
    this.vaultState.autoLockMinutes.set(minutes);
    this.snackBar.open(`Auto-lock timeout set to ${minutes} min.`, 'Close', {
      duration: 2500,
      panelClass: 'snack-info'
    });
  }

  async onExportBackup(): Promise<void> {
    try {
      const password = prompt('Enter your 4-digit Master PIN / Password to encrypt and sign this backup:');
      if (!password) {
        return;
      }

      const result = await this.backupService.exportBackup(password);
      this.lastExportResult.set(result);
      this.hasCopiedPath.set(false);

      if (result.isNative) {
        const snack = this.snackBar.open(
          `Backup exported: ${result.filename}`,
          'View / Share',
          {
            duration: 6000,
            panelClass: 'snack-success'
          }
        );
        snack.onAction().subscribe(() => {
          this.onShareExportedFile();
        });
      } else {
        const snack = this.snackBar.open(
          `Backup exported: ${result.filename} (Downloads folder)`,
          'Details',
          {
            duration: 5000,
            panelClass: 'snack-success'
          }
        );
        snack.onAction().subscribe(() => {
          this.openExportInspection();
        });
      }
    } catch (err: any) {
      this.snackBar.open(err.message || 'Export failed.', 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
    }
  }

  dismissExportResult(): void {
    this.lastExportResult.set(null);
  }

  copyExportPath(): void {
    const result = this.lastExportResult();
    if (!result) return;
    const path = result.uri ? result.uri.replace('file://', '') : result.displayPath;
    navigator.clipboard.writeText(path).then(() => {
      this.hasCopiedPath.set(true);
      this.snackBar.open('File path copied to clipboard!', 'Close', {
        duration: 2500,
        panelClass: 'snack-info'
      });
      setTimeout(() => this.hasCopiedPath.set(false), 3000);
    });
  }

  openExportInspection(): void {
    this.showExportInspectionModal.set(true);
  }

  closeExportInspection(): void {
    this.showExportInspectionModal.set(false);
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async onShareExportedFile(): Promise<void> {
    const result = this.lastExportResult();
    if (!result) return;
    try {
      const shared = await this.backupService.shareOrViewBackup(result);
      if (!shared && !result.isNative) {
        this.openExportInspection();
      }
    } catch (err: any) {
      this.snackBar.open('Unable to open share sheet: ' + (err.message || err), 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
    }
  }

  async onBackupFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    try {
      const text = await file.text();
      const passwordAttempt = prompt('Enter the 4-digit Master PIN / Password for this backup file:');
      if (!passwordAttempt) {
        input.value = '';
        return;
      }

      this.pendingBackupPasswordAttempt = passwordAttempt;
      const inspection = await this.backupService.inspectBackupFile(text, passwordAttempt);

      if (!inspection.isValid) {
        this.snackBar.open(inspection.errorMessage || 'Invalid backup file or incorrect password.', 'Close', {
          duration: 4000,
          panelClass: 'snack-error'
        });
        input.value = '';
        return;
      }

      this.restoreErrorMessage.set('');
      this.pendingInspection.set(inspection);
    } catch (err: any) {
      this.snackBar.open('Failed to read backup file: ' + err.message, 'Close', {
        duration: 3500,
        panelClass: 'snack-error'
      });
    } finally {
      input.value = '';
    }
  }

  async onConfirmRestore(options: { createSafetyBackup: boolean }): Promise<void> {
    const inspection = this.pendingInspection();
    if (!inspection || !inspection.decryptedPayload) {
      return;
    }

    this.isRestoringBackup.set(true);
    this.restoreErrorMessage.set('');

    try {
      const result = await this.backupService.restoreBackup(
        inspection.decryptedPayload,
        this.pendingBackupPasswordAttempt,
        { createSafetyBackup: options.createSafetyBackup }
      );

      this.pendingInspection.set(null);
      this.pendingBackupPasswordAttempt = '';

      this.snackBar.open(`Vault successfully restored (${result.restoredCount} items recovered).`, 'Close', {
        duration: 4500,
        panelClass: 'snack-success'
      });
    } catch (err: any) {
      this.restoreErrorMessage.set(err.message || 'Restoration failed.');
    } finally {
      this.isRestoringBackup.set(false);
    }
  }

  onCancelRestore(): void {
    this.pendingInspection.set(null);
    this.pendingBackupPasswordAttempt = '';
    this.restoreErrorMessage.set('');
  }

  async resetVault(): Promise<void> {
    const confirmed = confirm('WARNING: Are you absolutely sure you want to reset your vault? All local records will be deleted.');
    if (confirmed) {
      await this.vaultState.resetEntireVault();
    }
  }

  async openFeedbackModal(): Promise<void> {
    const isOnline = await this.network.checkConnectivity();
    if (!isOnline) {
      this.snackBar.open('You are currently offline. Please connect to Wi-Fi or mobile data to send feedback.', 'Close', {
        duration: 4000,
        panelClass: 'snack-info'
      });
      return;
    }
    this.feedbackService.open();
  }
}
