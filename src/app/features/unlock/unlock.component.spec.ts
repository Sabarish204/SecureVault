import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UnlockComponent } from './unlock.component';
import { VaultStateService } from '../../core/state/vault-state.service';
import { signal } from '@angular/core';

describe('UnlockComponent', () => {
  let component: UnlockComponent;
  let fixture: ComponentFixture<UnlockComponent>;
  let vaultStateMock: any;

  beforeEach(async () => {
    vaultStateMock = {
      isInitialized: signal(false),
      isUnlocked: signal(false),
      setupVault: vi.fn().mockResolvedValue(true),
      unlockVault: vi.fn().mockResolvedValue(true),
      resetEntireVault: vi.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [UnlockComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: VaultStateService, useValue: vaultStateMock }
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
});
