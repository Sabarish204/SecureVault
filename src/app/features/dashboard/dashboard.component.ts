import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { VaultStateService } from '../../core/state/vault-state.service';
import { VaultCategory } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatChipsModule],
  template: `
    <div class="dashboard-wrapper animate-fade-in">
      <!-- Top Overview Hero -->
      <section class="dashboard-hero">
        <div class="hero-text-block">
          <h1 class="page-title">Personal Vault</h1>
          <p class="page-desc">Locally encrypted credentials, banking accounts & payment cards</p>
        </div>

        <div class="test-data-banner">
          <span class="material-symbols-outlined" style="font-size: 16px;">shield</span>
          <span>TEST DATA ONLY</span>
        </div>
      </section>

      <!-- Category Summary Counters Grid -->
      <section class="metrics-grid">
        <!-- Total Items -->
        <div class="metric-card glass-panel" (click)="filterCategory('ALL')" [class.active]="vaultState.selectedCategory() === 'ALL'">
          <div class="metric-icon-box total-box">
            <span class="material-symbols-outlined">shield_lock</span>
          </div>
          <div class="metric-info">
            <span class="metric-count">{{ vaultState.categoryCounts().total }}</span>
            <span class="metric-label">Total Items</span>
          </div>
        </div>

        <!-- Banking Accounts -->
        <div class="metric-card glass-panel" (click)="filterCategory('BANKING')" [class.active]="vaultState.selectedCategory() === 'BANKING'">
          <div class="metric-icon-box banking-box">
            <span class="material-symbols-outlined">account_balance</span>
          </div>
          <div class="metric-info">
            <span class="metric-count">{{ vaultState.categoryCounts().banking }}</span>
            <span class="metric-label">Banking</span>
          </div>
        </div>

        <!-- Credit Cards -->
        <div class="metric-card glass-panel" (click)="filterCategory('CREDIT_CARD')" [class.active]="vaultState.selectedCategory() === 'CREDIT_CARD'">
          <div class="metric-icon-box credit-box">
            <span class="material-symbols-outlined">credit_card</span>
          </div>
          <div class="metric-info">
            <span class="metric-count">{{ vaultState.categoryCounts().creditCard }}</span>
            <span class="metric-label">Credit Cards</span>
          </div>
        </div>

        <!-- Debit Cards -->
        <div class="metric-card glass-panel" (click)="filterCategory('DEBIT_CARD')" [class.active]="vaultState.selectedCategory() === 'DEBIT_CARD'">
          <div class="metric-icon-box debit-box">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <div class="metric-info">
            <span class="metric-count">{{ vaultState.categoryCounts().debitCard }}</span>
            <span class="metric-label">Debit Cards</span>
          </div>
        </div>
      </section>

      <!-- Quick Add Actions CTA -->
      <section class="quick-add-section glass-panel">
        <div class="quick-add-header">
          <span class="section-title">Add New Item</span>
          <span class="section-subtitle">Select category to store</span>
        </div>
        <div class="quick-add-buttons">
          <a routerLink="/items/new" [queryParams]="{ category: 'BANKING' }" class="add-tile banking-tile">
            <span class="material-symbols-outlined tile-icon">account_balance</span>
            <div class="tile-meta">
              <span class="tile-title">Internet Banking</span>
              <span class="tile-desc">Logins, URLs & credentials</span>
            </div>
            <span class="material-symbols-outlined chevron">arrow_forward</span>
          </a>

          <a routerLink="/items/new" [queryParams]="{ category: 'CREDIT_CARD' }" class="add-tile credit-tile">
            <span class="material-symbols-outlined tile-icon">credit_card</span>
            <div class="tile-meta">
              <span class="tile-title">Credit Card</span>
              <span class="tile-desc">Cardholder, CVV, PIN & expiry</span>
            </div>
            <span class="material-symbols-outlined chevron">arrow_forward</span>
          </a>

          <a routerLink="/items/new" [queryParams]="{ category: 'DEBIT_CARD' }" class="add-tile debit-tile">
            <span class="material-symbols-outlined tile-icon">payments</span>
            <div class="tile-meta">
              <span class="tile-title">Debit Card</span>
              <span class="tile-desc">Bank card details with PIN</span>
            </div>
            <span class="material-symbols-outlined chevron">arrow_forward</span>
          </a>
        </div>
      </section>

      <!-- Mobile Search Bar -->
      <section class="mobile-search-section">
        <div class="search-input-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search items by name, bank, or username..."
            [ngModel]="vaultState.searchQuery()"
            (ngModelChange)="vaultState.setSearchQuery($event)"
            class="mobile-search-input font-sans"
          />
          <button
            *ngIf="vaultState.searchQuery()"
            type="button"
            class="clear-btn"
            (click)="vaultState.setSearchQuery('')"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </section>

      <!-- Category Filter Chips -->
      <div class="chips-container">
        <button
          type="button"
          class="filter-chip"
          [class.active]="vaultState.selectedCategory() === 'ALL'"
          (click)="filterCategory('ALL')"
        >
          All ({{ vaultState.categoryCounts().total }})
        </button>
        <button
          type="button"
          class="filter-chip"
          [class.active]="vaultState.selectedCategory() === 'BANKING'"
          (click)="filterCategory('BANKING')"
        >
          Banking ({{ vaultState.categoryCounts().banking }})
        </button>
        <button
          type="button"
          class="filter-chip"
          [class.active]="vaultState.selectedCategory() === 'CREDIT_CARD'"
          (click)="filterCategory('CREDIT_CARD')"
        >
          Credit ({{ vaultState.categoryCounts().creditCard }})
        </button>
        <button
          type="button"
          class="filter-chip"
          [class.active]="vaultState.selectedCategory() === 'DEBIT_CARD'"
          (click)="filterCategory('DEBIT_CARD')"
        >
          Debit ({{ vaultState.categoryCounts().debitCard }})
        </button>
      </div>

      <!-- Items Section -->
      <section class="items-section">
        <div class="items-header">
          <h2 class="section-heading">Saved Items ({{ vaultState.filteredItems().length }})</h2>
          <a routerLink="/items" class="view-all-link" *ngIf="vaultState.items().length > 0">
            View All
            <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
          </a>
        </div>

        <!-- Empty State -->
        <div *ngIf="vaultState.filteredItems().length === 0" class="empty-state glass-panel">
          <div class="empty-icon-circle">
            <span class="material-symbols-outlined empty-icon">folder_open</span>
          </div>
          <h3 class="empty-title">
            {{ vaultState.searchQuery() ? 'No matching items found' : 'Your vault is empty' }}
          </h3>
          <p class="empty-text">
            {{ vaultState.searchQuery() 
              ? 'Try changing your search query or category filter.' 
              : 'Add your first internet banking account or payment card using the options above.' 
            }}
          </p>
          <a routerLink="/items/new" class="btn-primary" style="margin-top: 12px; text-decoration: none;">
            <span class="material-symbols-outlined">add</span>
            Add Item
          </a>
        </div>

        <!-- Items Cards List -->
        <div class="items-list" *ngIf="vaultState.filteredItems().length > 0">
          <div
            *ngFor="let item of vaultState.filteredItems()"
            class="item-card glass-panel"
            [routerLink]="['/items', item.id]"
          >
            <div class="item-icon-circle" [ngClass]="getCategoryClass(item.category)">
              <span class="material-symbols-outlined">{{ getCategoryIcon(item.category) }}</span>
            </div>

            <div class="item-details">
              <div class="item-title-row">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-category-tag" [ngClass]="getCategoryClass(item.category)">
                  {{ formatCategory(item.category) }}
                </span>
              </div>
              <span class="item-subtitle font-mono">{{ item.subtitle }}</span>
            </div>

            <span class="material-symbols-outlined item-arrow">chevron_right</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px 16px 80px 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dashboard-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-text-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0;
    }

    .page-desc {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    @media (min-width: 600px) {
      .metrics-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .metric-card {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .metric-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateY(-2px);
      box-shadow: var(--shadow-neon);
    }

    .metric-card.active {
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.12);
    }

    .metric-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .total-box {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
    }

    .banking-box {
      background: rgba(129, 140, 248, 0.15);
      color: var(--accent);
    }

    .credit-box {
      background: rgba(251, 191, 36, 0.15);
      color: var(--warning);
    }

    .debit-box {
      background: rgba(52, 211, 153, 0.15);
      color: var(--success);
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-count {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .metric-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .quick-add-section {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .quick-add-header {
      display: flex;
      flex-direction: column;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .section-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .quick-add-buttons {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    @media (min-width: 600px) {
      .quick-add-buttons {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .add-tile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
    }

    .add-tile:hover {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .tile-icon {
      font-size: 24px;
      color: var(--primary);
    }

    .banking-tile .tile-icon { color: var(--accent); }
    .credit-tile .tile-icon { color: var(--warning); }
    .debit-tile .tile-icon { color: var(--success); }

    .tile-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .tile-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .tile-desc {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .chevron {
      color: var(--text-muted);
      font-size: 18px;
    }

    .mobile-search-section {
      width: 100%;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      font-size: 20px;
    }

    .mobile-search-input {
      width: 100%;
      height: 46px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 38px 0 38px;
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .mobile-search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      padding: 4px;
    }

    .chips-container {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .filter-chip {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-chip:hover {
      color: var(--text-primary);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .filter-chip.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 700;
    }

    .items-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-heading {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .view-all-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--primary);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }

    .empty-icon {
      font-size: 28px;
      color: var(--text-muted);
    }

    .empty-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .empty-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
      max-width: 360px;
      margin: 0;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .item-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateX(4px);
    }

    .item-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-icon-circle.cat-banking {
      background: rgba(129, 140, 248, 0.15);
      color: var(--accent);
    }

    .item-icon-circle.cat-credit {
      background: rgba(251, 191, 36, 0.15);
      color: var(--warning);
    }

    .item-icon-circle.cat-debit {
      background: rgba(52, 211, 153, 0.15);
      color: var(--success);
    }

    .item-icon-circle.cat-other {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .item-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .item-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-category-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .item-category-tag.cat-banking { background: rgba(129, 140, 248, 0.15); color: var(--accent); }
    .item-category-tag.cat-credit { background: rgba(251, 191, 36, 0.15); color: var(--warning); }
    .item-category-tag.cat-debit { background: rgba(52, 211, 153, 0.15); color: var(--success); }
    .item-category-tag.cat-other { background: rgba(56, 189, 248, 0.15); color: var(--primary); }

    .item-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .item-arrow {
      color: var(--text-muted);
      font-size: 22px;
    }
  `]
})
export class DashboardComponent {
  readonly vaultState = inject(VaultStateService);

  filterCategory(category: VaultCategory | 'ALL'): void {
    this.vaultState.setSelectedCategory(category);
  }

  getCategoryIcon(cat: VaultCategory): string {
    switch (cat) {
      case 'BANKING': return 'account_balance';
      case 'CREDIT_CARD': return 'credit_card';
      case 'DEBIT_CARD': return 'payments';
      default: return 'key';
    }
  }

  getCategoryClass(cat: VaultCategory): string {
    switch (cat) {
      case 'BANKING': return 'cat-banking';
      case 'CREDIT_CARD': return 'cat-credit';
      case 'DEBIT_CARD': return 'cat-debit';
      default: return 'cat-other';
    }
  }

  formatCategory(cat: VaultCategory): string {
    switch (cat) {
      case 'BANKING': return 'Banking';
      case 'CREDIT_CARD': return 'Credit';
      case 'DEBIT_CARD': return 'Debit';
      default: return 'Other';
    }
  }
}
