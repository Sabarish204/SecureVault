import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { VaultStateService } from '../../../core/state/vault-state.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav-container glass-panel" *ngIf="vaultState.isUnlocked()">
      <div class="bottom-nav-inner">
        <!-- Dashboard -->
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <span class="material-symbols-outlined nav-icon">dashboard</span>
          <span class="nav-label">Dashboard</span>
        </a>

        <!-- All Items -->
        <a routerLink="/items" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <span class="material-symbols-outlined nav-icon">folder</span>
          <span class="nav-label">Vault</span>
        </a>

        <!-- Add Item FAB Action -->
        <a routerLink="/items/new" routerLinkActive="active" class="nav-fab-item" aria-label="Add new item">
          <div class="fab-circle">
            <span class="material-symbols-outlined fab-icon">add</span>
          </div>
          <span class="nav-label">Add</span>
        </a>

        <!-- Search -->
        <a (click)="focusSearch()" class="nav-item search-tab" [class.active]="vaultState.searchQuery().length > 0">
          <span class="material-symbols-outlined nav-icon">search</span>
          <span class="nav-label">Search</span>
        </a>

        <!-- Settings -->
        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <span class="material-symbols-outlined nav-icon">settings</span>
          <span class="nav-label">Settings</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .bottom-nav-container {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 90;
      border-radius: 0;
      border-bottom: none;
      border-left: none;
      border-right: none;
      border-top: 1px solid var(--border-subtle);
      background: rgba(9, 13, 22, 0.92);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      padding-bottom: var(--safe-area-bottom);
    }

    .bottom-nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: var(--bottom-nav-height);
      max-width: 600px;
      margin: 0 auto;
      padding: 0 8px;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.72rem;
      font-weight: 600;
      min-width: 54px;
      height: 100%;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-icon {
      font-size: 24px;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .nav-item:hover, .nav-item.active {
      color: var(--primary);
    }

    .nav-item.active .nav-icon {
      transform: translateY(-2px);
      font-variation-settings: 'FILL' 1;
    }

    .nav-fab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 600;
      margin-top: -14px;
      cursor: pointer;
    }

    .fab-circle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(56, 189, 248, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .nav-fab-item:hover .fab-circle, .nav-fab-item.active .fab-circle {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(56, 189, 248, 0.6);
    }

    .fab-icon {
      font-size: 26px;
      font-weight: 700;
    }

    @media (min-width: 769px) {
      .bottom-nav-container {
        display: none;
      }
    }
  `]
})
export class BottomNavComponent {
  readonly vaultState = inject(VaultStateService);
  private readonly router = inject(Router);

  async focusSearch(): Promise<void> {
    if (!this.router.url.startsWith('/items') || this.router.url.startsWith('/items/')) {
      await this.router.navigate(['/items']);
    }

    setTimeout(() => {
      const searchInput = (document.getElementById('vaultSearchInput') ||
        document.querySelector('.filter-search-input') ||
        document.querySelector('.header-search-input')) as HTMLInputElement;

      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }
}
