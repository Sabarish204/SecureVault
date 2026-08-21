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
import { RestoreConfirmDialogComponent } from '../../shared/components/restore-confirm-dialog/restore-confirm-dialog.component';
import { BackupInspectionResult } from '../../shared/models/backup.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, RestoreConfirmDialogComponent],
  template: `
    <div class="settings-wrapper animate-fade-in">
      <div class="settings-header">
        <h1 class="page-title">Vault Security & Settings</h1>
        <p class="page-desc">Manage cryptographic preferences and local persistence.</p>
      </div>

      <!-- Security Invariants Overview -->
      <div class="settings-card glass-panel-elevated">
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
      </div>

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
            <p class="subcard-desc">Create a secure AES-256-GCM encrypted backup package with zero plaintext secrets.</p>
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
              accept=".svbackup,.json,application/octet-stream"
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

      <!-- Danger Zone: Reset Vault -->
      <div class="settings-card glass-panel danger-zone">
        <div class="card-title-row">
          <span class="material-symbols-outlined" style="color: var(--danger);">warning</span>
          <h2 class="card-title" style="color: var(--danger);">Danger Zone</h2>
        </div>
        <p class="card-desc">Erase all encrypted records and reset your master password from this device.</p>

        <button type="button" class="btn-danger" (click)="resetVault()">
          <span class="material-symbols-outlined">delete_forever</span>
          <span>Reset Entire Vault</span>
        </button>
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
  `]
})
export class SettingsComponent {
  readonly vaultState = inject(VaultStateService);
  readonly pwa = inject(PwaService);
  readonly appUpdate = inject(AppUpdateService);
  readonly backupService = inject(VaultBackupService);
  private readonly storage = inject(VaultStorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly pendingInspection = signal<BackupInspectionResult | null>(null);
  readonly isRestoringBackup = signal<boolean>(false);
  readonly restoreErrorMessage = signal<string>('');
  private pendingBackupPasswordAttempt: string = '';

  async onManualUpdateCheck(): Promise<void> {
    const hasUpdate = await this.appUpdate.checkForUpdates(true);
    if (!hasUpdate) {
      this.snackBar.open(`SecureVault is up to date (v${this.appUpdate.installedVersion()}).`, 'Close', {
        duration: 3000,
        panelClass: 'snack-info'
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
      const password = prompt('Enter your Master Password to encrypt and sign this backup:');
      if (!password) {
        return;
      }

      const result = await this.backupService.exportBackup(password);
      this.snackBar.open(`Backup exported: ${result.filename} (${result.recordCount} records)`, 'Close', {
        duration: 4000,
        panelClass: 'snack-success'
      });
    } catch (err: any) {
      this.snackBar.open(err.message || 'Export failed.', 'Close', {
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
      const passwordAttempt = prompt('Enter the Master Password for this backup file:');
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
}
