import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BankDirectoryService } from './bank-directory.service';

describe('BankDirectoryService', () => {
  let service: BankDirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BankDirectoryService]
    });
    service = TestBed.inject(BankDirectoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all Indian banks with id, name, and loginUrl', () => {
    const banks = service.getAllBanks();
    expect(banks.length).toBeGreaterThanOrEqual(40);
    
    banks.forEach(bank => {
      expect(bank.id).toBeDefined();
      expect(bank.name).toBeTruthy();
      expect(bank.loginUrl).toMatch(/^https?:\/\//);
    });
  });

  it('should search banks by name or shortCode', () => {
    const sbiResults = service.searchBanks('sbi');
    expect(sbiResults.length).toBeGreaterThan(0);
    expect(sbiResults.some(b => b.name.includes('State Bank of India'))).toBe(true);

    const hdfcResults = service.searchBanks('HDFC');
    expect(hdfcResults.length).toBeGreaterThan(0);
    expect(hdfcResults[0].name).toContain('HDFC');
  });

  it('should get bank by id and by name', () => {
    const sbi = service.getBankById(1);
    expect(sbi).toBeDefined();
    expect(sbi?.name).toContain('State Bank of India');

    const hdfc = service.getBankByName('HDFC Bank');
    expect(hdfc).toBeDefined();
    expect(hdfc?.id).toBe(13);
  });

  it('should support adding and deleting bank entries dynamically', () => {
    const initialCount = service.getAllBanks().length;
    const added = service.addBank({
      name: 'Custom Test Bank',
      loginUrl: 'https://testbank.com/login',
      category: 'Private Sector'
    });

    expect(added.id).toBeDefined();
    expect(service.getAllBanks().length).toBe(initialCount + 1);

    const deleted = service.deleteBank(added.id);
    expect(deleted).toBe(true);
    expect(service.getAllBanks().length).toBe(initialCount);
  });
});
