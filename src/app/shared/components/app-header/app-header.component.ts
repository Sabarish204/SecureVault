import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { VaultStateService } from '../../../core/state/vault-state.service';
import { PwaService } from '../../../core/services/pwa.service';
import { GlobalSearchService, GlobalSearchResult } from '../../../core/services/global-search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <header class="app-header-container glass-panel" [class.mobile-search-active]="isMobileSearchOpen()">
      <div class="header-inner">
        <!-- Logo & Title (hidden on mobile when mobile search is expanded) -->
        <a routerLink="/dashboard" class="brand-link" *ngIf="!isMobileSearchOpen()">
          <div class="logo-shield">
            <span class="material-symbols-outlined logo-icon">shield_lock</span>
          </div>
          <div class="brand-info">
            <span class="brand-name">SecureVault</span>
            <span class="brand-tag">LOCAL-FIRST</span>
          </div>
        </a>

        <!-- Middle / Top: Global Omnibar Search (Desktop & Mobile) -->
        <div
          class="header-search-wrapper"
          *ngIf="vaultState.isUnlocked()"
          [class.mobile-expanded]="isMobileSearchOpen()"
          #searchWrapper
        >
          <!-- Mobile Back Button to collapse search -->
          <button
            *ngIf="isMobileSearchOpen()"
            type="button"
            class="btn-mobile-search-back"
            (click)="closeMobileSearch()"
            aria-label="Back"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>

          <div class="search-input-box">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              #searchInput
              id="headerGlobalSearchInput"
              type="text"
              class="header-search-input font-sans"
              placeholder="Search cards, banks, settings, PIN, actions..."
              [ngModel]="globalSearch.query()"
              (ngModelChange)="onQueryChange($event)"
              (focus)="onInputFocus()"
              (click)="onInputFocus()"
              autocomplete="off"
              spellcheck="false"
              aria-label="Global Omnibar Search"
            />

            <!-- Clear Query Button -->
            <button
              *ngIf="globalSearch.query()"
              type="button"
              class="clear-search-btn"
              (click)="onClearQuery()"
              aria-label="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>

            <!-- Desktop Shortcut Hint Chip -->
            <span class="search-shortcut-hint" *ngIf="!globalSearch.query() && !isMobileSearchOpen()">
              <kbd>Ctrl</kbd> <kbd>K</kbd>
            </span>
          </div>

          <!-- Instant Live Suggestions Categorized Dropdown -->
          <div
            class="global-search-dropdown animate-fade-in"
            *ngIf="globalSearch.isDropdownOpen() && (globalSearch.groupedResults().length > 0 || globalSearch.query().trim().length > 0)"
          >
            <!-- Results grouped by category -->
            <div *ngIf="globalSearch.groupedResults().length > 0" class="dropdown-scroll-content">
              <div *ngFor="let group of globalSearch.groupedResults()" class="result-group">
                <div class="group-header">
                  <span class="material-symbols-outlined group-header-icon">{{ group.icon }}</span>
                  <span class="group-header-label">{{ group.label }}</span>
                </div>

                <div class="group-items">
                  <div
                    *ngFor="let item of group.items"
                    class="search-result-row"
                    (click)="selectItem(item)"
                    role="button"
                    tabindex="0"
                  >
                    <div class="result-icon-box" [ngClass]="item.badgeClass">
                      <span class="material-symbols-outlined">{{ item.icon }}</span>
                    </div>

                    <div class="result-meta">
                      <div class="result-title-row">
                        <span class="result-title">{{ item.title }}</span>
                        <span class="result-badge" [ngClass]="item.badgeClass">{{ item.badge }}</span>
                      </div>
                      <span class="result-subtitle">{{ item.subtitle }}</span>
                    </div>

                    <span class="material-symbols-outlined result-arrow">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty Search Results State -->
            <div
              *ngIf="globalSearch.groupedResults().length === 0 && globalSearch.query().trim().length > 0"
              class="search-empty-state"
            >
              <span class="material-symbols-outlined empty-icon">search_off</span>
              <p class="empty-title">No matching results for "{{ globalSearch.query() }}"</p>
              <p class="empty-subtitle">Search for bank names, card types, customer IDs, PIN, or "add card"</p>
            </div>
          </div>
        </div>

        <!-- Right Side: Mobile Search Trigger, Install, Status Badge & Lock Action -->
        <div class="header-actions" *ngIf="!isMobileSearchOpen()">
          <!-- Mobile Search Trigger Button -->
          <button
            *ngIf="vaultState.isUnlocked()"
            type="button"
            class="mobile-search-trigger-btn"
            (click)="openMobileSearch()"
            aria-label="Open Global Search"
          >
            <span class="material-symbols-outlined">search</span>
          </button>

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
            (click)="vaultState.lockVault()"
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
      position: relative;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
      flex-shrink: 0;
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

    /* Omnibar Search Container */
    .header-search-wrapper {
      flex: 1;
      max-width: 500px;
      position: relative;
      display: flex;
      align-items: center;
      margin: 0 auto;
    }

    .search-input-box {
      width: 100%;
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
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 74px 0 38px;
      color: var(--text-primary);
      font-size: 0.86rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .header-search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
      background: rgba(15, 23, 42, 0.98);
    }

    .clear-search-btn {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s ease;
    }

    .clear-search-btn:hover {
      color: var(--text-primary);
    }

    .clear-search-btn .material-symbols-outlined {
      font-size: 18px;
    }

    .search-shortcut-hint {
      position: absolute;
      right: 10px;
      display: flex;
      align-items: center;
      gap: 3px;
      pointer-events: none;
    }

    .search-shortcut-hint kbd {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      font-size: 0.65rem;
      font-family: inherit;
      color: var(--text-muted);
      padding: 1px 4px;
    }

    /* Live Suggestions Dropdown */
    .global-search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      width: 100%;
      max-height: 460px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      background: rgba(9, 13, 22, 0.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: var(--radius-md);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.15);
      z-index: 1000;
      padding: 8px 0;
    }

    .dropdown-scroll-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-group {
      display: flex;
      flex-direction: column;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .group-header-icon {
      font-size: 15px;
      color: var(--primary);
    }

    .group-items {
      display: flex;
      flex-direction: column;
    }

    .search-result-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
    }

    .search-result-row:hover,
    .search-result-row:focus {
      background: rgba(56, 189, 248, 0.1);
      border-left-color: var(--primary);
      outline: none;
    }

    .result-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 20px;
    }

    .result-icon-box .material-symbols-outlined {
      font-size: 20px;
    }

    .result-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .result-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .result-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-subtitle {
      font-size: 0.74rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-badge {
      font-size: 0.64rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .result-arrow {
      color: var(--text-muted);
      font-size: 18px;
      opacity: 0.4;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }

    .search-result-row:hover .result-arrow {
      opacity: 1;
      color: var(--primary);
      transform: translateX(3px);
    }

    /* Badge & Icon Styling per category */
    .badge-credit {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #38bdf8;
    }

    .badge-debit {
      background: rgba(52, 211, 153, 0.15);
      border: 1px solid rgba(52, 211, 153, 0.35);
      color: #34d399;
    }

    .badge-banking {
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.35);
      color: #c084fc;
    }

    .badge-action {
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.35);
      color: #fbbf24;
    }

    .badge-setting {
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid rgba(148, 163, 184, 0.35);
      color: #cbd5e1;
    }

    .badge-backup {
      background: rgba(45, 212, 191, 0.15);
      border: 1px solid rgba(45, 212, 191, 0.35);
      color: #2dd4bf;
    }

    .badge-feedback {
      background: rgba(244, 114, 182, 0.15);
      border: 1px solid rgba(244, 114, 182, 0.35);
      color: #f472b6;
    }

    .badge-update {
      background: rgba(96, 165, 250, 0.15);
      border: 1px solid rgba(96, 165, 250, 0.35);
      color: #60a5fa;
    }

    .badge-other {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: var(--text-secondary);
    }

    /* Empty state */
    .search-empty-state {
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
    }

    .empty-icon {
      font-size: 36px;
      color: var(--text-muted);
      opacity: 0.6;
    }

    .empty-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .empty-subtitle {
      font-size: 0.74rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .mobile-search-trigger-btn {
      display: none;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      height: 38px;
      width: 38px;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mobile-search-trigger-btn:hover {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
    }

    .btn-mobile-search-back {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
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
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
    }

    .status-indicator.locked {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 6px currentColor;
    }

    .install-btn {
      background: rgba(56, 189, 248, 0.12);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.4);
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

    /* Mobile Responsive Optimizations */
    @media (max-width: 640px) {
      .header-inner {
        padding: 0 12px;
      }

      .mobile-search-trigger-btn {
        display: inline-flex;
      }

      .header-search-wrapper {
        display: none;
      }

      .header-search-wrapper.mobile-expanded {
        display: flex;
        width: 100%;
        max-width: 100%;
      }

      .header-search-input {
        padding-right: 36px;
      }

      .search-shortcut-hint {
        display: none;
      }

      .global-search-dropdown {
        position: fixed;
        top: calc(64px + var(--safe-area-top));
        left: 8px;
        right: 8px;
        width: auto;
        max-height: calc(100dvh - 120px);
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
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchWrapper') searchWrapper?: ElementRef<HTMLDivElement>;

  readonly vaultState = inject(VaultStateService);
  readonly pwa = inject(PwaService);
  readonly globalSearch = inject(GlobalSearchService);

  readonly isMobileSearchOpen = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.searchWrapper && !this.searchWrapper.nativeElement.contains(event.target as Node)) {
      this.globalSearch.closeDropdown();
      if (this.isMobileSearchOpen() && !this.globalSearch.query()) {
        this.isMobileSearchOpen.set(false);
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    // Ctrl+K or Cmd+K quick shortcut to search from anywhere
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      if (this.vaultState.isUnlocked()) {
        event.preventDefault();
        this.focusSearchInput();
      }
    } else if (event.key === 'Escape') {
      this.globalSearch.closeDropdown();
      if (this.isMobileSearchOpen()) {
        this.closeMobileSearch();
      }
    }
  }

  onInputFocus(): void {
    this.globalSearch.openDropdown();
  }

  onQueryChange(value: string): void {
    this.globalSearch.setQuery(value);
  }

  onClearQuery(): void {
    this.globalSearch.clearSearch();
    this.searchInput?.nativeElement.focus();
  }

  selectItem(item: GlobalSearchResult): void {
    this.globalSearch.executeResult(item);
    this.isMobileSearchOpen.set(false);
  }

  openMobileSearch(): void {
    this.isMobileSearchOpen.set(true);
    setTimeout(() => {
      this.focusSearchInput();
    }, 60);
  }

  closeMobileSearch(): void {
    this.isMobileSearchOpen.set(false);
    this.globalSearch.closeDropdown();
  }

  focusSearchInput(): void {
    if (window.innerWidth <= 640) {
      this.isMobileSearchOpen.set(true);
    }
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
        this.globalSearch.openDropdown();
      }
    }, 50);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const results = this.globalSearch.searchResults();
      if (results.length > 0) {
        this.selectItem(results[0]);
      }
    }
  }
}
