import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  let service: NetworkStatusService;

  beforeEach(() => {
    service = new NetworkStatusService();
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should initialize with current navigator.onLine status', () => {
    expect(typeof service.isOnline()).toBe('boolean');
  });

  it('should update isOnline signal on online/offline window events', () => {
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBe(true);
  });

  it('should return false if navigator.onLine is false in checkConnectivity', async () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const result = await service.checkConnectivity();
    expect(result).toBe(false);
    expect(service.isOnline()).toBe(false);

    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
  });
});
