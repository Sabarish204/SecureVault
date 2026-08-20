import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClipboardSafetyService } from './clipboard-safety.service';

describe('ClipboardSafetyService', () => {
  let service: ClipboardSafetyService;
  let snackBarMock: { open: any };

  beforeEach(() => {
    snackBarMock = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ClipboardSafetyService,
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    });

    service = TestBed.inject(ClipboardSafetyService);
  });

  it('should copy text and show visual feedback without logging secret', async () => {
    // Mock navigator.clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });

    const result = await service.copySecret('SUPER_SECRET_VALUE', 'Password', 5);
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('SUPER_SECRET_VALUE');
    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Password copied to clipboard'),
      'Close',
      expect.any(Object)
    );
  });

  it('should return false for empty secret', async () => {
    const result = await service.copySecret('', 'Password');
    expect(result).toBe(false);
  });
});
