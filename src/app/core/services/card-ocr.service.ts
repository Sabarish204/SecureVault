import { Injectable } from '@angular/core';

export interface CardScanResult {
  cardNumber?: string;
  formattedCardNumber?: string;
  cardBrand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  cvv?: string;
  rawText: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardOcrService {
  private worker: any = null;
  private isInitializing = false;

  private readonly COMMON_CARD_KEYWORDS = new Set([
    'VISA',
    'MASTERCARD',
    'RUPAY',
    'AMEX',
    'AMERICAN',
    'EXPRESS',
    'DISCOVER',
    'DINERS',
    'CREDIT',
    'DEBIT',
    'CARD',
    'VALID',
    'THRU',
    'GOOD',
    'UNTIL',
    'EXPIRES',
    'EXP',
    'MEMBER',
    'SINCE',
    'PLATINUM',
    'GOLD',
    'TITANIUM',
    'SIGNATURE',
    'INFINITE',
    'WORLD',
    'CORAL',
    'RUBYX',
    'SAPPHIRO',
    'REGALIA',
    'MILLENNIA',
    'SIMPLYCLICK',
    'SIMPLYSAVE',
    'INTERNATIONAL',
    'DOMESTIC',
    'AUTHORIZED',
    'BANK',
    'CORPORATION',
    'FINANCIAL',
    'SERVICES',
    'ELECTRONIC',
    'USE',
    'ONLY',
    'CUSTOMER',
    'CARE'
  ]);

  /**
   * Initializes or reuses the local Tesseract OCR worker
   */
  async getWorker(): Promise<any> {
    if (this.worker) return this.worker;
    if (this.isInitializing) {
      // Wait for existing initialization
      while (this.isInitializing) {
        await new Promise(r => setTimeout(r, 50));
      }
      if (this.worker) return this.worker;
    }

    this.isInitializing = true;
    try {
      const { createWorker } = await import('tesseract.js');
      this.worker = await createWorker('eng');
    } finally {
      this.isInitializing = false;
    }
    return this.worker;
  }

  /**
   * Performs client-side image preprocessing on HTML Canvas:
   * 1. Resizes to standard card dimensions (~900x567)
   * 2. High-contrast grayscale conversion
   * 3. Threshold binarization for crisp text extraction
   */
  preprocessImage(
    imageSource: HTMLImageElement | HTMLCanvasElement,
    cropArea?: { x: number; y: number; width: number; height: number }
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const targetWidth = 900;
    const targetHeight = 567; // ISO/IEC 7810 standard aspect ratio ~ 1.586
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
      ctx.drawImage(
        imageSource,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        targetWidth,
        targetHeight
      );
    } else {
      ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);
    }

    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // Contrast boost & Grayscale conversion
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Luminance formula
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Contrast stretch
      gray = ((gray - 128) * 1.35) + 128;
      gray = Math.min(255, Math.max(0, gray));

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Scans front side of card (Card Number, Expiry Date, Cardholder Name)
   */
  async scanFrontSide(
    imageSource: HTMLImageElement | HTMLCanvasElement,
    cropArea?: { x: number; y: number; width: number; height: number }
  ): Promise<CardScanResult> {
    const processedCanvas = this.preprocessImage(imageSource, cropArea);
    const worker = await this.getWorker();
    const ret = await worker.recognize(processedCanvas);
    const text = ret.data.text || '';

    const numberResult = this.parseCardNumber(text);
    const expiryResult = this.parseExpiryDate(text);
    const nameResult = this.parseCardholderName(text);

    return {
      cardNumber: numberResult?.rawNumber,
      formattedCardNumber: numberResult?.formatted,
      cardBrand: numberResult?.brand,
      expiryMonth: expiryResult?.month,
      expiryYear: expiryResult?.year,
      cardholderName: nameResult || undefined,
      rawText: text
    };
  }

  /**
   * Scans back side of card (CVV / Security Code)
   */
  async scanBackSide(
    imageSource: HTMLImageElement | HTMLCanvasElement,
    cropArea?: { x: number; y: number; width: number; height: number }
  ): Promise<CardScanResult> {
    const processedCanvas = this.preprocessImage(imageSource, cropArea);
    const worker = await this.getWorker();
    const ret = await worker.recognize(processedCanvas);
    const text = ret.data.text || '';

    const cvv = this.parseCvv(text);

    return {
      cvv: cvv || undefined,
      rawText: text
    };
  }

  /**
   * Validates Luhn checksum for card numbers
   */
  validateLuhn(digits: string): boolean {
    if (!digits || digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits.charAt(i), 10);
      if (isNaN(n)) return false;
      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  /**
   * Formats raw digits with standard card spacing
   */
  formatCardNumber(digits: string): string {
    const clean = digits.replace(/\D/g, '');
    if (clean.length === 15) {
      // Amex 4-6-5
      return `${clean.slice(0, 4)} ${clean.slice(4, 10)} ${clean.slice(10)}`;
    }
    // Standard 4-4-4-4
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  /**
   * Parses card number from OCR text and validates using Luhn
   */
  parseCardNumber(text: string): { rawNumber: string; formatted: string; brand: string } | null {
    // 1. First look for spaced 4-digit groups: e.g. 4532 1234 5678 9012 or 4532-1234-5678-9012
    const groupMatches = text.match(/\b(?:\d{4}[ -]?){3}\d{4}\b/g);
    if (groupMatches) {
      for (const candidate of groupMatches) {
        const clean = candidate.replace(/\D/g, '');
        if (this.validateLuhn(clean)) {
          return {
            rawNumber: clean,
            formatted: this.formatCardNumber(clean),
            brand: this.detectBrand(clean)
          };
        }
      }
    }

    // 2. Look for any consecutive 13-19 digits across lines
    const cleanedText = text.replace(/[^0-9\n]/g, '');
    const lines = cleanedText.split('\n');
    for (const line of lines) {
      const match = line.match(/\d{13,19}/);
      if (match) {
        const clean = match[0];
        if (this.validateLuhn(clean)) {
          return {
            rawNumber: clean,
            formatted: this.formatCardNumber(clean),
            brand: this.detectBrand(clean)
          };
        }
      }
    }

    // 3. Look for 4 continuous chunks of 4 digits in OCR lines
    const allDigits = text.replace(/\D/g, '');
    if (allDigits.length >= 16) {
      for (let i = 0; i <= allDigits.length - 16; i++) {
        const slice = allDigits.slice(i, i + 16);
        if (this.validateLuhn(slice)) {
          return {
            rawNumber: slice,
            formatted: this.formatCardNumber(slice),
            brand: this.detectBrand(slice)
          };
        }
      }
    }

    return null;
  }

  /**
   * Parses expiry date (MM/YY or MM/YYYY) from OCR text
   */
  parseExpiryDate(text: string): { month: string; year: string } | null {
    // 1. Look near "VALID THRU", "GOOD THRU", "EXP", "EXPIRES"
    const keywordMatch = text.match(
      /(?:VALID|THRU|GOOD|EXP|EXPIRES|UNTIL)[^0-9\n]{0,15}(\d{1,2})[\/\- ](\d{2,4})/i
    );
    if (keywordMatch) {
      const m = parseInt(keywordMatch[1], 10);
      const y = keywordMatch[2];
      if (m >= 1 && m <= 12) {
        return {
          month: m.toString().padStart(2, '0'),
          year: y.length === 4 ? y.slice(2) : y
        };
      }
    }

    // 2. Look for standard MM/YY format (e.g. 08/29, 12/28, 05/30)
    const matches = text.matchAll(/\b(0[1-9]|1[0-2])[\/\- ]([2-3]\d)\b/g);
    for (const match of matches) {
      const month = match[1];
      const year = match[2];
      const currentYearTwoDigits = parseInt(new Date().getFullYear().toString().slice(2), 10);
      const parsedYear = parseInt(year, 10);

      // Expiry must be plausible (e.g. within current year or next 15 years)
      if (parsedYear >= currentYearTwoDigits - 1 && parsedYear <= currentYearTwoDigits + 15) {
        return { month, year };
      }
    }

    return null;
  }

  /**
   * Parses cardholder name from OCR text (uppercase letters only, not keywords)
   */
  parseCardholderName(text: string): string | null {
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length >= 3 && l.length <= 32);

    for (const line of lines) {
      // Must contain only English letters and single spaces
      const cleanLine = line.replace(/[^A-Za-z ]/g, '').trim().toUpperCase();
      const words = cleanLine.split(/\s+/).filter(w => w.length >= 2);

      // Names typically have 2 to 4 words (e.g. "SABARISH KUMAR", "JOHN M DOE")
      if (words.length >= 2 && words.length <= 4) {
        // Ensure none of the words are common card keywords
        const hasKeyword = words.some(w => this.COMMON_CARD_KEYWORDS.has(w));
        if (!hasKeyword) {
          return cleanLine;
        }
      }
    }

    return null;
  }

  /**
   * Parses CVV (3 or 4 digits) from back side OCR text
   */
  parseCvv(text: string): string | null {
    // 1. Look for CVV/CVC keywords followed by 3 or 4 digits
    const keywordMatch = text.match(/(?:CVV|CVC|CID|SECURITY|CODE)[^0-9\n]{0,10}(\d{3,4})\b/i);
    if (keywordMatch) {
      return keywordMatch[1];
    }

    // 2. Look for 3-digit number isolated on a line or right side of signature strip
    const matches = text.match(/\b\d{3}\b/g);
    if (matches && matches.length > 0) {
      // Return the last isolated 3 digits (standard placement on signature strip)
      return matches[matches.length - 1];
    }

    // 3. Fallback to 4 digits (Amex CID)
    const amexMatch = text.match(/\b\d{4}\b/);
    if (amexMatch) {
      return amexMatch[0];
    }

    return null;
  }

  private detectBrand(cardNumber: string): string {
    const num = cardNumber.replace(/\D/g, '');
    if (/^4/.test(num)) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(num)) return 'MASTERCARD';
    if (/^(60|65|81|82|508)/.test(num)) return 'RUPAY';
    if (/^3[47]/.test(num)) return 'AMEX';
    return 'OTHER';
  }
}
