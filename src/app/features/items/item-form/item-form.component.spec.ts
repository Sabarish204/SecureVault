import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ItemFormComponent } from './item-form.component';
import { VaultStateService } from '../../../core/state/vault-state.service';
import { BankDirectoryService } from '../../../core/services/bank-directory.service';
import { signal } from '@angular/core';

describe('ItemFormComponent', () => {
  let component: ItemFormComponent;
  let fixture: ComponentFixture<ItemFormComponent>;
  let vaultStateMock: any;
  let routerMock: any;

  beforeEach(async () => {
    vaultStateMock = {
      isUnlocked: signal(true),
      saveItem: vi.fn().mockResolvedValue({ id: 'saved-1', category: 'BANKING', title: 'HDFC Bank', subtitle: 'demo.user', createdAt: 1, updatedAt: 1 }),
      getItemDetails: vi.fn().mockResolvedValue(null)
    };
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [ItemFormComponent],
      providers: [
        provideAnimationsAsync(),
        BankDirectoryService,
        { provide: VaultStateService, useValue: vaultStateMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ category: 'BANKING' }),
            paramMap: of(new Map())
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with banking category and reactive form', () => {
    expect(component).toBeTruthy();
    expect(component.selectedCategory()).toBe('BANKING');
    expect(component.bankingForm).toBeDefined();
    expect(component.filteredBanks().length).toBeGreaterThan(40);
  });

  it('should filter Indian banks based on search query and select a bank', () => {
    component.onBankSearchChange('HDFC');
    expect(component.filteredBanks().length).toBeGreaterThan(0);
    expect(component.filteredBanks()[0].name).toContain('HDFC Bank');

    const hdfc = component.filteredBanks()[0];
    component.selectBank(hdfc);

    expect(component.selectedBank()?.name).toBe('HDFC Bank');
    expect(component.bankingForm.get('bankName')?.value).toBe('HDFC Bank');
    expect(component.bankingForm.get('loginUrl')?.value).toContain('hdfcbank.com');
  });

  it('should support custom bank selection', () => {
    component.enableCustomBank('My Cooperative Bank');
    expect(component.isCustomBank()).toBe(true);
    expect(component.bankingForm.get('bankName')?.value).toBe('My Cooperative Bank');
  });

  it('should validate required banking fields', () => {
    component.bankingForm.patchValue({
      bankName: '',
      username: '',
      password: ''
    });
    expect(component.bankingForm.invalid).toBe(true);

    component.bankingForm.patchValue({
      bankName: 'State Bank of India (SBI)',
      username: 'demo.user',
      password: 'NOT-A-REAL-PASSWORD-123'
    });
    expect(component.bankingForm.valid).toBe(true);
  });

  it('should validate credit card Luhn check when category is CREDIT_CARD', () => {
    component.onCategoryChange('CREDIT_CARD');
    expect(component.selectedCategory()).toBe('CREDIT_CARD');

    component.cardForm.patchValue({
      cardNickname: 'Visa Test',
      cardholderName: 'DEMO USER',
      cardNumber: '4111111111111111', // valid test visa
      expiryMonth: '12',
      expiryYear: '2030',
      cvv: '123'
    });
    expect(component.cardForm.valid).toBe(true);

    // Invalid Luhn
    component.cardForm.patchValue({ cardNumber: '4111111111111112' });
    expect(component.cardForm.invalid).toBe(true);
  });
});
