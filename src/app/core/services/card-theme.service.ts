import { Injectable } from '@angular/core';

export interface CardTheme {
  id: string;
  productName: string;
  bankName: string;
  coBrandName?: string;
  coBrandLogoSvg?: string;
  background: string;
  artOverlaySvg?: string;
  textColor: string;
  chipColor: 'gold' | 'silver' | 'bronze';
  accentGlow: string;
  cardTypeBadgeBg?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardThemeService {
  /**
   * Resolves the visual theme for any payment card worldwide:
   * 1. 6-digit BIN prefix (exact card program allocation)
   * 2. Card product name keywords in nickname/bank
   * 3. Bank-specific flagship design
   * 4. Algorithmic procedural luxury generator for unlisted cards
   */
  resolveTheme(
    cardNumber: string | null | undefined,
    bankName: string | null | undefined,
    nickname: string | null | undefined,
    category: 'CREDIT_CARD' | 'DEBIT_CARD' = 'CREDIT_CARD'
  ): CardTheme {
    const cleanNumber = (cardNumber || '').replace(/\D/g, '');
    const prefix6 = cleanNumber.length >= 6 ? cleanNumber.substring(0, 6) : '';
    const bank = (bankName || '').toLowerCase().trim();
    const nick = (nickname || '').toLowerCase().trim();
    const combined = `${bank} ${nick}`;

    // --- 1. AXIS BANK PRODUCTS ---
    // Axis IndianOil (RuPay / Platinum)
    if (
      prefix6 === '652922' ||
      (combined.includes('axis') && (combined.includes('indianoil') || combined.includes('indian oil') || combined.includes('ioc'))) ||
      nick.includes('indianoil') ||
      nick.includes('indian oil')
    ) {
      return this.getAxisIndianOilTheme();
    }

    // Flipkart Axis Bank
    if (
      ['451417', '533467'].includes(prefix6) ||
      nick.includes('flipkart')
    ) {
      return this.getFlipkartAxisTheme();
    }

    // Axis Magnus / Magnus Burgundy
    if (nick.includes('magnus')) {
      return this.getAxisMagnusTheme();
    }

    // Axis Atlas (Aviation / Miles)
    if (nick.includes('atlas')) {
      return this.getAxisAtlasTheme();
    }

    // Airtel Axis Bank
    if (nick.includes('airtel')) {
      return this.getAirtelAxisTheme();
    }

    // Axis Ace / Neo / My Zone
    if (nick.includes('ace') && combined.includes('axis')) {
      return this.getAxisAceTheme();
    }
    if (nick.includes('neo') && combined.includes('axis')) {
      return this.getAxisNeoTheme();
    }
    if (nick.includes('my zone') || nick.includes('myzone')) {
      return this.getAxisMyZoneTheme();
    }

    // --- 2. HDFC BANK PRODUCTS ---
    // HDFC Millennia
    if (
      ['437551', '524193', '405234'].includes(prefix6) ||
      nick.includes('millennia') ||
      nick.includes('millenia')
    ) {
      return this.getHdfcMillenniaTheme();
    }

    // HDFC Pixel (Play / Go RuPay)
    if (
      ['607993', '652174'].includes(prefix6) ||
      nick.includes('pixel') ||
      nick.includes('pixel play')
    ) {
      return this.getHdfcPixelTheme();
    }

    // HDFC Regalia / Regalia Gold
    if (
      ['416644', '428884', '414744'].includes(prefix6) ||
      nick.includes('regalia')
    ) {
      return this.getHdfcRegaliaTheme();
    }

    // HDFC Infinia (Metal)
    if (nick.includes('infinia')) {
      return this.getHdfcInfiniaTheme();
    }

    // HDFC Tata Neu (Infinity / Plus RuPay)
    if (nick.includes('tata neu') || nick.includes('neu infinity') || nick.includes('neu plus')) {
      return this.getHdfcTataNeuTheme();
    }

    // Swiggy HDFC Bank
    if (nick.includes('swiggy')) {
      return this.getSwiggyHdfcTheme();
    }

    // HDFC Diners Club Black / Privilege
    if (combined.includes('diners') && combined.includes('black')) {
      return this.getHdfcDinersBlackTheme();
    }

    // HDFC MoneyBack / Freedom
    if (nick.includes('moneyback') || nick.includes('freedom')) {
      return this.getHdfcMoneybackTheme();
    }

    // --- 3. SBI CARD PRODUCTS ---
    // SBI BPCL Octane
    if (
      ['405078', '472643'].includes(prefix6) ||
      nick.includes('octane') ||
      (combined.includes('bpcl') && combined.includes('sbi')) ||
      nick.includes('bpcl')
    ) {
      return this.getSbiBpclOctaneTheme();
    }

    // SBI Cashback Card (5% Cashback)
    if (
      ['423377', '409000'].includes(prefix6) ||
      nick.includes('cashback') && (combined.includes('sbi') || combined.includes('state bank')) ||
      nick.includes('sbi cashback')
    ) {
      return this.getSbiCashbackTheme();
    }

    // SBI SimplyCLICK
    if (nick.includes('simplyclick') || nick.includes('simply click')) {
      return this.getSbiSimplyClickTheme();
    }

    // SBI SimplySAVE
    if (nick.includes('simplysave') || nick.includes('simply save')) {
      return this.getSbiSimplySaveTheme();
    }

    // SBI Elite / Aurum / Prime
    if (nick.includes('aurum')) {
      return this.getSbiAurumTheme();
    }
    if (nick.includes('elite') || nick.includes('prime')) {
      return this.getSbiEliteTheme();
    }

    // --- 4. ICICI BANK PRODUCTS ---
    // ICICI Coral (Amex / Visa / RuPay / Mastercard)
    if (
      ['376940', '652183'].includes(prefix6) ||
      nick.includes('coral') ||
      (combined.includes('icici') && combined.includes('amex'))
    ) {
      return this.getIciciCoralTheme();
    }

    // Amazon Pay ICICI Bank
    if (nick.includes('amazon') || nick.includes('amazon pay')) {
      return this.getAmazonPayIciciTheme();
    }

    // ICICI Rubyx / Sapphiro / Emeralde
    if (nick.includes('rubyx')) {
      return this.getIciciRubyxTheme();
    }
    if (nick.includes('sapphiro')) {
      return this.getIciciSapphiroTheme();
    }
    if (nick.includes('emeralde')) {
      return this.getIciciEmeraldeTheme();
    }

    // --- 5. KOTAK MAHINDRA BANK PRODUCTS ---
    // Kotak League Platinum
    if (
      ['414720', '485458'].includes(prefix6) ||
      nick.includes('league') ||
      (combined.includes('kotak') && combined.includes('league'))
    ) {
      return this.getKotakLeagueTheme();
    }

    // Kotak Mojo / Zen / White
    if (nick.includes('mojo') || nick.includes('zen') || nick.includes('white')) {
      return this.getKotakMojoTheme();
    }

    // Kotak PVR INOX
    if (nick.includes('pvr') || nick.includes('inox')) {
      return this.getKotakPvrTheme();
    }

    // --- 6. IDFC FIRST BANK PRODUCTS ---
    if (combined.includes('idfc') || combined.includes('first bank')) {
      return this.getIdfcFirstTheme(nick);
    }

    // --- 7. ONECARD (METAL) ---
    if (nick.includes('onecard') || nick.includes('one card')) {
      return this.getOneCardTheme();
    }

    // --- 8. INDUSIND BANK PRODUCTS ---
    if (combined.includes('indusind') || nick.includes('legend') || nick.includes('tiger')) {
      return this.getIndusIndTheme(nick);
    }

    // --- 9. RBL BANK PRODUCTS ---
    if (combined.includes('rbl') || nick.includes('shoprite') || nick.includes('cookies')) {
      return this.getRblBankTheme();
    }

    // --- 10. AU SMALL FINANCE BANK ---
    if (combined.includes('au bank') || combined.includes('au small') || nick.includes('lit') || nick.includes('zenith')) {
      return this.getAuBankTheme();
    }

    // --- 11. BANK OF BARODA (BOB) ---
    if (combined.includes('baroda') || combined.includes('bob')) {
      return this.getBobTheme();
    }

    // --- 12. PUNJAB NATIONAL BANK (PNB) ---
    if (combined.includes('pnb') || combined.includes('punjab national')) {
      return this.getPnbTheme();
    }

    // --- 13. CANARA BANK & UNION BANK ---
    if (combined.includes('canara')) {
      return this.getCanaraTheme();
    }
    if (combined.includes('union bank')) {
      return this.getUnionBankTheme();
    }
    if (combined.includes('federal')) {
      return this.getFederalBankTheme();
    }

    // --- 14. STANDARD CHARTERED & HSBC & AMEX ---
    if (combined.includes('standard chartered') || combined.includes('scb')) {
      return this.getStandardCharteredTheme();
    }
    if (combined.includes('hsbc')) {
      return this.getHsbcTheme();
    }
    if (combined.includes('american express') || combined.includes('amex')) {
      return this.getAmexDefaultTheme();
    }

    // --- 15. BANK-SPECIFIC FLAGSHIP FALLBACKS ---
    if (bank.includes('axis')) return this.getAxisBankDefaultTheme();
    if (bank.includes('hdfc')) return this.getHdfcBankDefaultTheme();
    if (bank.includes('state bank') || bank.includes('sbi')) return this.getSbiBankDefaultTheme();
    if (bank.includes('icici')) return this.getIciciBankDefaultTheme();
    if (bank.includes('kotak')) return this.getKotakBankDefaultTheme();

    // --- 16. DETERMINISTIC PROCEDURAL LUXURY GENERATOR FOR ALL OTHER CARDS ---
    return this.getProceduralTheme(bankName || '', nickname || '', category);
  }

  /* =============================================================
   * CARD PRODUCT THEMES
   * ============================================================= */

  private getAxisIndianOilTheme(): CardTheme {
    return {
      id: 'axis-indianoil',
      productName: 'Axis Bank IndianOil',
      bankName: 'Axis Bank',
      coBrandName: 'IndianOil',
      background: 'linear-gradient(135deg, #090a0f 0%, #15161f 50%, #0d0e14 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(217, 70, 239, 0.45)',
      cardTypeBadgeBg: 'rgba(217, 70, 239, 0.25)',
      coBrandLogoSvg: `
        <svg viewBox="0 0 68 22" width="68" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="68" height="22" rx="4" fill="#0c2340" stroke="#f97316" stroke-width="0.8"/>
          <circle cx="11" cy="11" r="7" fill="#f97316"/>
          <circle cx="11" cy="11" r="5" fill="#0c2340"/>
          <rect x="7" y="10" width="8" height="2" fill="#f97316"/>
          <text x="22" y="14" font-family="'Helvetica Neue', Arial, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" letter-spacing="0.4">IndianOil</text>
        </svg>
      `,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="speedo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.8"/>
              <stop offset="50%" stop-color="#d946ef" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.6"/>
            </linearGradient>
            <radialGradient id="fuel-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ec4899" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="240" cy="150" r="130" fill="url(#fuel-glow)"/>
          <path d="M 100 240 A 150 150 0 0 1 360 210" stroke="url(#speedo-glow)" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M 120 230 A 130 130 0 0 1 345 200" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="6 6" fill="none"/>
          <circle cx="270" cy="225" r="28" fill="#1e1b4b" stroke="#d946ef" stroke-width="3"/>
          <circle cx="270" cy="225" r="14" fill="#d946ef"/>
          <line x1="270" y1="225" x2="345" y2="130" stroke="#f43f5e" stroke-width="4.5" stroke-linecap="round"/>
          <text x="325" y="210" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="900" fill="#f43f5e" opacity="0.85">F</text>
          <text x="135" y="235" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="900" fill="#ffffff" opacity="0.5">E</text>
        </svg>
      `
    };
  }

  private getHdfcMillenniaTheme(): CardTheme {
    return {
      id: 'hdfc-millennia',
      productName: 'HDFC Bank Millennia',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #071933 0%, #0d2e5c 40%, #0a1f3d 70%, #040c1a 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(56, 189, 248, 0.4)',
      cardTypeBadgeBg: 'rgba(56, 189, 248, 0.25)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.2em; color:#38bdf8; text-transform:uppercase;">MILLENNIA</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="160" y1="0" x2="420" y2="180" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.35"/>
          <line x1="220" y1="0" x2="420" y2="140" stroke="#818cf8" stroke-width="1.5" stroke-opacity="0.45"/>
          <line x1="280" y1="0" x2="420" y2="100" stroke="#c084fc" stroke-width="1.2" stroke-opacity="0.35"/>
          <circle cx="340" cy="80" r="70" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="4 4"/>
        </svg>
      `
    };
  }

  private getHdfcPixelTheme(): CardTheme {
    return {
      id: 'hdfc-pixel',
      productName: 'HDFC Bank Pixel',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #18052e 0%, #3b0764 45%, #581c87 75%, #0f021c 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(192, 132, 252, 0.5)',
      cardTypeBadgeBg: 'rgba(236, 72, 153, 0.3)',
      coBrandLogoSvg: `<span style="font-family:monospace; font-size:11px; font-weight:900; letter-spacing:0.18em; color:#ec4899; text-shadow:0 0 8px #ec4899;">[PIXEL]</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 8-Bit Cyber Pixel Blocks -->
          <g fill="#ec4899" fill-opacity="0.3">
            <rect x="290" y="20" width="12" height="12"/>
            <rect x="302" y="20" width="12" height="12" fill="#a855f7" fill-opacity="0.5"/>
            <rect x="314" y="20" width="12" height="12"/>
            <rect x="302" y="32" width="12" height="12"/>
            <rect x="326" y="32" width="12" height="12" fill="#06b6d4" fill-opacity="0.4"/>
          </g>
          <line x1="240" y1="0" x2="420" y2="180" stroke="#ec4899" stroke-width="1.2" stroke-opacity="0.35"/>
          <line x1="280" y1="0" x2="420" y2="140" stroke="#06b6d4" stroke-width="1.5" stroke-opacity="0.4"/>
        </svg>
      `
    };
  }

  private getHdfcRegaliaTheme(): CardTheme {
    return {
      id: 'hdfc-regalia',
      productName: 'HDFC Regalia Gold',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #0a0b10 0%, #161824 45%, #232738 75%, #07080c 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(234, 179, 8, 0.4)',
      cardTypeBadgeBg: 'rgba(234, 179, 8, 0.25)',
      coBrandLogoSvg: `<span style="font-family:'Cinzel', serif; font-size:10px; font-weight:800; letter-spacing:0.25em; color:#eab308;">REGALIA GOLD</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="320,30 360,50 360,95 320,115 280,95 280,50" stroke="#eab308" stroke-width="1.5" stroke-opacity="0.35" fill="none"/>
          <circle cx="320" cy="72" r="30" stroke="#eab308" stroke-width="1" stroke-opacity="0.2"/>
        </svg>
      `
    };
  }

  private getHdfcInfiniaTheme(): CardTheme {
    return {
      id: 'hdfc-infinia',
      productName: 'HDFC Infinia Metal',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #050505 0%, #121212 50%, #030303 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(212, 175, 55, 0.45)',
      cardTypeBadgeBg: 'rgba(212, 175, 55, 0.2)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:11px; font-weight:900; letter-spacing:0.3em; color:#d4af37;">INFINIA</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="130" x2="420" y2="130" stroke="#d4af37" stroke-width="0.8" stroke-opacity="0.2"/>
          <rect x="30" y="25" width="360" height="215" rx="12" stroke="#d4af37" stroke-width="0.8" stroke-opacity="0.15"/>
        </svg>
      `
    };
  }

  private getHdfcTataNeuTheme(): CardTheme {
    return {
      id: 'hdfc-tata-neu',
      productName: 'Tata Neu Infinity HDFC',
      bankName: 'HDFC Bank',
      coBrandName: 'Tata Neu',
      background: 'linear-gradient(135deg, #16072b 0%, #340e59 45%, #4c1d95 75%, #0b0217 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(168, 85, 247, 0.45)',
      cardTypeBadgeBg: 'rgba(168, 85, 247, 0.25)',
      coBrandLogoSvg: `
        <span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:11px; font-weight:900; letter-spacing:0.15em; color:#c084fc;">TATA <strong style="color:#f59e0b;">neu</strong></span>
      `,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Infinity Loop Geometric Accent -->
          <path d="M 280 80 C 310 50 350 50 350 80 C 350 110 310 110 280 80 C 250 50 210 50 210 80 C 210 110 250 110 280 80 Z" stroke="#c084fc" stroke-width="2.5" stroke-opacity="0.4" fill="none"/>
        </svg>
      `
    };
  }

  private getSwiggyHdfcTheme(): CardTheme {
    return {
      id: 'swiggy-hdfc',
      productName: 'Swiggy HDFC Bank',
      bankName: 'HDFC Bank',
      coBrandName: 'Swiggy',
      background: 'linear-gradient(135deg, #1a0802 0%, #3d1607 45%, #fc8019 95%, #0d0401 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(252, 128, 25, 0.5)',
      cardTypeBadgeBg: 'rgba(252, 128, 25, 0.3)',
      coBrandLogoSvg: `
        <svg viewBox="0 0 65 20" width="65" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="65" height="20" rx="3" fill="#fc8019"/>
          <text x="7" y="14" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9" font-weight="900" fill="#ffffff" letter-spacing="0.5">SWIGGY</text>
        </svg>
      `
    };
  }

  private getHdfcDinersBlackTheme(): CardTheme {
    return {
      id: 'hdfc-diners-black',
      productName: 'HDFC Diners Club Black',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #0d0f12 0%, #1a1e24 45%, #090a0d 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(255, 255, 255, 0.3)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:9.5px; font-weight:800; letter-spacing:0.2em; color:#e2e8f0;">DINERS BLACK</span>`
    };
  }

  private getHdfcMoneybackTheme(): CardTheme {
    return {
      id: 'hdfc-moneyback',
      productName: 'HDFC MoneyBack+',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #061938 0%, #0d387a 50%, #041024 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(59, 130, 246, 0.4)'
    };
  }

  private getSbiBpclOctaneTheme(): CardTheme {
    return {
      id: 'sbi-bpcl-octane',
      productName: 'SBI Card BPCL Octane',
      bankName: 'State Bank of India',
      coBrandName: 'BPCL Octane',
      background: 'linear-gradient(135deg, #180306 0%, #7f1d1d 40%, #991b1b 65%, #100204 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(239, 68, 68, 0.45)',
      cardTypeBadgeBg: 'rgba(239, 68, 68, 0.3)',
      coBrandLogoSvg: `
        <svg viewBox="0 0 74 22" width="74" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="74" height="22" rx="4" fill="#180406" stroke="#f59e0b" stroke-width="0.8"/>
          <text x="6" y="15" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" font-weight="900" fill="#f59e0b">BPCL</text>
          <text x="35" y="15" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" font-weight="900" fill="#ef4444">OCTANE</text>
        </svg>
      `,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 120 265 Q 260 140 380 90 T 420 40" stroke="#ef4444" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.6"/>
          <circle cx="340" cy="180" r="60" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.4"/>
        </svg>
      `
    };
  }

  private getSbiCashbackTheme(): CardTheme {
    return {
      id: 'sbi-cashback',
      productName: 'SBI Cashback Card',
      bankName: 'State Bank of India',
      background: 'linear-gradient(135deg, #021e38 0%, #033c6e 45%, #0284c7 85%, #011222 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(14, 165, 233, 0.45)',
      cardTypeBadgeBg: 'rgba(14, 165, 233, 0.3)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#38bdf8;">5% CASHBACK</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Geometric Cashback Coin Rings -->
          <circle cx="330" cy="110" r="50" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.35"/>
          <circle cx="330" cy="110" r="35" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.25" stroke-dasharray="4 4"/>
          <text x="318" y="117" font-family="'Helvetica Neue', Arial, sans-serif" font-size="20" font-weight="900" fill="#38bdf8" fill-opacity="0.35">%</text>
        </svg>
      `
    };
  }

  private getSbiSimplyClickTheme(): CardTheme {
    return {
      id: 'sbi-simplyclick',
      productName: 'SBI SimplyCLICK',
      bankName: 'State Bank of India',
      background: 'linear-gradient(135deg, #04162e 0%, #0c336b 50%, #030e20 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(59, 130, 246, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.1em; color:#60a5fa;">SIMPLY<strong style="color:#f59e0b;">CLICK</strong></span>`
    };
  }

  private getSbiSimplySaveTheme(): CardTheme {
    return {
      id: 'sbi-simplysave',
      productName: 'SBI SimplySAVE',
      bankName: 'State Bank of India',
      background: 'linear-gradient(135deg, #1c0512 0%, #4a0d31 45%, #6b1447 75%, #0f0209 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(219, 39, 119, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.1em; color:#f472b6;">SIMPLY<strong style="color:#eab308;">SAVE</strong></span>`
    };
  }

  private getSbiEliteTheme(): CardTheme {
    return {
      id: 'sbi-elite',
      productName: 'SBI Card Elite',
      bankName: 'State Bank of India',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #181926 50%, #06060a 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(234, 179, 8, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Cinzel', serif; font-size:10.5px; font-weight:900; letter-spacing:0.25em; color:#eab308;">ELITE</span>`
    };
  }

  private getSbiAurumTheme(): CardTheme {
    return {
      id: 'sbi-aurum',
      productName: 'SBI Aurum Metal',
      bankName: 'State Bank of India',
      background: 'linear-gradient(135deg, #050505 0%, #171612 50%, #000000 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(212, 175, 55, 0.5)',
      coBrandLogoSvg: `<span style="font-family:'Cinzel', serif; font-size:12px; font-weight:900; letter-spacing:0.35em; color:#d4af37;">AURUM</span>`
    };
  }

  private getKotakLeagueTheme(): CardTheme {
    return {
      id: 'kotak-league',
      productName: 'Kotak League Platinum',
      bankName: 'Kotak Mahindra Bank',
      background: 'linear-gradient(135deg, #0b0c10 0%, #171821 45%, #222431 70%, #08080c 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(239, 68, 68, 0.35)',
      cardTypeBadgeBg: 'rgba(239, 68, 68, 0.2)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:9.5px; font-weight:900; letter-spacing:0.18em; color:#e2e8f0;">LEAGUE PLATINUM</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 280 20 C 360 40 400 100 400 180" stroke="#dc2626" stroke-width="3" stroke-opacity="0.65" fill="none"/>
          <polygon points="350,70 380,85 380,120 350,140 320,120 320,85" stroke="#94a3b8" stroke-width="1.5" stroke-opacity="0.4" fill="none"/>
        </svg>
      `
    };
  }

  private getKotakMojoTheme(): CardTheme {
    return {
      id: 'kotak-mojo',
      productName: 'Kotak Mojo Platinum',
      bankName: 'Kotak Mahindra Bank',
      background: 'linear-gradient(135deg, #1a0609 0%, #3d0d14 50%, #0d0204 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(239, 68, 68, 0.35)'
    };
  }

  private getKotakPvrTheme(): CardTheme {
    return {
      id: 'kotak-pvr',
      productName: 'Kotak PVR INOX',
      bankName: 'Kotak Mahindra Bank',
      coBrandName: 'PVR INOX',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1b172b 50%, #06060a 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(234, 179, 8, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#f59e0b;">PVR INOX</span>`
    };
  }

  private getIciciCoralTheme(): CardTheme {
    return {
      id: 'icici-coral',
      productName: 'ICICI Bank Coral',
      bankName: 'ICICI Bank',
      background: 'linear-gradient(135deg, #091a26 0%, #16364a 45%, #1b455c 70%, #06111a 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(45, 212, 191, 0.4)',
      cardTypeBadgeBg: 'rgba(45, 212, 191, 0.25)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.2em; color:#2dd4bf;">CORAL</span>`,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 120 265 C 220 180 260 110 380 50" stroke="#2dd4bf" stroke-width="4" stroke-opacity="0.4" fill="none"/>
        </svg>
      `
    };
  }

  private getAmazonPayIciciTheme(): CardTheme {
    return {
      id: 'amazon-pay-icici',
      productName: 'Amazon Pay ICICI Bank',
      bankName: 'ICICI Bank',
      coBrandName: 'Amazon Pay',
      background: 'linear-gradient(135deg, #10151d 0%, #1f2733 45%, #2a3444 75%, #0b0e14 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(245, 158, 11, 0.4)',
      cardTypeBadgeBg: 'rgba(245, 158, 11, 0.25)',
      coBrandLogoSvg: `
        <svg viewBox="0 0 68 20" width="68" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="68" height="20" rx="3" fill="#232f3e"/>
          <text x="6" y="14" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" font-weight="900" fill="#ffffff">amazon</text>
          <text x="44" y="14" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" font-weight="900" fill="#f59e0b">pay</text>
        </svg>
      `
    };
  }

  private getIciciRubyxTheme(): CardTheme {
    return {
      id: 'icici-rubyx',
      productName: 'ICICI Bank Rubyx',
      bankName: 'ICICI Bank',
      background: 'linear-gradient(135deg, #240507 0%, #590f15 45%, #180305 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(225, 29, 72, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.2em; color:#f43f5e;">RUBYX</span>`
    };
  }

  private getIciciSapphiroTheme(): CardTheme {
    return {
      id: 'icici-sapphiro',
      productName: 'ICICI Bank Sapphiro',
      bankName: 'ICICI Bank',
      background: 'linear-gradient(135deg, #051329 0%, #0d2c5e 45%, #030d1c 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(59, 130, 246, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.2em; color:#60a5fa;">SAPPHIRO</span>`
    };
  }

  private getIciciEmeraldeTheme(): CardTheme {
    return {
      id: 'icici-emeralde',
      productName: 'ICICI Bank Emeralde Metal',
      bankName: 'ICICI Bank',
      background: 'linear-gradient(135deg, #021a11 0%, #073825 45%, #01120b 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(16, 185, 129, 0.45)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10.5px; font-weight:900; letter-spacing:0.2em; color:#34d399;">EMERALDE</span>`
    };
  }

  private getFlipkartAxisTheme(): CardTheme {
    return {
      id: 'flipkart-axis',
      productName: 'Flipkart Axis Bank',
      bankName: 'Axis Bank',
      coBrandName: 'Flipkart',
      background: 'linear-gradient(135deg, #091c36 0%, #153869 45%, #0d2342 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(59, 130, 246, 0.4)',
      coBrandLogoSvg: `
        <svg viewBox="0 0 62 20" width="62" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="62" height="20" rx="3" fill="#2874f0"/>
          <text x="6" y="14" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8.5" font-weight="900" fill="#ffffff">Flipkart</text>
          <circle cx="53" cy="10" r="3.5" fill="#ffe500"/>
        </svg>
      `
    };
  }

  private getAxisMagnusTheme(): CardTheme {
    return {
      id: 'axis-magnus',
      productName: 'Axis Bank Magnus',
      bankName: 'Axis Bank',
      background: 'linear-gradient(135deg, #260514 0%, #520b2a 45%, #7a123f 75%, #14020a 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(244, 114, 182, 0.45)',
      coBrandLogoSvg: `<span style="font-family:'Cinzel', serif; font-size:11px; font-weight:900; letter-spacing:0.25em; color:#f472b6;">MAGNUS</span>`
    };
  }

  private getAxisAtlasTheme(): CardTheme {
    return {
      id: 'axis-atlas',
      productName: 'Axis Bank Atlas',
      bankName: 'Axis Bank',
      background: 'linear-gradient(135deg, #0c0d12 0%, #1b1c26 50%, #06070a 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(148, 163, 184, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10.5px; font-weight:900; letter-spacing:0.3em; color:#cbd5e1;">ATLAS</span>`
    };
  }

  private getAirtelAxisTheme(): CardTheme {
    return {
      id: 'airtel-axis',
      productName: 'Airtel Axis Bank',
      bankName: 'Axis Bank',
      coBrandName: 'Airtel',
      background: 'linear-gradient(135deg, #1f0707 0%, #471010 45%, #ef4444 95%, #100303 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(239, 68, 68, 0.45)',
      coBrandLogoSvg: `
        <span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.1em; color:#ef4444;">airtel</span>
      `
    };
  }

  private getAxisAceTheme(): CardTheme {
    return {
      id: 'axis-ace',
      productName: 'Axis Bank ACE',
      bankName: 'Axis Bank',
      background: 'linear-gradient(135deg, #061329 0%, #0e2a5c 45%, #00b4d8 90%, #030b17 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(0, 180, 216, 0.4)'
    };
  }

  private getAxisNeoTheme(): CardTheme {
    return {
      id: 'axis-neo',
      productName: 'Axis Bank Neo',
      bankName: 'Axis Bank',
      background: 'linear-gradient(135deg, #170529 0%, #340c5c 50%, #0b0214 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(168, 85, 247, 0.4)'
    };
  }

  private getAxisMyZoneTheme(): CardTheme {
    return {
      id: 'axis-myzone',
      productName: 'Axis Bank My Zone',
      bankName: 'Axis Bank',
      background: 'linear-gradient(135deg, #240915 0%, #521532 50%, #12040a 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(236, 72, 153, 0.4)'
    };
  }

  private getIdfcFirstTheme(nick: string): CardTheme {
    return {
      id: 'idfc-first',
      productName: nick.includes('wealth') ? 'IDFC FIRST Wealth' : (nick.includes('select') ? 'IDFC FIRST Select' : 'IDFC FIRST Card'),
      bankName: 'IDFC FIRST Bank',
      background: 'linear-gradient(135deg, #0e1014 0%, #1e222b 45%, #2a303d 75%, #07080a 100%)',
      chipColor: nick.includes('wealth') ? 'gold' : 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(185, 28, 28, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#ef4444;">IDFC FIRST</span>`
    };
  }

  private getOneCardTheme(): CardTheme {
    return {
      id: 'onecard-metal',
      productName: 'OneCard Metal',
      bankName: 'OneCard',
      background: 'linear-gradient(135deg, #0a0a0c 0%, #16171d 50%, #050507 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(255, 255, 255, 0.35)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10.5px; font-weight:900; letter-spacing:0.1em; color:#ffffff;">one<strong style="color:#0ea5e9;">card</strong></span>`
    };
  }

  private getIndusIndTheme(nick: string): CardTheme {
    return {
      id: 'indusind-card',
      productName: nick.includes('legend') ? 'IndusInd Legend' : (nick.includes('tiger') ? 'IndusInd Tiger' : 'IndusInd Bank Card'),
      bankName: 'IndusInd Bank',
      background: 'linear-gradient(135deg, #1c1305 0%, #47310e 50%, #6e4c16 75%, #0f0a02 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(217, 119, 6, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:9.5px; font-weight:900; letter-spacing:0.15em; color:#f59e0b;">INDUSIND</span>`
    };
  }

  private getRblBankTheme(): CardTheme {
    return {
      id: 'rbl-bank',
      productName: 'RBL Bank Card',
      bankName: 'RBL Bank',
      background: 'linear-gradient(135deg, #091329 0%, #15274f 50%, #040914 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(59, 130, 246, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#3b82f6;">RBL BANK</span>`
    };
  }

  private getAuBankTheme(): CardTheme {
    return {
      id: 'au-bank',
      productName: 'AU Small Finance Bank',
      bankName: 'AU Small Finance Bank',
      background: 'linear-gradient(135deg, #1c082b 0%, #431268 50%, #0f0318 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(168, 85, 247, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.1em; color:#c084fc;">AU BANK</span>`
    };
  }

  private getBobTheme(): CardTheme {
    return {
      id: 'bob-bank',
      productName: 'Bank of Baroda Card',
      bankName: 'Bank of Baroda',
      background: 'linear-gradient(135deg, #240c03 0%, #572007 45%, #ea580c 90%, #120601 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(234, 88, 12, 0.45)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#f97316;">BOB</span>`
    };
  }

  private getPnbTheme(): CardTheme {
    return {
      id: 'pnb-bank',
      productName: 'Punjab National Bank Card',
      bankName: 'Punjab National Bank',
      background: 'linear-gradient(135deg, #1c1003 0%, #422607 45%, #ca8a04 85%, #0d0701 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(202, 138, 4, 0.4)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#eab308;">PNB</span>`
    };
  }

  private getCanaraTheme(): CardTheme {
    return {
      id: 'canara-bank',
      productName: 'Canara Bank Card',
      bankName: 'Canara Bank',
      background: 'linear-gradient(135deg, #031c26 0%, #073a4d 45%, #0284c7 90%, #010d12 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(14, 165, 233, 0.4)'
    };
  }

  private getUnionBankTheme(): CardTheme {
    return {
      id: 'union-bank',
      productName: 'Union Bank of India Card',
      bankName: 'Union Bank of India',
      background: 'linear-gradient(135deg, #1a0808 0%, #401313 45%, #dc2626 90%, #0d0404 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(220, 38, 38, 0.4)'
    };
  }

  private getFederalBankTheme(): CardTheme {
    return {
      id: 'federal-bank',
      productName: 'Federal Bank Card',
      bankName: 'Federal Bank',
      background: 'linear-gradient(135deg, #05162e 0%, #0c3166 45%, #f59e0b 95%, #020912 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(37, 99, 235, 0.4)'
    };
  }

  private getStandardCharteredTheme(): CardTheme {
    return {
      id: 'standard-chartered',
      productName: 'Standard Chartered Card',
      bankName: 'Standard Chartered',
      background: 'linear-gradient(135deg, #041926 0%, #07344f 45%, #059669 90%, #020d14 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(16, 185, 129, 0.4)'
    };
  }

  private getHsbcTheme(): CardTheme {
    return {
      id: 'hsbc-bank',
      productName: 'HSBC Card',
      bankName: 'HSBC',
      background: 'linear-gradient(135deg, #14171a 0%, #293036 50%, #0b0c0d 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(239, 68, 68, 0.35)',
      coBrandLogoSvg: `<span style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:0.15em; color:#ef4444;">HSBC</span>`
    };
  }

  private getAxisBankDefaultTheme(): CardTheme {
    return {
      id: 'axis-bank-default',
      productName: 'Axis Bank Card',
      bankName: 'Axis Bank',
      background: 'linear-gradient(135deg, #4d0a25 0%, #7e123e 45%, #97144d 75%, #2a0514 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(151, 20, 77, 0.4)'
    };
  }

  private getHdfcBankDefaultTheme(): CardTheme {
    return {
      id: 'hdfc-bank-default',
      productName: 'HDFC Bank Card',
      bankName: 'HDFC Bank',
      background: 'linear-gradient(135deg, #02162e 0%, #062b59 45%, #093f7e 75%, #020c1a 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(9, 63, 126, 0.4)'
    };
  }

  private getSbiBankDefaultTheme(): CardTheme {
    return {
      id: 'sbi-bank-default',
      productName: 'SBI Card',
      bankName: 'State Bank of India',
      background: 'linear-gradient(135deg, #081635 0%, #152e66 45%, #1e3f87 75%, #050d21 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(30, 63, 135, 0.4)'
    };
  }

  private getIciciBankDefaultTheme(): CardTheme {
    return {
      id: 'icici-bank-default',
      productName: 'ICICI Bank Card',
      bankName: 'ICICI Bank',
      background: 'linear-gradient(135deg, #3d0c07 0%, #681810 45%, #8c2016 75%, #1f0503 100%)',
      chipColor: 'gold',
      textColor: '#ffffff',
      accentGlow: 'rgba(140, 32, 22, 0.4)'
    };
  }

  private getKotakBankDefaultTheme(): CardTheme {
    return {
      id: 'kotak-bank-default',
      productName: 'Kotak Bank Card',
      bankName: 'Kotak Mahindra Bank',
      background: 'linear-gradient(135deg, #1c0507 0%, #3d0b10 45%, #590f17 75%, #0e0203 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(220, 38, 38, 0.35)'
    };
  }

  private getAmexDefaultTheme(): CardTheme {
    return {
      id: 'amex-default',
      productName: 'American Express Card',
      bankName: 'American Express',
      background: 'linear-gradient(135deg, #022345 0%, #004b87 45%, #0066b2 75%, #011429 100%)',
      chipColor: 'silver',
      textColor: '#ffffff',
      accentGlow: 'rgba(0, 102, 178, 0.4)'
    };
  }

  /* =============================================================
   * PROCEDURAL LUXURY THEME GENERATOR
   * Deterministically crafts a high-end card design for any card
   * ============================================================= */
  private getProceduralTheme(bankName: string, nickname: string, category: 'CREDIT_CARD' | 'DEBIT_CARD'): CardTheme {
    const rawKey = `${bankName} ${nickname}`.trim() || category;
    let hash = 0;
    for (let i = 0; i < rawKey.length; i++) {
      hash = (hash << 5) - hash + rawKey.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const luxuryPalettes = [
      {
        bg: 'linear-gradient(135deg, #0b0c10 0%, #171822 45%, #242738 75%, #07080b 100%)',
        glow: 'rgba(129, 140, 248, 0.35)',
        chip: 'silver' as const
      },
      {
        bg: 'linear-gradient(135deg, #061833 0%, #0d3266 50%, #13458c 75%, #030d1c 100%)',
        glow: 'rgba(56, 189, 248, 0.4)',
        chip: 'gold' as const
      },
      {
        bg: 'linear-gradient(135deg, #1b082e 0%, #3f116b 50%, #581896 75%, #0c0314 100%)',
        glow: 'rgba(192, 132, 252, 0.45)',
        chip: 'silver' as const
      },
      {
        bg: 'linear-gradient(135deg, #14171c 0%, #232833 50%, #303747 75%, #0a0b0d 100%)',
        glow: 'rgba(148, 163, 184, 0.35)',
        chip: 'silver' as const
      },
      {
        bg: 'linear-gradient(135deg, #06241a 0%, #0d4a36 50%, #126349 75%, #03120d 100%)',
        glow: 'rgba(52, 211, 153, 0.4)',
        chip: 'gold' as const
      },
      {
        bg: 'linear-gradient(135deg, #240915 0%, #541532 50%, #781d47 75%, #100409 100%)',
        glow: 'rgba(244, 114, 182, 0.4)',
        chip: 'gold' as const
      },
      {
        bg: 'linear-gradient(135deg, #211206 0%, #4a280e 50%, #6e3c15 75%, #0e0702 100%)',
        glow: 'rgba(245, 158, 11, 0.4)',
        chip: 'gold' as const
      },
      {
        bg: 'linear-gradient(135deg, #0c1a29 0%, #183452 50%, #244d7a 75%, #060d14 100%)',
        glow: 'rgba(59, 130, 246, 0.4)',
        chip: 'silver' as const
      },
      {
        bg: 'linear-gradient(135deg, #24070a 0%, #520f17 50%, #751621 75%, #120305 100%)',
        glow: 'rgba(239, 68, 68, 0.4)',
        chip: 'silver' as const
      },
      {
        bg: 'linear-gradient(135deg, #082124 0%, #11474d 50%, #19666e 75%, #041012 100%)',
        glow: 'rgba(45, 212, 191, 0.4)',
        chip: 'gold' as const
      }
    ];

    const palette = luxuryPalettes[absHash % luxuryPalettes.length];

    return {
      id: `procedural-${absHash % luxuryPalettes.length}`,
      productName: nickname || bankName || (category === 'DEBIT_CARD' ? 'Debit Card' : 'Credit Card'),
      bankName: bankName || 'Payment Card',
      background: palette.bg,
      chipColor: palette.chip,
      textColor: '#ffffff',
      accentGlow: palette.glow,
      artOverlaySvg: `
        <svg viewBox="0 0 420 265" width="100%" height="100%" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="340" cy="110" r="90" stroke="#ffffff" stroke-width="1" stroke-opacity="0.12" stroke-dasharray="6 6"/>
          <line x1="160" y1="265" x2="380" y2="0" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.12"/>
          <line x1="200" y1="265" x2="420" y2="0" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.08"/>
        </svg>
      `
    };
  }
}
