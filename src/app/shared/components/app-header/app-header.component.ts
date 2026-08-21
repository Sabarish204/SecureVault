import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { VaultStateService } from '../../../core/state/vault-state.service';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatTooltipModule, FormsModule],
  template: `
    <header class="app-header-container glass-panel">
      <div class="header-inner">
        <!-- Logo & Title -->
        <a routerLink="/dashboard" class="brand-link">
          <div class="logo-shield">
            <span class="material-symbols-outlined logo-icon">shield_lock</span>
          </div>
          <div class="brand-info">
            <span class="brand-name">SecureVault</span>
            <span class="brand-tag">LOCAL-FIRST</span>
          </div>
        </a>

        <!-- Middle: Global Search (Desktop/Tablet) -->
        <div class="header-search" *ngIf="vaultState.isUnlocked()">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search credentials, banks, cards..."
            [ngModel]="vaultState.searchQuery()"
            (ngModelChange)="vaultState.setSearchQuery($event)"
            class="header-search-input font-sans"
            aria-label="Search credentials"
          />
          <button
            *ngIf="vaultState.searchQuery()"
            type="button"
            class="clear-search-btn"
            (click)="vaultState.setSearchQuery('')"
            aria-label="Clear search"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Right Side: Install, Status Badge & Lock Action -->
        <div class="header-actions">
          <button
            *ngIf="pwa.canInstall()"
            type="button"
            class="install-btn"
            (click)="pwa.promptInstall()"
            matTooltip="Install SecureVault as app"
            aria-label="Install App"
          >
            <span class="material-symbols-outlined">install_mobile</span>
            <span class="install-btn-label">Install</span>
          </button>

          <div class="status-indicator" [class.unlocked]="vaultState.isUnlocked()" [class.locked]="!vaultState.isUnlocked()">
            <span class="status-dot"></span>
            <span class="status-text">{{ vaultState.isUnlocked() ? 'UNLOCKED' : 'LOCKED' }}</span>
          </div>

          <button
            *ngIf="vaultState.isUnlocked()"
            type="button"
            class="lock-btn"
            (click)="vaultState.lockVault('Vault locked by user.')"
            matTooltip="Lock Vault immediately"
            aria-label="Lock Vault"
          >
            <span class="material-symbols-outlined">lock</span>
            <span class="lock-btn-label">Lock</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header-container {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding-top: var(--safe-area-top);
      border-radius: 0;
      border-top: none;
      border-left: none;
      border-right: none;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(9, 13, 22, 0.95);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
    }

    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      height: 64px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }

    .logo-shield {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.3) 100%);
      border: 1px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
    }

    .logo-icon {
      color: var(--primary);
      font-size: 24px;
    }

    .brand-info {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 40%, var(--primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-tag {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .header-search {
      flex: 1;
      max-width: 420px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      font-size: 20px;
      pointer-events: none;
    }

    .header-search-input {
      width: 100%;
      height: 40px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 36px 0 38px;
      color: var(--text-primary);
      font-size: 0.88rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .header-search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
    }

    .clear-search-btn:hover {
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .status-indicator.unlocked {
      background: rgba(52, 211, 153, 0.12);
      border: 1px solid rgba(52, 211, 153, 0.3);
      color: #34d399;
    }

    .status-indicator.locked {
      background: rgba(251, 191, 36, 0.12);
      border: 1px solid rgba(251, 191, 36, 0.3);
      color: #fbbf24;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .install-btn {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: var(--radius-sm);
      height: 38px;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
      transition: all 0.2s ease;
    }

    .install-btn:hover {
      background: rgba(56, 189, 248, 0.25);
      border-color: var(--primary);
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
      transform: translateY(-1px);
    }

    .lock-btn {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-sm);
      height: 38px;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .lock-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }

    @media (max-width: 640px) {
      .header-search {
        display: none;
      }
      .lock-btn-label, .install-btn-label {
        display: none;
      }
      .lock-btn, .install-btn {
        padding: 0 8px;
      }
    }
  `]
})
export class AppHeaderComponent {
  readonly vaultState = inject(VaultStateService);
  readonly pwa = inject(PwaService);
}
