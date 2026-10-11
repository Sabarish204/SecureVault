import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GlobalSearchService } from './global-search.service';
import { VaultStateService } from '../state/vault-state.service';
import { AppUpdateService } from '../update/app-update.service';
import { FeedbackService } from './feedback.service';
import { BaseVaultItem } from '../../shared/models';

describe('GlobalSearchService', () => {
  let service: GlobalSearchService;
  let vaultState: VaultStateService;
  let router: Router;

  const mockVaultItems: BaseVaultItem[] = [
    {
      id: 'card-1',
      category: 'CREDIT_CARD',
      title: 'HDFC Bank Millennia',
      subtitle: '•••• 6529',
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'card-2',
      category: 'DEBIT_CARD',
      title: 'SBI Global International',
      subtitle: '•••• 4321',
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'bank-1',
      category: 'BANKING',
      title: 'ICICI Corporate Net Banking',
      subtitle: 'cust_987654',
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GlobalSearchService,
        {
          provide: VaultStateService,
          useValue: {
            items: () => mockVaultItems,
            isUnlocked: () => true
          }
        },
        {
          provide: AppUpdateService,
          useValue: {
            checkForUpdates: () => Promise.resolve()
          }
        },
        {
          provide: FeedbackService,
          useValue: {
            open: () => {},
            close: () => {},
            isOpen: () => false
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
            navigateByUrl: () => Promise.resolve(true)
          }
        }
      ]
    });

    service = TestBed.inject(GlobalSearchService);
    vaultState = TestBed.inject(VaultStateService);
    router = TestBed.inject(Router);
  });

  it('should find Credit Cards when searching for "credit" or bank name', () => {
    service.setQuery('credit');
    const results = service.searchResults();
    const hasCreditCard = results.some(r => r.title.includes('HDFC Bank Millennia'));
    const hasAddCredit = results.some(r => r.title === 'Add Credit Card');

    expect(hasCreditCard).toBe(true);
    expect(hasAddCredit).toBe(true);
  });

  it('should find Debit Cards when searching for "debit"', () => {
    service.setQuery('debit');
    const results = service.searchResults();
    const hasDebitCard = results.some(r => r.title.includes('SBI Global'));
    const hasAddDebit = results.some(r => r.title === 'Add Debit Card');

    expect(hasDebitCard).toBe(true);
    expect(hasAddDebit).toBe(true);
  });

  it('should find items by last 4 digits (e.g. "6529")', () => {
    service.setQuery('6529');
    const results = service.searchResults();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('HDFC Bank Millennia');
  });

  it('should find Net Banking when searching for "icici" or "banking"', () => {
    service.setQuery('icici');
    const results = service.searchResults();
    expect(results.some(r => r.title.includes('ICICI Corporate'))).toBe(true);
  });

  it('should find Settings when searching for "fingerprint" or "biometric"', () => {
    service.setQuery('fingerprint');
    const results = service.searchResults();
    expect(results.some(r => r.title.includes('Fingerprint'))).toBe(true);
  });

  it('should find PIN settings when searching for "pin"', () => {
    service.setQuery('pin');
    const results = service.searchResults();
    expect(results.some(r => r.title.includes('Change Master PIN'))).toBe(true);
  });

  it('should find Feedback when searching for "feedback"', () => {
    service.setQuery('feedback');
    const results = service.searchResults();
    expect(results.some(r => r.title.includes('Feedback & Suggestions'))).toBe(true);
  });

  it('should find Update check when searching for "update"', () => {
    service.setQuery('update');
    const results = service.searchResults();
    expect(results.some(r => r.title.includes('Check for Updates'))).toBe(true);
  });

  it('should find Quick Add Actions when searching for "add"', () => {
    service.setQuery('add');
    const results = service.searchResults();
    expect(results.some(r => r.title === 'Add Credit Card')).toBe(true);
    expect(results.some(r => r.title === 'Add Debit Card')).toBe(true);
    expect(results.some(r => r.title === 'Add Net Banking Account')).toBe(true);
  });

  it('should group results cleanly into categorized sections', () => {
    service.setQuery('card');
    const groups = service.groupedResults();
    expect(groups.length).toBeGreaterThan(0);
    const groupLabels = groups.map(g => g.group);
    expect(groupLabels).toContain('CARDS');
  });
});
