import { Injectable } from '@angular/core';

export type CardNetwork =
  | 'RUPAY'
  | 'VISA'
  | 'MASTERCARD'
  | 'AMEX'
  | 'DINERS'
  | 'DISCOVER'
  | 'JCB'
  | 'MAESTRO'
  | 'UNIONPAY';

export interface CardSecurityCode {
  name: string; // 'CVV' | 'CID' | 'CVC'
  size: number; // 3 or 4
}

export interface CardNetworkMeta {
  network: CardNetwork;
  name: string;
  shortCode: string;
  lengths: number[];
  gaps: number[]; // Formatting gaps (e.g. [4, 8, 12] for 4-4-4-4, [4, 10] for 4-6-5)
  code: CardSecurityCode;
  svgLogo: string;
  badgeBg: string;
  badgeColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardDetectorService {
  private readonly networks: CardNetworkMeta[] = [
    {
      network: 'RUPAY',
      name: 'RuPay',
      shortCode: 'RuPay',
      lengths: [16],
      gaps: [4, 8, 12],
      code: { name: 'CVV', size: 3 },
      badgeBg: 'linear-gradient(135deg, #097939 0%, #009245 40%, #f7931e 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#0f172a" stroke="#009245" stroke-width="1"/>
        <path d="M12 7h5c3.5 0 5.5 1.5 5.5 4.2 0 2.2-1.4 3.7-3.6 4.1l4.1 7.7h-3.6l-3.7-7.1H15v7.1h-3V7zm3 6h2c1.7 0 2.7-.8 2.7-2.1s-1-2.1-2.7-2.1H15V13z" fill="#ffffff"/>
        <path d="M25 15.5c0-4.5 3-7.5 7.2-7.5s7.2 3 7.2 7.5-3 7.5-7.2 7.5-7.2-3-7.2-7.5zm11.3 0c0-3-1.7-5-4.1-5s-4.1 2-4.1 5 1.7 5 4.1 5 4.1-2 4.1-5z" fill="#009245"/>
        <path d="M37 9l4 6-4 6h3.5l4-6-4-6H37z" fill="#f7931e"/>
      </svg>`
    },
    {
      network: 'VISA',
      name: 'Visa',
      shortCode: 'VISA',
      lengths: [13, 16, 19],
      gaps: [4, 8, 12],
      code: { name: 'CVV', size: 3 },
      badgeBg: 'linear-gradient(135deg, #1434cb 0%, #00227a 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#1434cb"/>
        <path d="M19.5 20.5l2.6-11h3.1l-2.6 11h-3.1zm12.3-10.7c-.6-.2-1.6-.4-2.8-.4-3.1 0-5.3 1.6-5.3 3.9 0 1.7 1.6 2.6 2.8 3.2 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.2-3-.6l-.4-.2-.4 2.6c.7.3 2 .6 3.4.6 3.3 0 5.5-1.6 5.5-4 0-1.3-.8-2.3-2.6-3.1-1.1-.5-1.7-.9-1.7-1.5 0-.5.6-1.1 1.8-1.1 1 0 1.7.2 2.3.5l.3.1.4-2.7zm7.6 7c.2-.7 1.2-3.3 1.2-3.3l.6 3.3h-1.8zm2.8-7.3h-2.4c-.7 0-1.3.2-1.6 1l-4.6 9.8h3.3l.7-1.8h4l.4 1.8h2.9l-2.7-10.8zm-15.5 0l-3 7.5-.3-1.6c-.6-1.9-2.3-4-4.3-5l2.8 10h3.3l4.9-10.9h-3.4z" fill="#ffffff"/>
        <path d="M9.8 9.5H5l-.1.4c3.8 1 6.3 3.3 7.3 6.1l-1.1-5.3c-.2-.7-.7-1.1-1.3-1.2z" fill="#f7b600"/>
      </svg>`
    },
    {
      network: 'MASTERCARD',
      name: 'Mastercard',
      shortCode: 'MC',
      lengths: [16],
      gaps: [4, 8, 12],
      code: { name: 'CVC', size: 3 },
      badgeBg: 'linear-gradient(135deg, #222222 0%, #111111 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#1e293b"/>
        <circle cx="19" cy="15" r="8" fill="#eb001b"/>
        <circle cx="29" cy="15" r="8" fill="#f79e1b"/>
        <path d="M24 8.7c1.8 1.6 2.9 3.9 2.9 6.3 0 2.4-1.1 4.7-2.9 6.3-1.8-1.6-2.9-3.9-2.9-6.3 0-2.4 1.1-4.7 2.9-6.3z" fill="#ff5f00"/>
      </svg>`
    },
    {
      network: 'AMEX',
      name: 'American Express',
      shortCode: 'Amex',
      lengths: [15],
      gaps: [4, 10], // 4-6-5 format
      code: { name: 'CID', size: 4 },
      badgeBg: 'linear-gradient(135deg, #007bc1 0%, #005689 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#007bc1"/>
        <rect x="2" y="2" width="44" height="26" rx="2" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="24" y="19" font-family="sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">AMEX</text>
      </svg>`
    },
    {
      network: 'DINERS',
      name: 'Diners Club',
      shortCode: 'Diners',
      lengths: [14, 16],
      gaps: [4, 10], // 4-6-4 format (or 4-4-4-4 for 16)
      code: { name: 'CVV', size: 3 },
      badgeBg: 'linear-gradient(135deg, #004a97 0%, #002b5c 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#004a97"/>
        <circle cx="24" cy="15" r="9" fill="#ffffff"/>
        <circle cx="21" cy="15" r="7.5" fill="#004a97"/>
        <path d="M21 7.5v15c4.1 0 7.5-3.4 7.5-7.5s-3.4-7.5-7.5-7.5z" fill="#ffffff"/>
        <path d="M22.5 9v12c3.3 0 6-2.7 6-6s-2.7-6-6-6z" fill="#004a97"/>
      </svg>`
    },
    {
      network: 'DISCOVER',
      name: 'Discover',
      shortCode: 'Discover',
      lengths: [16, 19],
      gaps: [4, 8, 12],
      code: { name: 'CID', size: 3 },
      badgeBg: 'linear-gradient(135deg, #ff6000 0%, #d84a00 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#1e293b"/>
        <text x="7" y="19" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" letter-spacing="0.5">DISC</text>
        <circle cx="31" cy="15.5" r="3.5" fill="#ff6000"/>
        <text x="36" y="19" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" letter-spacing="0.5">VER</text>
      </svg>`
    },
    {
      network: 'JCB',
      name: 'JCB',
      shortCode: 'JCB',
      lengths: [16, 19],
      gaps: [4, 8, 12],
      code: { name: 'CVV', size: 3 },
      badgeBg: 'linear-gradient(135deg, #0e3e85 0%, #001f4d 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/>
        <rect x="7" y="5" width="10" height="20" rx="3" fill="#0e3e85"/>
        <rect x="19" y="5" width="10" height="20" rx="3" fill="#cc1225"/>
        <rect x="31" y="5" width="10" height="20" rx="3" fill="#008037"/>
        <text x="12" y="15" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9.5" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">J</text>
        <text x="24" y="15" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9.5" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">C</text>
        <text x="36" y="15" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9.5" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">B</text>
      </svg>`
    },
    {
      network: 'MAESTRO',
      name: 'Maestro',
      shortCode: 'Maestro',
      lengths: [12, 13, 14, 15, 16, 17, 18, 19],
      gaps: [4, 8, 12],
      code: { name: 'CVC', size: 3 },
      badgeBg: 'linear-gradient(135deg, #0061a8 0%, #003666 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#0f172a"/>
        <circle cx="19" cy="15" r="8" fill="#eb001b"/>
        <circle cx="29" cy="15" r="8" fill="#0061a8"/>
        <path d="M24 8.7c1.8 1.6 2.9 3.9 2.9 6.3 0 2.4-1.1 4.7-2.9 6.3-1.8-1.6-2.9-3.9-2.9-6.3 0-2.4 1.1-4.7 2.9-6.3z" fill="#7b22a8"/>
      </svg>`
    },
    {
      network: 'UNIONPAY',
      name: 'UnionPay',
      shortCode: 'UnionPay',
      lengths: [16, 19],
      gaps: [4, 8, 12],
      code: { name: 'CVN', size: 3 },
      badgeBg: 'linear-gradient(135deg, #007b83 0%, #004c52 100%)',
      badgeColor: '#ffffff',
      svgLogo: `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="30" rx="4" fill="#ffffff"/>
        <rect x="8" y="6" width="10" height="18" rx="2" fill="#d91a2a" transform="skewX(-10)"/>
        <rect x="19" y="6" width="10" height="18" rx="2" fill="#004d80" transform="skewX(-10)"/>
        <rect x="30" y="6" width="10" height="18" rx="2" fill="#007b83" transform="skewX(-10)"/>
        <text x="24" y="20" font-family="sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">银联</text>
      </svg>`
    }
  ];

  /**
   * Identifies the card network from card number prefixes (BINs).
   * Supports early detection from as few as 1-4 digits.
   */
  detectCard(cardNumber: string | null | undefined): CardNetworkMeta | null {
    if (!cardNumber) return null;
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 1) return null;

    const prefix2 = clean.length >= 2 ? parseInt(clean.substring(0, 2), 10) : 0;
    const prefix4 = clean.length >= 4 ? parseInt(clean.substring(0, 4), 10) : 0;
    const prefix6 = clean.length >= 6 ? parseInt(clean.substring(0, 6), 10) : 0;

    // 1. Discover specific 6011 (must precede general 60 check)
    if (/^6011/.test(clean)) {
      return this.getNetworkMeta('DISCOVER')!;
    }

    // 2. RuPay (India)
    // Common RuPay BINs:
    // - 6061-6085, 607x (RuPay classic/platinum)
    // - 652150-653149 range (RuPay Global / Discover co-branded: covers 6521-6529, 6530-6531)
    // - 508 (508159-508220 range)
    // - 81, 82 (RuPay international)
    const isRupay65 =
      (prefix6 >= 652150 && prefix6 <= 653149) ||
      (clean.length < 6 && (/^65(2[1-9]|3[01])/.test(clean) || (/^65[23]/.test(clean) && clean.length <= 3)));

    if (
      /^60[6-8]/.test(clean) ||
      /^60(6[1-9]|7[0-9]|8[0-5])/.test(clean) ||
      isRupay65 ||
      /^508[12]/.test(clean) ||
      /^(81|82)/.test(clean) ||
      (/^60/.test(clean) && clean.length <= 3 && !/^601/.test(clean))
    ) {
      return this.getNetworkMeta('RUPAY')!;
    }

    // 2. American Express (Amex) - starts with 34 or 37
    if (/^3[47]/.test(clean)) {
      return this.getNetworkMeta('AMEX')!;
    }

    // 3. Visa - starts with 4
    if (/^4/.test(clean)) {
      return this.getNetworkMeta('VISA')!;
    }

    // 4. Mastercard
    // - 51-55
    // - 2221-2720
    if ((prefix2 >= 51 && prefix2 <= 55) || (clean.length >= 4 && prefix4 >= 2221 && prefix4 <= 2720) || (/^2[2-7]/.test(clean) && clean.length <= 3)) {
      return this.getNetworkMeta('MASTERCARD')!;
    }

    // 5. Diners Club
    // - 36, 38, 39
    // - 300-305, 3095
    if (/^3(0[0-5]|095|[689])/.test(clean) || (/^30/.test(clean) && clean.length <= 3)) {
      return this.getNetworkMeta('DINERS')!;
    }

    // 6. Discover
    // - 6011, 644-649, 65
    // - 622126-622925
    if (
      /^6011/.test(clean) ||
      /^64[4-9]/.test(clean) ||
      /^65/.test(clean) ||
      /^622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[01][0-9]|92[0-5])/.test(clean)
    ) {
      return this.getNetworkMeta('DISCOVER')!;
    }

    // 7. JCB
    // - 3528-3589
    if (prefix4 >= 3528 && prefix4 <= 3589 || (/^35/.test(clean) && clean.length <= 3)) {
      return this.getNetworkMeta('JCB')!;
    }

    // 8. Maestro
    // - 50, 56-58, 6759, 6761-6763
    if (/^(50|5[6-8]|6759|676[1-3])/.test(clean)) {
      return this.getNetworkMeta('MAESTRO')!;
    }

    // 9. UnionPay
    // - 62
    if (/^62/.test(clean)) {
      return this.getNetworkMeta('UNIONPAY')!;
    }

    return null;
  }

  /**
   * Returns true if the user has entered enough digits (>= 4) and it could not be
   * matched to any recognized card network.
   */
  isUnrecognizedNetwork(cardNumber: string | null | undefined): boolean {
    if (!cardNumber) return false;
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 4) return false;
    return this.detectCard(cardNumber) === null;
  }

  /**
   * Formats the card number with appropriate gaps as the user types
   * e.g. 4-6-5 for Amex, 4-6-4 for Diners, 4-4-4-4 for Visa/Mastercard/RuPay
   */
  formatCardNumber(cardNumber: string | null | undefined): string {
    if (!cardNumber) return '';
    const clean = cardNumber.replace(/\D/g, '');
    if (!clean) return '';

    const meta = this.detectCard(clean);
    const gaps = meta ? meta.gaps : [4, 8, 12];
    const maxLength = meta ? Math.max(...meta.lengths) : 19;
    const truncated = clean.slice(0, maxLength);

    const parts: string[] = [];
    let prevIndex = 0;

    for (const gap of gaps) {
      if (truncated.length > gap) {
        parts.push(truncated.substring(prevIndex, gap));
        prevIndex = gap;
      }
    }
    parts.push(truncated.substring(prevIndex));

    return parts.filter(p => p.length > 0).join(' ');
  }

  /**
   * Retrieves card metadata by network identifier.
   */
  getNetworkMeta(network: CardNetwork): CardNetworkMeta | undefined {
    return this.networks.find(n => n.network === network);
  }

  /**
   * Returns all supported networks list for informational display.
   */
  getAllSupportedNetworks(): CardNetworkMeta[] {
    return [...this.networks];
  }

  /**
   * Generic default card icon SVG when no network is identified or input is empty.
   */
  getGenericCardSvg(): string {
    return `<svg viewBox="0 0 48 30" width="48" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="30" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <rect x="0" y="6" width="48" height="5" fill="#475569"/>
      <rect x="6" y="17" width="10" height="6" rx="1.5" fill="#f59e0b"/>
      <rect x="20" y="19" width="18" height="2" rx="1" fill="#64748b"/>
    </svg>`;
  }
}
