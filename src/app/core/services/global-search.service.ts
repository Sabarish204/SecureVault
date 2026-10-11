import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VaultStateService } from '../state/vault-state.service';
import { AppUpdateService } from '../update/app-update.service';
import { FeedbackService } from './feedback.service';

export type SearchResultType =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANKING'
  | 'OTHER'
  | 'SETTING'
  | 'ACTION';

export type SearchCategoryGroup = 'CARDS' | 'BANKING' | 'SETTINGS' | 'ACTIONS';

export interface GlobalSearchResult {
  id: string;
  type: SearchResultType;
  categoryGroup: SearchCategoryGroup;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  icon: string;
  keywords: string[];
  route?: string;
  actionId?: string;
}

export interface GroupedSearchResults {
  group: SearchCategoryGroup;
  label: string;
  icon: string;
  items: GlobalSearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private readonly router = inject(Router);
  private readonly vaultState = inject(VaultStateService);
  private readonly appUpdate = inject(AppUpdateService);
  private readonly feedback = inject(FeedbackService);

  readonly query = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);
  readonly selectedIndex = signal<number>(-1);

  /**
   * Static system actions & settings entries
   */
  readonly staticEntries: GlobalSearchResult[] = [
    // --- Quick Creation Actions ---
    {
      id: 'action-add-credit',
      type: 'ACTION',
      categoryGroup: 'ACTIONS',
      title: 'Add Credit Card',
      subtitle: 'Store new credit card with luxury live card preview & PIN',
      badge: 'Create',
      badgeClass: 'badge-action',
      icon: 'credit_card',
      keywords: ['add', 'new', 'create', 'credit', 'card', 'visa', 'mastercard', 'rupay', 'amex', 'payment', 'cvv'],
      route: '/items/new?category=CREDIT_CARD'
    },
    {
      id: 'action-add-debit',
      type: 'ACTION',
      categoryGroup: 'ACTIONS',
      title: 'Add Debit Card',
      subtitle: 'Store new debit card with PIN, CVV & account details',
      badge: 'Create',
      badgeClass: 'badge-action',
      icon: 'payments',
      keywords: ['add', 'new', 'create', 'debit', 'card', 'atm', 'banking', 'bank'],
      route: '/items/new?category=DEBIT_CARD'
    },
    {
      id: 'action-add-banking',
      type: 'ACTION',
      categoryGroup: 'ACTIONS',
      title: 'Add Net Banking Account',
      subtitle: 'Store bank login credentials, customer ID, URL & password',
      badge: 'Create',
      badgeClass: 'badge-action',
      icon: 'account_balance',
      keywords: ['add', 'new', 'create', 'bank', 'net banking', 'internet banking', 'account', 'login', 'portal', 'cust id'],
      route: '/items/new?category=BANKING'
    },
    {
      id: 'action-add-other',
      type: 'ACTION',
      categoryGroup: 'ACTIONS',
      title: 'Add Secure Note / Login',
      subtitle: 'Store encrypted custom password, secret keys or notes',
      badge: 'Create',
      badgeClass: 'badge-action',
      icon: 'note_add',
      keywords: ['add', 'new', 'note', 'password', 'secret', 'custom', 'login', 'other'],
      route: '/items/new?category=OTHER'
    },

    // --- Settings & Security Options ---
    {
      id: 'setting-fingerprint',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Biometric & Fingerprint Unlock',
      subtitle: 'Configure biometric sensor authentication for quick unlock',
      badge: 'Security',
      badgeClass: 'badge-setting',
      icon: 'fingerprint',
      keywords: ['fingerprint', 'biometric', 'face id', 'touch id', 'sensor', 'unlock', 'security', 'settings', 'auth'],
      route: '/settings'
    },
    {
      id: 'setting-pin',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Change Master PIN / Password',
      subtitle: 'Update your vault master password or 4-6 digit unlock PIN',
      badge: 'Security',
      badgeClass: 'badge-setting',
      icon: 'password',
      keywords: ['change pin', 'master pin', 'password', 'change password', 'code', 'pin', 'security', 'key'],
      route: '/settings',
      actionId: 'CHANGE_PIN'
    },
    {
      id: 'setting-lockout',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'PIN Lockout & Rate Limiting',
      subtitle: 'Progressive cooldown protection against brute-force guessing',
      badge: 'Security',
      badgeClass: 'badge-setting',
      icon: 'timer',
      keywords: ['lockout', 'rate limit', 'cooldown', 'timeout', 'attempts', 'security', 'protection', 'brute force'],
      route: '/settings'
    },
    {
      id: 'setting-autolock',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Auto-Lock Timeout Duration',
      subtitle: 'Configure background inactivity timer before vault locks',
      badge: 'Security',
      badgeClass: 'badge-setting',
      icon: 'lock_clock',
      keywords: ['auto lock', 'timeout', 'minutes', 'inactivity', 'background', 'settings', 'lock'],
      route: '/settings'
    },
    {
      id: 'setting-export',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Export Encrypted Backup (JSON)',
      subtitle: 'Download AES-256 encrypted vault backup file',
      badge: 'Backup',
      badgeClass: 'badge-backup',
      icon: 'download',
      keywords: ['export', 'backup', 'download', 'save', 'json', 'export backup', 'settings'],
      route: '/settings',
      actionId: 'EXPORT_BACKUP'
    },
    {
      id: 'setting-import',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Restore Vault from Backup',
      subtitle: 'Import credentials and cards from previously saved JSON file',
      badge: 'Backup',
      badgeClass: 'badge-backup',
      icon: 'upload',
      keywords: ['restore', 'import', 'upload', 'load', 'restore backup', 'json', 'settings'],
      route: '/settings',
      actionId: 'IMPORT_BACKUP'
    },
    {
      id: 'setting-feedback',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Feedback & Suggestions',
      subtitle: 'Submit feature suggestions or bug reports with screenshots',
      badge: 'Community',
      badgeClass: 'badge-feedback',
      icon: 'rate_review',
      keywords: ['feedback', 'suggestion', 'bug', 'report', 'issue', 'idea', 'feature', 'screenshot', 'photo'],
      actionId: 'OPEN_FEEDBACK'
    },
    {
      id: 'setting-update',
      type: 'SETTING',
      categoryGroup: 'SETTINGS',
      title: 'Check for Updates',
      subtitle: 'Check GitHub Releases for latest SecureVault APK build',
      badge: 'System',
      badgeClass: 'badge-update',
      icon: 'system_update',
      keywords: ['update', 'upgrade', 'version', 'check update', 'latest', 'github', 'apk', 'build'],
      actionId: 'CHECK_UPDATES'
    }
  ];

  /**
   * Reactively indexes all unlocked vault items (Credit Cards, Debit Cards, Net Banking)
   */
  readonly dynamicVaultEntries = computed<GlobalSearchResult[]>(() => {
    const rawItems = this.vaultState.items();
    return rawItems.map(item => {
      let type: SearchResultType = 'OTHER';
      let categoryGroup: SearchCategoryGroup = 'BANKING';
      let badge = 'Item';
      let badgeClass = 'badge-other';
      let icon = 'lock';

      switch (item.category) {
        case 'CREDIT_CARD':
          type = 'CREDIT_CARD';
          categoryGroup = 'CARDS';
          badge = 'Credit Card';
          badgeClass = 'badge-credit';
          icon = 'credit_card';
          break;
        case 'DEBIT_CARD':
          type = 'DEBIT_CARD';
          categoryGroup = 'CARDS';
          badge = 'Debit Card';
          badgeClass = 'badge-debit';
          icon = 'payments';
          break;
        case 'BANKING':
          type = 'BANKING';
          categoryGroup = 'BANKING';
          badge = 'Net Banking';
          badgeClass = 'badge-banking';
          icon = 'account_balance';
          break;
        default:
          type = 'OTHER';
          categoryGroup = 'BANKING';
          badge = 'Secure Note';
          badgeClass = 'badge-other';
          icon = 'description';
          break;
      }

      const keywords = [
        item.title.toLowerCase(),
        item.subtitle.toLowerCase(),
        item.category.toLowerCase(),
        badge.toLowerCase()
      ];

      // Add common aliases for bank cards (e.g. visa, mastercard, rupay, amex)
      if (item.category === 'CREDIT_CARD' || item.category === 'DEBIT_CARD') {
        keywords.push('card', 'cardholder', 'bank');
        if (item.subtitle.includes('••••')) {
          const last4 = item.subtitle.replace(/[^0-9]/g, '');
          if (last4) keywords.push(last4);
        }
      }

      return {
        id: item.id,
        type,
        categoryGroup,
        title: item.title,
        subtitle: item.subtitle,
        badge,
        badgeClass,
        icon,
        keywords,
        route: `/items/${item.id}`
      };
    });
  });

  /**
   * Filtered matching search results
   */
  readonly searchResults = computed<GlobalSearchResult[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) {
      // When query is empty but focused, show top suggested quick actions
      return this.staticEntries.slice(0, 6);
    }

    const allEntries = [...this.dynamicVaultEntries(), ...this.staticEntries];

    const scored = allEntries
      .map(entry => {
        let score = 0;
        const titleLower = entry.title.toLowerCase();
        const subtitleLower = entry.subtitle.toLowerCase();

        // Exact match or prefix match
        if (titleLower === q) score += 100;
        else if (titleLower.startsWith(q)) score += 60;
        else if (titleLower.includes(q)) score += 40;

        if (subtitleLower.includes(q)) score += 30;

        for (const kw of entry.keywords) {
          if (kw === q) score += 35;
          else if (kw.startsWith(q)) score += 20;
          else if (kw.includes(q)) score += 10;
        }

        return { entry, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.entry);

    return scored.slice(0, 12);
  });

  /**
   * Grouped results into clear categories for beautiful visual presentation
   */
  readonly groupedResults = computed<GroupedSearchResults[]>(() => {
    const list = this.searchResults();
    if (list.length === 0) return [];

    const groups: Record<SearchCategoryGroup, GlobalSearchResult[]> = {
      CARDS: [],
      BANKING: [],
      ACTIONS: [],
      SETTINGS: []
    };

    for (const item of list) {
      groups[item.categoryGroup].push(item);
    }

    const result: GroupedSearchResults[] = [];

    if (groups.CARDS.length > 0) {
      result.push({
        group: 'CARDS',
        label: 'Payment Cards',
        icon: 'credit_card',
        items: groups.CARDS
      });
    }

    if (groups.BANKING.length > 0) {
      result.push({
        group: 'BANKING',
        label: 'Internet Banking & Logins',
        icon: 'account_balance',
        items: groups.BANKING
      });
    }

    if (groups.ACTIONS.length > 0) {
      result.push({
        group: 'ACTIONS',
        label: 'Quick Add Actions',
        icon: 'add_circle',
        items: groups.ACTIONS
      });
    }

    if (groups.SETTINGS.length > 0) {
      result.push({
        group: 'SETTINGS',
        label: 'Settings & Security',
        icon: 'settings',
        items: groups.SETTINGS
      });
    }

    return result;
  });

  setQuery(text: string): void {
    this.query.set(text);
    this.isDropdownOpen.set(true);
    this.selectedIndex.set(-1);
  }

  openDropdown(): void {
    this.isDropdownOpen.set(true);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
    this.selectedIndex.set(-1);
  }

  clearSearch(): void {
    this.query.set('');
    this.selectedIndex.set(-1);
  }

  /**
   * Executes the chosen search result
   */
  executeResult(result: GlobalSearchResult): void {
    this.closeDropdown();
    this.clearSearch();

    if (result.actionId) {
      switch (result.actionId) {
        case 'OPEN_FEEDBACK':
          this.feedback.open();
          return;
        case 'CHECK_UPDATES':
          this.appUpdate.checkForUpdates(true);
          return;
        case 'CHANGE_PIN':
          this.router.navigate(['/settings'], { queryParams: { action: 'change-pin' } });
          return;
        case 'EXPORT_BACKUP':
          this.router.navigate(['/settings'], { queryParams: { action: 'export' } });
          return;
        case 'IMPORT_BACKUP':
          this.router.navigate(['/settings'], { queryParams: { action: 'import' } });
          return;
      }
    }

    if (result.route) {
      this.router.navigateByUrl(result.route);
    }
  }
}
