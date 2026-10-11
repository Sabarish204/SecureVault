import { describe, it, expect, beforeEach } from 'vitest';
import { CardThemeService } from './card-theme.service';

describe('CardThemeService', () => {
  let service: CardThemeService;

  beforeEach(() => {
    service = new CardThemeService();
  });

  it('should detect Axis Bank IndianOil card from BIN 652922', () => {
    const theme = service.resolveTheme('6529221234567890', 'Axis Bank', 'Fuel Card');
    expect(theme.id).toBe('axis-indianoil');
    expect(theme.productName).toBe('Axis Bank IndianOil');
    expect(theme.coBrandName).toBe('IndianOil');
    expect(theme.artOverlaySvg).toContain('speedo-glow');
    expect(theme.chipColor).toBe('gold');
  });

  it('should detect Axis Bank IndianOil from nickname keywords even with arbitrary card number', () => {
    const theme = service.resolveTheme('6529000000000000', 'Axis Bank', 'Axis IndianOil Card');
    expect(theme.id).toBe('axis-indianoil');
  });

  it('should detect HDFC Millennia card by BIN and nickname', () => {
    const byBin = service.resolveTheme('4375510011223344', 'HDFC Bank', 'Personal');
    expect(byBin.id).toBe('hdfc-millennia');
    expect(byBin.chipColor).toBe('silver');

    const byNick = service.resolveTheme('4111222233334444', 'HDFC Bank', 'HDFC Millennia Credit');
    expect(byNick.id).toBe('hdfc-millennia');
  });

  it('should detect HDFC Pixel, Regalia, Infinia, Tata Neu, and Swiggy cards', () => {
    const pixel = service.resolveTheme('6079930011223344', 'HDFC Bank', 'HDFC Pixel Play');
    expect(pixel.id).toBe('hdfc-pixel');
    expect(pixel.coBrandLogoSvg).toContain('[PIXEL]');

    const regalia = service.resolveTheme('4166440011223344', 'HDFC Bank', 'HDFC Regalia Gold');
    expect(regalia.id).toBe('hdfc-regalia');
    expect(regalia.chipColor).toBe('gold');

    const infinia = service.resolveTheme('4111222233334444', 'HDFC Bank', 'HDFC Infinia Metal');
    expect(infinia.id).toBe('hdfc-infinia');

    const tataNeu = service.resolveTheme('4111222233334444', 'HDFC Bank', 'Tata Neu Infinity');
    expect(tataNeu.id).toBe('hdfc-tata-neu');

    const swiggy = service.resolveTheme('4111222233334444', 'HDFC Bank', 'Swiggy HDFC');
    expect(swiggy.id).toBe('swiggy-hdfc');
  });

  it('should detect SBI BPCL Octane, Cashback, and SimplyCLICK cards', () => {
    const octane = service.resolveTheme('4050780011223344', 'State Bank of India', 'BPCL Octane Card');
    expect(octane.id).toBe('sbi-bpcl-octane');

    const cashback = service.resolveTheme('4233770011223344', 'State Bank of India', 'SBI Cashback Card');
    expect(cashback.id).toBe('sbi-cashback');

    const simplyclick = service.resolveTheme('4111222233334444', 'State Bank of India', 'SimplyCLICK');
    expect(simplyclick.id).toBe('sbi-simplyclick');
  });

  it('should detect Axis Magnus, Atlas, and Flipkart cards', () => {
    const magnus = service.resolveTheme('4111222233334444', 'Axis Bank', 'Axis Magnus Burgundy');
    expect(magnus.id).toBe('axis-magnus');

    const atlas = service.resolveTheme('4111222233334444', 'Axis Bank', 'Axis Atlas');
    expect(atlas.id).toBe('axis-atlas');

    const flipkart = service.resolveTheme('4514170011223344', 'Axis Bank', 'Flipkart Axis');
    expect(flipkart.id).toBe('flipkart-axis');
  });

  it('should detect Kotak League and ICICI Coral cards', () => {
    const league = service.resolveTheme('4147200011223344', 'Kotak Mahindra Bank', 'League Platinum');
    expect(league.id).toBe('kotak-league');

    const coral = service.resolveTheme('376940001122334', 'ICICI Bank', 'ICICI Coral Amex');
    expect(coral.id).toBe('icici-coral');
  });

  it('should detect OneCard, IDFC FIRST, and IndusInd cards', () => {
    const oneCard = service.resolveTheme('4111222233334444', 'Federal Bank', 'OneCard Metal');
    expect(oneCard.id).toBe('onecard-metal');

    const idfc = service.resolveTheme('4111222233334444', 'IDFC FIRST Bank', 'Wealth Credit');
    expect(idfc.id).toBe('idfc-first');

    const indusind = service.resolveTheme('4111222233334444', 'IndusInd Bank', 'IndusInd Legend');
    expect(indusind.id).toBe('indusind-card');
  });

  it('should fallback to bank-level themes when specific product is not matched', () => {
    const axis = service.resolveTheme('4111222233334444', 'Axis Bank', 'My Card');
    expect(axis.id).toBe('axis-bank-default');

    const sbi = service.resolveTheme('4111222233334444', 'State Bank of India', 'Shopping');
    expect(sbi.id).toBe('sbi-bank-default');

    const hdfc = service.resolveTheme('4111222233334444', 'HDFC Bank', 'Emergency');
    expect(hdfc.id).toBe('hdfc-bank-default');
  });

  it('should generate a luxury procedural theme for unlisted banks and cards', () => {
    const custom1 = service.resolveTheme('4111222233334444', 'Saraswat Bank', 'Platinum RuPay');
    expect(custom1.id).toMatch(/^procedural-\d+$/);
    expect(custom1.background).toBeDefined();
    expect(custom1.accentGlow).toBeDefined();

    const custom2 = service.resolveTheme('4111222233334444', 'Cosmos Bank', 'Daily Card');
    expect(custom2.id).toMatch(/^procedural-\d+$/);
  });
});
