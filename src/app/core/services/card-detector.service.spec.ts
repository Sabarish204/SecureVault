import { describe, it, expect, beforeEach } from 'vitest';
import { CardDetectorService } from './card-detector.service';

describe('CardDetectorService', () => {
  let service: CardDetectorService;

  beforeEach(() => {
    service = new CardDetectorService();
  });

  it('should detect RuPay cards by various Indian BIN prefixes', () => {
    expect(service.detectCard('6061')?.network).toBe('RUPAY');
    expect(service.detectCard('6085')?.network).toBe('RUPAY');
    expect(service.detectCard('6521')?.network).toBe('RUPAY');
    expect(service.detectCard('6522')?.network).toBe('RUPAY');
    expect(service.detectCard('6529')?.network).toBe('RUPAY');
    expect(service.detectCard('6529123456789012')?.network).toBe('RUPAY');
    expect(service.detectCard('652150')?.network).toBe('RUPAY');
    expect(service.detectCard('6530')?.network).toBe('RUPAY');
    expect(service.detectCard('653149')?.network).toBe('RUPAY');
    expect(service.detectCard('5081')?.network).toBe('RUPAY');
    expect(service.detectCard('8123')?.network).toBe('RUPAY');
    expect(service.detectCard('8200')?.network).toBe('RUPAY');
  });

  it('should detect Visa cards starting with 4', () => {
    const card = service.detectCard('4111222233334444');
    expect(card?.network).toBe('VISA');
    expect(card?.name).toBe('Visa');
    expect(card?.code.name).toBe('CVV');
    expect(card?.code.size).toBe(3);
  });

  it('should detect Mastercard cards (51-55 and 2221-2720)', () => {
    expect(service.detectCard('5100')?.network).toBe('MASTERCARD');
    expect(service.detectCard('5599')?.network).toBe('MASTERCARD');
    expect(service.detectCard('2221')?.network).toBe('MASTERCARD');
    expect(service.detectCard('2720')?.network).toBe('MASTERCARD');
  });

  it('should detect American Express cards (34 or 37) with 4-digit CID', () => {
    const amex34 = service.detectCard('340012345678901');
    expect(amex34?.network).toBe('AMEX');
    expect(amex34?.name).toBe('American Express');
    expect(amex34?.code.size).toBe(4);
    expect(amex34?.lengths).toContain(15);
    expect(amex34?.gaps).toEqual([4, 10]);

    const amex37 = service.detectCard('3712');
    expect(amex37?.network).toBe('AMEX');
  });

  it('should detect Diners Club, Discover, JCB, Maestro, UnionPay', () => {
    expect(service.detectCard('3600')?.network).toBe('DINERS');
    expect(service.detectCard('3800')?.network).toBe('DINERS');
    expect(service.detectCard('3050')?.network).toBe('DINERS');
    expect(service.detectCard('6011')?.network).toBe('DISCOVER');
    expect(service.detectCard('6500')?.network).toBe('DISCOVER');
    expect(service.detectCard('652140')?.network).toBe('DISCOVER');
    expect(service.detectCard('653150')?.network).toBe('DISCOVER');
    expect(service.detectCard('6540')?.network).toBe('DISCOVER');
    expect(service.detectCard('3528')?.network).toBe('JCB');
    expect(service.detectCard('3530')?.network).toBe('JCB');
    expect(service.detectCard('3530111333300000')?.network).toBe('JCB');
    expect(service.detectCard('3589')?.network).toBe('JCB');
    expect(service.detectCard('35')?.network).toBe('JCB');
    expect(service.detectCard('5018')?.network).toBe('MAESTRO');
    expect(service.detectCard('6200')?.network).toBe('UNIONPAY');
  });

  it('should flag unrecognized network when card has 4 or more digits and matches nothing', () => {
    expect(service.isUnrecognizedNetwork('123')).toBe(false); // too short to flag
    expect(service.isUnrecognizedNetwork('9999')).toBe(true);
    expect(service.isUnrecognizedNetwork('77771234')).toBe(true);
    expect(service.isUnrecognizedNetwork('4111')).toBe(false); // Valid Visa
    expect(service.isUnrecognizedNetwork('6061')).toBe(false); // Valid RuPay
  });

  it('should auto-format card numbers according to brand gaps', () => {
    // Visa / Mastercard / RuPay: 4-4-4-4
    expect(service.formatCardNumber('4111222233334444')).toBe('4111 2222 3333 4444');
    // Amex: 4-6-5
    expect(service.formatCardNumber('340012345678901')).toBe('3400 123456 78901');
    // Diners 14 digits: 4-6-4
    expect(service.formatCardNumber('36001234567890')).toBe('3600 123456 7890');
  });

  it('should handle null, undefined, and empty inputs gracefully', () => {
    expect(service.detectCard('')).toBeNull();
    expect(service.detectCard(null)).toBeNull();
    expect(service.detectCard(undefined)).toBeNull();
    expect(service.formatCardNumber('')).toBe('');
    expect(service.isUnrecognizedNetwork('')).toBe(false);
  });
});
