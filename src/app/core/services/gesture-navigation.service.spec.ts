import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GestureNavigationService } from './gesture-navigation.service';
import { FeedbackService } from './feedback.service';
import { GlobalSearchService } from './global-search.service';
import { VaultStateService } from '../state/vault-state.service';

describe('GestureNavigationService', () => {
  let service: GestureNavigationService;
  let locationMock: { back: any; forward: any };
  let routerMock: { url: string; events: { subscribe: any }; navigateByUrl: any };
  let feedbackMock: { isOpen: any; close: any };
  let globalSearchMock: { isDropdownOpen: any; closeDropdown: any };
  let vaultStateMock: { isUnlocked: any };

  beforeEach(() => {
    locationMock = {
      back: vi.fn(),
      forward: vi.fn()
    };

    routerMock = {
      url: '/settings',
      events: { subscribe: vi.fn() },
      navigateByUrl: vi.fn()
    };

    feedbackMock = {
      isOpen: vi.fn().mockReturnValue(false),
      close: vi.fn()
    };

    globalSearchMock = {
      isDropdownOpen: vi.fn().mockReturnValue(false),
      closeDropdown: vi.fn()
    };

    vaultStateMock = {
      isUnlocked: vi.fn().mockReturnValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        GestureNavigationService,
        { provide: Location, useValue: locationMock },
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: FeedbackService, useValue: feedbackMock },
        { provide: GlobalSearchService, useValue: globalSearchMock },
        { provide: VaultStateService, useValue: vaultStateMock }
      ]
    });

    service = TestBed.inject(GestureNavigationService);
  });

  it('should close Feedback modal if open instead of route change', () => {
    feedbackMock.isOpen.mockReturnValue(true);
    service.navigateBack();
    expect(feedbackMock.close).toHaveBeenCalled();
    expect(locationMock.back).not.toHaveBeenCalled();
  });

  it('should close Global Search dropdown if open instead of route change', () => {
    globalSearchMock.isDropdownOpen.mockReturnValue(true);
    service.navigateBack();
    expect(globalSearchMock.closeDropdown).toHaveBeenCalled();
    expect(locationMock.back).not.toHaveBeenCalled();
  });

  it('should navigate to dashboard as fallback when on subroute with empty history', () => {
    service.navigateBack();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
