import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { VaultStateService } from '../../../core/state/vault-state.service';
import { VaultCategory } from '../../../shared/models';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule],
  template: `
    <div class="item-list-wrapper animate-fade-in">
      <!-- Header -->
      <div class="list-header">
        <div>
          <h1 class="page-title">Vault Records</h1>
          <p class="page-desc">{{ vaultState.filteredItems().length }} of {{ vaultState.items().length }} items</p>
        </div>
        <a routerLink="/items/new" class="btn-primary">
          <span class="material-symbols-outlined">add</span>
          <span>New Item</span>
        </a>
      </div>

      <!-- Search & Filters -->
      <div class="search-and-filter">
        <div class="search-input-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search items by name, bank, username, or card..."
            [ngModel]="vaultState.searchQuery()"
            (ngModelChange)="vaultState.setSearchQuery($event)"
            class="filter-search-input font-sans"
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

        <div class="category-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="vaultState.selectedCategory() === 'ALL'"
            (click)="setCategory('ALL')"
          >
            All ({{ vaultState.categoryCounts().total }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="vaultState.selectedCategory() === 'BANKING'"
            (click)="setCategory('BANKING')"
          >
            Banking ({{ vaultState.categoryCounts().banking }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="vaultState.selectedCategory() === 'CREDIT_CARD'"
            (click)="setCategory('CREDIT_CARD')"
          >
            Credit ({{ vaultState.categoryCounts().creditCard }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="vaultState.selectedCategory() === 'DEBIT_CARD'"
            (click)="setCategory('DEBIT_CARD')"
          >
            Debit ({{ vaultState.categoryCounts().debitCard }})
          </button>
        </div>
      </div>

      <!-- Items List -->
      <div class="list-container">
        <!-- Empty State -->
        <div *ngIf="vaultState.filteredItems().length === 0" class="empty-state glass-panel">
          <span class="material-symbols-outlined empty-icon">lock_open</span>
          <h3>No items found</h3>
          <p>Try searching for a different term or add a new record.</p>
          <a routerLink="/items/new" class="btn-primary" style="margin-top: 10px;">
            <span class="material-symbols-outlined">add</span>
            Add Item
          </a>
        </div>

        <!-- Cards List -->
        <div *ngIf="vaultState.filteredItems().length > 0" class="items-grid">
          <a
            *ngFor="let item of vaultState.filteredItems()"
            [routerLink]="['/items', item.id]"
            class="item-card glass-panel"
          >
            <div class="item-icon-box" [ngClass]="getCategoryClass(item.category)">
              <span class="material-symbols-outlined">{{ getCategoryIcon(item.category) }}</span>
            </div>

            <div class="item-content">
              <div class="title-row">
                <span class="title-text">{{ item.title }}</span>
                <span class="category-badge" [ngClass]="getCategoryClass(item.category)">
                  {{ formatCategory(item.category) }}
                </span>
              </div>
              <span class="subtitle-text font-mono">{{ item.subtitle }}</span>
              <span class="date-text">Updated {{ item.updatedAt | date:'mediumDate' }}</span>
            </div>

            <span class="material-symbols-outlined nav-chevron">chevron_right</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .item-list-wrapper {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px 16px 80px 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .page-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .search-and-filter {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .search-input-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
    }

    .filter-search-input {
      width: 100%;
      height: 46px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 40px 0 40px;
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .filter-search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
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

    .category-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .tab-btn {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .tab-btn.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 700;
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 36px;
      color: var(--text-muted);
    }

    .items-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      text-decoration: none;
      color: inherit;
      border: 1px solid var(--border-subtle);
      transition: all 0.2s ease;
    }

    .item-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateX(4px);
    }

    .item-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-icon-box.cat-banking { background: rgba(129, 140, 248, 0.15); color: var(--accent); }
    .item-icon-box.cat-credit { background: rgba(251, 191, 36, 0.15); color: var(--warning); }
    .item-icon-box.cat-debit { background: rgba(52, 211, 153, 0.15); color: var(--success); }
    .item-icon-box.cat-other { background: rgba(56, 189, 248, 0.15); color: var(--primary); }

    .item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .title-text {
      font-size: 0.98rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .category-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .category-badge.cat-banking { background: rgba(129, 140, 248, 0.15); color: var(--accent); }
    .category-badge.cat-credit { background: rgba(251, 191, 36, 0.15); color: var(--warning); }
    .category-badge.cat-debit { background: rgba(52, 211, 153, 0.15); color: var(--success); }
    .category-badge.cat-other { background: rgba(56, 189, 248, 0.15); color: var(--primary); }

    .subtitle-text {
      font-size: 0.82rem;
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }

    .date-text {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .nav-chevron {
      color: var(--text-muted);
      font-size: 22px;
    }
  `]
})
export class ItemListComponent {
  readonly vaultState = inject(VaultStateService);

  setCategory(cat: VaultCategory | 'ALL'): void {
    this.vaultState.setSelectedCategory(cat);
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
