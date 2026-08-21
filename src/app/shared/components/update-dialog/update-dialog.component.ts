import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AppUpdateService } from '../../../core/update/app-update.service';

@Component({
  selector: 'app-update-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div *ngIf="updateService.isModalOpen()" class="update-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div class="update-modal-card glass-panel-elevated">
        
        <!-- Header with Rocket Icon -->
        <div class="modal-header">
          <div class="icon-badge">
            <span class="material-symbols-outlined update-icon">system_update</span>
          </div>
          <div class="title-meta">
            <h2 class="modal-title">New Update Available</h2>
            <p class="modal-subtitle">A newer, faster, and more secure version of SecureVault is ready.</p>
          </div>
        </div>

        <!-- Version Comparison Badge Row -->
        <div class="version-row">
          <div class="version-badge installed">
            <span class="badge-label">Installed</span>
            <span class="badge-val">v{{ updateService.installedVersion() }}</span>
          </div>
          <span class="material-symbols-outlined arrow-icon">arrow_forward</span>
          <div class="version-badge latest">
            <span class="badge-label">Latest</span>
            <span class="badge-val">v{{ updateService.currentRelease()?.versionName }}</span>
          </div>
        </div>

        <!-- Release Notes Preview -->
        <div class="release-notes-section">
          <div class="notes-header">
            <span class="material-symbols-outlined notes-icon">description</span>
            <span>What's New in this Release:</span>
          </div>
          <div class="notes-body">
            <pre class="notes-content">{{ updateService.currentRelease()?.releaseNotes }}</pre>
          </div>
        </div>

        <!-- Permission Notice (Android 8.0+ Unknown App Sources) -->
        <div *ngIf="updateService.needsInstallPermission()" class="permission-alert animate-fade-in">
          <span class="material-symbols-outlined alert-icon">security</span>
          <div class="alert-content">
            <p class="alert-title">Installation Permission Required</p>
            <p class="alert-desc">Android requires permission to install app updates from this source.</p>
            <button type="button" class="btn-permission" (click)="updateService.openInstallSettings()">
              <span class="material-symbols-outlined">settings</span>
              <span>Open Android Settings</span>
            </button>
          </div>
        </div>

        <!-- Download Progress Bar -->
        <div *ngIf="updateService.isDownloading()" class="download-progress-container animate-fade-in">
          <div class="progress-meta">
            <span class="status-text">{{ updateService.downloadStatusText() }}</span>
            <span class="percent-text">{{ updateService.downloadProgress() }}%</span>
          </div>
          <div class="custom-progress-track">
            <div class="custom-progress-fill" [style.width.%]="updateService.downloadProgress()"></div>
          </div>
        </div>

        <!-- Error Message Banner -->
        <div *ngIf="updateService.errorMessage()" class="error-banner animate-fade-in">
          <span class="material-symbols-outlined">error</span>
          <span>{{ updateService.errorMessage() }}</span>
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <ng-container *ngIf="!updateService.isDownloading()">
            <button
              type="button"
              class="btn-primary flex-1"
              (click)="updateService.downloadAndInstall()"
            >
              <span class="material-symbols-outlined">download</span>
              <span>Update Now</span>
            </button>
            <button
              type="button"
              class="btn-secondary"
              (click)="updateService.dismissModal()"
            >
              <span>Later</span>
            </button>
          </ng-container>

          <ng-container *ngIf="updateService.isDownloading()">
            <button
              type="button"
              class="btn-secondary w-full"
              (click)="updateService.cancelDownload()"
            >
              <span class="material-symbols-outlined">close</span>
              <span>Cancel Download</span>
            </button>
          </ng-container>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .update-modal-backdrop {
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

    .update-modal-card {
      width: 100%;
      max-width: 480px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.15), 0 20px 40px rgba(0, 0, 0, 0.7);
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
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(129, 140, 248, 0.3) 100%);
      border: 1px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.25);
    }

    .update-icon {
      color: var(--primary);
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
      line-height: 1.35;
    }

    .version-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
    }

    .version-badge {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .badge-label {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-val {
      font-size: 0.95rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--text-secondary);
    }

    .version-badge.latest .badge-val {
      color: var(--primary);
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    }

    .arrow-icon {
      color: var(--text-muted);
      font-size: 20px;
    }

    .release-notes-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .notes-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .notes-icon {
      font-size: 16px;
      color: var(--primary);
    }

    .notes-body {
      max-height: 140px;
      overflow-y: auto;
      background: rgba(9, 13, 22, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
    }

    .notes-content {
      font-family: var(--font-sans);
      font-size: 0.82rem;
      color: var(--text-primary);
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }

    .download-progress-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
    }

    .progress-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .status-text {
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .percent-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--primary);
      font-family: var(--font-mono);
    }

    .custom-progress-track {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    .custom-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0284c7, #38bdf8);
      border-radius: 4px;
      transition: width 0.2s ease-out;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
    }

    .permission-alert {
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
      margin-top: 2px;
    }

    .alert-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
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
      margin: 0 0 8px 0;
      line-height: 1.35;
    }

    .btn-permission {
      align-self: flex-start;
      background: rgba(251, 191, 36, 0.2);
      border: 1px solid rgba(251, 191, 36, 0.5);
      border-radius: var(--radius-sm);
      color: #fde68a;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 6px 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .btn-permission:hover {
      background: rgba(251, 191, 36, 0.3);
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
      margin-top: 4px;
    }

    .flex-1 {
      flex: 1;
    }

    .w-full {
      width: 100%;
    }
  `]
})
export class UpdateDialogComponent {
  readonly updateService = inject(AppUpdateService);
}
