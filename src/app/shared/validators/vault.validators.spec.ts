import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import { VaultValidators } from './vault.validators';

describe('VaultValidators', () => {
  describe('luhnCardNumber', () => {
    const validator = VaultValidators.luhnCardNumber();

    it('should pass for standard valid test Visa card number', () => {
      const control = new FormControl('4111111111111111');
      expect(validator(control)).toBeNull();
    });

    it('should fail for invalid card numbers failing Luhn check', () => {
      const control = new FormControl('4111111111111112');
      expect(validator(control)).toEqual({ luhnChecksumFailed: true });
    });

    it('should fail for non-numeric characters or invalid length', () => {
      const control = new FormControl('1234abcd');
      expect(validator(control)).toEqual({ invalidCardFormat: true });
    });

    it('should return null for empty values (relying on required validator)', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('cvv', () => {
    const validator = VaultValidators.cvv();

    it('should pass for 3 and 4 digit CVVs', () => {
      expect(validator(new FormControl('123'))).toBeNull();
      expect(validator(new FormControl('1234'))).toBeNull();
    });

    it('should fail for letters or invalid lengths', () => {
      expect(validator(new FormControl('12'))).toEqual({ invalidCvv: true });
      expect(validator(new FormControl('12345'))).toEqual({ invalidCvv: true });
      expect(validator(new FormControl('abc'))).toEqual({ invalidCvv: true });
    });
  });

  describe('pin', () => {
    const validator = VaultValidators.pin();

    it('should pass for 4, 5, 6 digit PINs', () => {
      expect(validator(new FormControl('1234'))).toBeNull();
      expect(validator(new FormControl('123456'))).toBeNull();
    });

    it('should fail for non-numeric or short PINs', () => {
      expect(validator(new FormControl('12'))).toEqual({ invalidPin: true });
      expect(validator(new FormControl('abcd'))).toEqual({ invalidPin: true });
    });
  });

  describe('cardExpiry', () => {
    const validator = VaultValidators.cardExpiry('month', 'year');

    it('should pass for future year and valid month', () => {
      const form = new FormGroup({
        month: new FormControl('12'),
        year: new FormControl('2030')
      });
      expect(validator(form)).toBeNull();
    });

    it('should fail for expired cards', () => {
      const form = new FormGroup({
        month: new FormControl('01'),
        year: new FormControl('2020')
      });
      expect(validator(form)).toEqual({ cardExpired: true });
    });

    it('should fail for invalid month', () => {
      const form = new FormGroup({
        month: new FormControl('15'),
        year: new FormControl('2030')
      });
      expect(validator(form)).toEqual({ invalidExpiryMonth: true });
    });
  });
});
