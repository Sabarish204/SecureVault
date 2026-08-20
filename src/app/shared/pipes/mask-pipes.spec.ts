import { describe, it, expect } from 'vitest';
import { MaskSecretPipe } from './mask-secret.pipe';
import { MaskCardPipe } from './mask-card.pipe';
import { MaskCvvPipe } from './mask-cvv.pipe';

describe('Masking Pipes', () => {
  describe('MaskSecretPipe', () => {
    const pipe = new MaskSecretPipe();

    it('should mask secret with bullets when visible is false', () => {
      const result = pipe.transform('MySecretPassword123!', false);
      expect(result).toBe('••••••••••••••••');
      expect(result).not.toContain('MySecretPassword');
    });

    it('should show plaintext when visible is true', () => {
      const result = pipe.transform('MySecretPassword123!', true);
      expect(result).toBe('MySecretPassword123!');
    });

    it('should handle null, undefined, or empty values', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform('')).toBe('');
    });
  });

  describe('MaskCardPipe', () => {
    const pipe = new MaskCardPipe();

    it('should mask 16-digit card and reveal only last 4 digits', () => {
      const result = pipe.transform('4111111111111234', false);
      expect(result).toBe('•••• •••• •••• 1234');
      expect(result).not.toContain('4111');
    });

    it('should format full number with spaces when visible is true', () => {
      const result = pipe.transform('4111111111111234', true);
      expect(result).toBe('4111 1111 1111 1234');
    });

    it('should handle short card numbers properly', () => {
      expect(pipe.transform('12345678', false)).toBe('•••• 5678');
      expect(pipe.transform('123', false)).toBe('••••');
    });
  });

  describe('MaskCvvPipe', () => {
    const pipe = new MaskCvvPipe();

    it('should mask CVV with bullets', () => {
      expect(pipe.transform('123', false)).toBe('•••');
      expect(pipe.transform('1234', false)).toBe('••••');
    });

    it('should reveal CVV when visible is true', () => {
      expect(pipe.transform('123', true)).toBe('123');
    });
  });
});
