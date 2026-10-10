import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UnlockComponent } from './unlock.component';
import { VaultStateService } from '../../core/state/vault-state.service';
import { BiometricService } from '../../core/services/biometric.service';
import { signal } from '@angular/core';

describe('UnlockComponent', () => {
  let component: UnlockComponent;
  let fixture: ComponentFixture<UnlockComponent>;
  let vaultStateMock: any;
  let biometricMock: any;

  beforeEach(async () => {
    vaultStateMock = {
      isInitialized: signal(false),
      isUnlocked: signal(false),
      setupVault: vi.fn().mockResolvedValue(true),
      unlockVault: vi.fn().mockResolvedValue(true),
      resetEntireVault: vi.fn().mockResolvedValue(undefined)
    };

    biometricMock = {
      isEnabled: signal(false),
      isAvailable: signal(false),
      isAuthenticating: signal(false),
      biometryName: signal('Fingerprint'),
      authenticateAndGetPin: vi.fn().mockResolvedValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [UnlockComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: VaultStateService, useValue: vaultStateMock },
        { provide: BiometricService, useValue: biometricMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in setup mode when vault is not initialized', () => {
    expect(component).toBeTruthy();
    expect(component.isSetupMode()).toBe(true);
  });

  it('should require exactly 4 digits for master password', () => {
    component.setupForm.controls['masterPassword'].setValue('123');
    expect(component.setupForm.controls['masterPassword'].valid).toBe(false);

    component.setupForm.controls['masterPassword'].setValue('abcd');
    expect(component.setupForm.controls['masterPassword'].valid).toBe(false);

    component.setupForm.controls['masterPassword'].setValue('12345');
    expect(component.setupForm.controls['masterPassword'].valid).toBe(false);

    component.setupForm.controls['masterPassword'].setValue('1234');
    expect(component.setupForm.controls['masterPassword'].valid).toBe(true);
  });

  it('should validate matching confirmation password', () => {
    component.setupForm.controls['masterPassword'].setValue('1234');
    component.setupForm.controls['confirmPassword'].setValue('5678');
    expect(component.setupForm.valid).toBe(false);

    component.setupForm.controls['confirmPassword'].setValue('1234');
    expect(component.setupForm.valid).toBe(true);
  });

  describe('Unlock Mode (4-digit PIN Textboxes)', () => {
    beforeEach(() => {
      vaultStateMock.isInitialized.set(true);
      fixture.detectChanges();
    });

    it('should be in unlock mode when vault is initialized', () => {
      expect(component.isSetupMode()).toBe(false);
    });

    it('should render 4 pin input textboxes with numeric keyboard attributes', () => {
      const inputs = fixture.nativeElement.querySelectorAll('.pin-box');
      expect(inputs.length).toBe(4);

      inputs.forEach((input: HTMLInputElement) => {
        expect(input.getAttribute('inputmode')).toBe('numeric');
        expect(input.getAttribute('pattern')).toBe('[0-9]*');
        expect(input.getAttribute('maxlength')).toBe('1');
      });
    });

    it('should update unlockForm when digits are typed into textboxes', () => {
      const inputs = fixture.nativeElement.querySelectorAll('.pin-box');
      
      inputs[0].value = '1';
      inputs[0].dispatchEvent(new Event('input'));
      expect(component.pinDigits[0]).toBe('1');
      expect(component.unlockForm.get('masterPassword')?.value).toBe('1');

      inputs[1].value = '2';
      inputs[1].dispatchEvent(new Event('input'));
      expect(component.pinDigits[1]).toBe('2');

      inputs[2].value = '3';
      inputs[2].dispatchEvent(new Event('input'));
      expect(component.pinDigits[2]).toBe('3');

      inputs[3].value = '4';
      inputs[3].dispatchEvent(new Event('input'));
      expect(component.pinDigits[3]).toBe('4');
      expect(component.unlockForm.get('masterPassword')?.value).toBe('1234');
      expect(component.unlockForm.valid).toBe(true);
    });

    it('should prevent non-numeric keystrokes in onDigitKeyDown', () => {
      const eventA = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      const preventDefaultA = vi.spyOn(eventA, 'preventDefault');
      component.onDigitKeyDown(eventA, 0);
      expect(preventDefaultA).toHaveBeenCalled();

      const eventSymbol = new KeyboardEvent('keydown', { key: '$', cancelable: true });
      const preventDefaultSymbol = vi.spyOn(eventSymbol, 'preventDefault');
      component.onDigitKeyDown(eventSymbol, 0);
      expect(preventDefaultSymbol).toHaveBeenCalled();

      const eventDigit = new KeyboardEvent('keydown', { key: '7', cancelable: true });
      const preventDefaultDigit = vi.spyOn(eventDigit, 'preventDefault');
      component.onDigitKeyDown(eventDigit, 0);
      expect(preventDefaultDigit).not.toHaveBeenCalled();
    });

    it('should handle backspace navigation', () => {
      component.pinDigits = ['1', '2', '', ''];
      component.unlockForm.get('masterPassword')?.setValue('12');

      // Backspace on box 1 (which has '2')
      const event1 = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
      component.onDigitKeyDown(event1, 1);
      expect(component.pinDigits[1]).toBe('');
      expect(component.unlockForm.get('masterPassword')?.value).toBe('1');

      // Backspace on empty box 1 should move to box 0 and clear it
      const event0 = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
      component.onDigitKeyDown(event0, 1);
      expect(component.pinDigits[0]).toBe('');
      expect(component.unlockForm.get('masterPassword')?.value).toBe('');
    });

    it('should distribute pasted 4-digit PIN across textboxes and auto-submit', async () => {
      const unlockSpy = vi.spyOn(component, 'onUnlockSubmit');
      
      const pasteEvent = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: vi.fn().mockReturnValue('9876')
        }
      } as unknown as ClipboardEvent;

      component.onDigitPaste(pasteEvent);
      expect(pasteEvent.preventDefault).toHaveBeenCalled();
      expect(component.pinDigits).toEqual(['9', '8', '7', '6']);
      expect(component.unlockForm.get('masterPassword')?.value).toBe('9876');

      // Wait for auto-submit debounce
      await new Promise(r => setTimeout(r, 60));
      expect(unlockSpy).toHaveBeenCalled();
    });

    it('should shake and clear PIN when unlock fails', async () => {
      vaultStateMock.unlockVault.mockResolvedValueOnce(false);
      component.pinDigits = ['1', '2', '3', '4'];
      component.unlockForm.get('masterPassword')?.setValue('1234');

      await component.onUnlockSubmit();

      expect(component.errorMessage()).toContain('Incorrect master PIN');
      expect(component.isShaking()).toBe(true);
      expect(component.pinDigits).toEqual(['', '', '', '']);
    });

    it('should toggle password visibility between masked and plain text', () => {
      expect(component.showUnlockPassword()).toBe(false);
      component.showUnlockPassword.set(true);
      fixture.detectChanges();

      const inputs = fixture.nativeElement.querySelectorAll('.pin-box');
      inputs.forEach((input: HTMLInputElement) => {
        expect(input.type).toBe('text');
      });

      component.showUnlockPassword.set(false);
      fixture.detectChanges();
      inputs.forEach((input: HTMLInputElement) => {
        expect(input.type).toBe('password');
      });
    });
  });
});
