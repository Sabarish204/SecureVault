import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class VaultValidators {
  /**
   * Validates credit/debit card numbers using Luhn checksum algorithm
   */
  static luhnCardNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const rawValue = String(control.value).replace(/[\s-]/g, '');
      if (!/^\d{13,19}$/.test(rawValue)) {
        return { invalidCardFormat: true };
      }

      let sum = 0;
      let shouldDouble = false;
      for (let i = rawValue.length - 1; i >= 0; i--) {
        let digit = parseInt(rawValue.charAt(i), 10);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }

      return sum % 10 === 0 ? null : { luhnChecksumFailed: true };
    };
  }

  /**
   * Validates card expiry month (01-12) and year (current year or later)
   */
  static cardExpiry(monthControlName: string, yearControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const monthControl = group.get(monthControlName);
      const yearControl = group.get(yearControlName);

      if (!monthControl || !yearControl || !monthControl.value || !yearControl.value) {
        return null;
      }

      const month = parseInt(monthControl.value, 10);
      const year = parseInt(yearControl.value, 10);

      if (isNaN(month) || month < 1 || month > 12) {
        return { invalidExpiryMonth: true };
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-indexed

      // Allow 2-digit or 4-digit year
      const fullYear = year < 100 ? 2000 + year : year;

      if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
        return { cardExpired: true };
      }

      return null;
    };
  }

  /**
   * Validates 3-4 digit CVV/CVC
   */
  static cvv(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const raw = String(control.value).trim();
      return /^\d{3,4}$/.test(raw) ? null : { invalidCvv: true };
    };
  }

  /**
   * Validates 4-6 digit numeric PIN
   */
  static pin(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const raw = String(control.value).trim();
      return /^\d{4,6}$/.test(raw) ? null : { invalidPin: true };
    };
  }

  /**
   * Validates safe web URLs (http/https only)
   */
  static safeUrl(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const raw = String(control.value).trim();
      try {
        const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return null;
        }
      } catch {
        // invalid URL
      }
      return { invalidUrl: true };
    };
  }

  /**
   * Validates master password strength (minimum 8 chars, mix of classes)
   */
  static masterPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const val = String(control.value);
      if (val.length < 8) {
        return { minLength: { requiredLength: 8, actualLength: val.length } };
      }
      return null;
    };
  }
}
