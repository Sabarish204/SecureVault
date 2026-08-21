import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { BackupInspectionResult } from '../../../shared/models/backup.model';

@Component({
  selector: 'app-restore-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  template: `
    <div class="restore-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div class="restore-modal-card glass-panel-elevated">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="icon-badge">
            <span class="material-symbols-outlined restore-icon">settings_backup_restore</span>
          </div>
          <div class="title-meta">
            <h2 class="modal-title">Restore Vault Backup?</h2>
            <p class="modal-subtitle">Verify backup details before replacing your local vault.</p>
          </div>
        </div>

        <!-- Backup Metadata Overview -->
        <div class="backup-meta-box">
          <div class="meta-row">
            <span class="meta-label">Backup Created:</span>
            <span class="meta-val">{{ inspection.createdAt | date:'medium' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Total Records:</span>
            <span class="meta-val font-mono highlight">{{ inspection.recordCount }} item(s)</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">App Version:</span>
            <span class="meta-val font-mono">v{{ inspection.appVersion }} (Format v{{ inspection.formatVersion }})</span>
          </div>
        </div>

        <!-- Warning Alert -->
        <div class="warning-alert">
          <span class="material-symbols-outlined alert-icon">warning</span>
          <div class="alert-text">
            <p class="alert-title">Existing Data Replacement</p>
            <p class="alert-desc">Restoring this backup will replace current vault records with the backup contents.</p>
          </div>
        </div>

        <!-- Safety Backup Option -->
        <div class="safety-option">
          <label class="checkbox-container">
            <input type="checkbox" [(ngModel)]="createSafetyBackup" />
            <span class="checkmark"></span>
            <span class="option-label">Create an automatic safety backup of my current vault before restoring</span>
          </label>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="error-banner animate-fade-in">
          <span class="material-symbols-outlined">error</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button
            type="button"
            class="btn-danger flex-1"
            [disabled]="isRestoring"
            (click)="confirm()"
          >
            <span class="material-symbols-outlined">settings_backup_restore</span>
            <span>{{ isRestoring ? 'Restoring Vault...' : 'Confirm & Restore' }}</span>
          </button>
          <button
            type="button"
            class="btn-secondary"
            [disabled]="isRestoring"
            (click)="cancel.emit()"
          >
            <span>Cancel</span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .restore-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 7, 13, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 9999;
    }

    .restore-modal-card {
      width: 100%;
      max-width: 480px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid rgba(239, 68, 68, 0.35);
      box-shadow: 0 0 35px rgba(239, 68, 68, 0.15), 0 20px 40px rgba(0, 0, 0, 0.7);
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .restore-icon {
      color: var(--danger);
      font-size: 28px;
    }

    .title-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
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

    .warning-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border-radius: var(--radius-sm);
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.35);
    }

    .alert-icon {
      color: var(--warning);
      font-size: 22px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #fde68a;
      margin: 0;
    }

    .alert-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.35;
    }

    .safety-option {
      padding: 4px 0;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .checkbox-container input {
      accent-color: var(--primary);
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      font-size: 0.8rem;
    }

    .modal-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 6px;
    }

    .flex-1 {
      flex: 1;
    }
  `]
})
export class RestoreConfirmDialogComponent {
  @Input({ required: true }) inspection!: BackupInspectionResult;
  @Input() isRestoring: boolean = false;
  @Input() errorMessage: string = '';

  @Output() restore = new EventEmitter<{ createSafetyBackup: boolean }>();
  @Output() cancel = new EventEmitter<void>();

  createSafetyBackup: boolean = true;

  confirm(): void {
    this.restore.emit({ createSafetyBackup: this.createSafetyBackup });
  }
}
