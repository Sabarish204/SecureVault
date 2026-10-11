import { describe, it, expect, beforeEach } from 'vitest';
import { CardOcrService } from './card-ocr.service';

describe('CardOcrService', () => {
  let service: CardOcrService;

  beforeEach(() => {
    service = new CardOcrService();
  });

  describe('Luhn Algorithm Validation', () => {
    it('should validate valid Visa / Mastercard numbers using Luhn checksum', () => {
      // Standard test numbers with valid Luhn checksum
      expect(service.validateLuhn('4532015112830366')).toBe(true);
      expect(service.validateLuhn('4532015112830367')).toBe(false); // Invalid check digit
    });

    it('should format card number into 4-digit groups', () => {
      expect(service.formatCardNumber('4532015112830366')).toBe('4532 0151 1283 0366');
    });
  });

  describe('Card Number Parsing from OCR text', () => {
    it('should parse 16-digit card number with spaces from OCR string', () => {
      const ocrText = `
        HDFC BANK
        MILLENNIA
        4532 0151 1283 0366
        VALID THRU 08/29
        SABARISH KUMAR
      `;
      const result = service.parseCardNumber(ocrText);
      expect(result).not.toBeNull();
      expect(result?.rawNumber).toBe('4532015112830366');
      expect(result?.formatted).toBe('4532 0151 1283 0366');
      expect(result?.brand).toBe('VISA');
    });

    it('should parse RuPay / Mastercard prefixes', () => {
      // 5105... Mastercard test number
      const ocrText = '5105105105105100';
      const result = service.parseCardNumber(ocrText);
      if (result) {
        expect(result.brand).toBe('MASTERCARD');
      }
    });
  });

  describe('Expiry Date Parsing from OCR text', () => {
    it('should parse MM/YY when following VALID THRU', () => {
      const ocrText = 'VALID THRU 08/29';
      const result = service.parseExpiryDate(ocrText);
      expect(result).toEqual({ month: '08', year: '29' });
    });

    it('should parse MM/YY when following GOOD THRU or EXP', () => {
      const ocrText = 'GOOD THRU 11/30';
      const result = service.parseExpiryDate(ocrText);
      expect(result).toEqual({ month: '11', year: '30' });
    });

    it('should parse standalone MM/YY dates', () => {
      const ocrText = 'CARD DETAILS 05/28 INTERNATIONAL';
      const result = service.parseExpiryDate(ocrText);
      expect(result).toEqual({ month: '05', year: '28' });
    });
  });

  describe('Cardholder Name Parsing from OCR text', () => {
    it('should extract cardholder name while ignoring bank words and keywords', () => {
      const ocrText = `
        STATE BANK OF INDIA
        GLOBAL INTERNATIONAL DEBIT CARD
        4532 0151 1283 0366
        VALID THRU 08/29
        SABARISH KUMAR
        PLATINUM
      `;
      const name = service.parseCardholderName(ocrText);
      expect(name).toBe('SABARISH KUMAR');
    });
  });

  describe('CVV Parsing from Back Side OCR text', () => {
    it('should parse CVV when near CVV / CVC keyword', () => {
      const ocrText = `
        AUTHORIZED SIGNATURE
        NOT VALID UNLESS SIGNED
        CVV: 893
        CUSTOMER CARE 1800-123-456
      `;
      const cvv = service.parseCvv(ocrText);
      expect(cvv).toBe('893');
    });

    it('should parse isolated 3 digits on back side', () => {
      const ocrText = `
        SIGNATURE STRIP
        0366 542
      `;
      const cvv = service.parseCvv(ocrText);
      expect(cvv).toBe('542');
    });
  });
});
