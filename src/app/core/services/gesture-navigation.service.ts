import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { FeedbackService } from './feedback.service';
import { GlobalSearchService } from './global-search.service';
import { VaultStateService } from '../state/vault-state.service';

@Injectable({
  providedIn: 'root'
})
export class GestureNavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly snackBar = inject(MatSnackBar);
  private readonly feedbackService = inject(FeedbackService);
  private readonly globalSearch = inject(GlobalSearchService);
  private readonly vaultState = inject(VaultStateService);

  private lastBackPressTime = 0;
  private readonly DOUBLE_TAP_EXIT_DELAY_MS = 2000;

  // Touch tracking for swipe navigation
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isSwipeGesture = false;

  // Navigation history tracking for intelligent forward/backward stack
  private historyStack: string[] = [];
  private forwardStack: string[] = [];
  private currentUrl = '';

  init(): void {
    this.trackNavigationHistory();
    this.initCapacitorBackButton();
    this.initTouchSwipeGestures();
  }

  /**
   * Tracks full forward and backward history stack so swipe forward/back works predictably
   */
  private trackNavigationHistory(): void {
    this.currentUrl = this.router.url;
    this.historyStack.push(this.currentUrl);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.urlAfterRedirects !== this.currentUrl) {
          this.historyStack.push(this.currentUrl);
          this.currentUrl = event.urlAfterRedirects;
        }
      }
    });
  }

  /**
   * Hardware Back Button listener for Android (Capacitor)
   * Prevents app from abruptly terminating.
   */
  private initCapacitorBackButton(): void {
    if (!Capacitor.isNativePlatform()) return;

    CapacitorApp.addListener('backButton', async ({ canGoBack }) => {
      // 1. If Feedback Modal is open, close it first
      if (this.feedbackService.isOpen()) {
        this.feedbackService.close();
        return;
      }

      // 2. If Global Search Dropdown is open, close it
      if (this.globalSearch.isDropdownOpen()) {
        this.globalSearch.closeDropdown();
        return;
      }

      // 3. If any Card Scanner or custom modal is open, close it
      const activeModalBackdrop = document.querySelector('.modal-backdrop, .scanner-backdrop') as HTMLElement;
      if (activeModalBackdrop) {
        const closeBtn = activeModalBackdrop.querySelector('.btn-close, .btn-modal-close') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // 4. If user is locked, allow exit directly or double tap
      if (!this.vaultState.isUnlocked()) {
        CapacitorApp.exitApp();
        return;
      }

      // 5. If user is on dashboard, handle double-tap back to exit
      const isDashboard = this.currentUrl === '/dashboard' || this.currentUrl === '/' || this.currentUrl === '';
      if (isDashboard) {
        const now = Date.now();
        if (now - this.lastBackPressTime < this.DOUBLE_TAP_EXIT_DELAY_MS) {
          CapacitorApp.exitApp();
        } else {
          this.lastBackPressTime = now;
          this.snackBar.open('Press back again to exit SecureVault', undefined, {
            duration: 2000,
            panelClass: 'snack-info'
          });
        }
        return;
      }

      // 6. Otherwise navigate to previous screen or fallback to dashboard
      this.navigateBack();
    });
  }

  /**
   * Initializes touch swipe gestures for native Android / iOS swipe navigation:
   * - Swipe from Left edge to Right: Back navigation
   * - Swipe from Right edge to Left: Forward navigation
   */
  private initTouchSwipeGestures(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];

        // Do not trigger gestures if user is interacting with form controls, sliders, or carousels
        const target = e.target as HTMLElement;
        if (
          target.closest(
            'input, textarea, select, button, .carousel, .category-chips, .range-slider, .card-3d'
          )
        ) {
          this.isSwipeGesture = false;
          return;
        }

        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isSwipeGesture = true;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (!this.isSwipeGesture || e.changedTouches.length !== 1) return;
        const touch = e.changedTouches[0];

        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;

        this.isSwipeGesture = false;

        // Minimum swipe distance: 70px, max duration: 600ms
        const minSwipeDistance = 70;
        const maxDuration = 600;

        if (duration > maxDuration) return;

        // Must be primarily horizontal (|deltaX| > 1.8 * |deltaY|)
        if (Math.abs(deltaX) < minSwipeDistance || Math.abs(deltaX) < Math.abs(deltaY) * 1.8) {
          return;
        }

        // SWIPE RIGHT (Left edge to Right) -> Go Back
        if (deltaX > 0) {
          // Started on left half of screen (or near edge)
          if (this.touchStartX < window.innerWidth * 0.45) {
            this.navigateBack();
          }
        }
        // SWIPE LEFT (Right edge to Left) -> Go Forward
        else if (deltaX < 0) {
          // Started on right half of screen
          if (this.touchStartX > window.innerWidth * 0.55) {
            this.navigateForward();
          }
        }
      },
      { passive: true }
    );
  }

  /**
   * Intelligently navigates to previous screen in history
   */
  navigateBack(): void {
    // If a modal is currently open, close modal instead of route change
    if (this.feedbackService.isOpen()) {
      this.feedbackService.close();
      return;
    }
    if (this.globalSearch.isDropdownOpen()) {
      this.globalSearch.closeDropdown();
      return;
    }

    if (this.historyStack.length > 1) {
      const previousUrl = this.historyStack.pop();
      if (previousUrl) {
        this.forwardStack.push(this.currentUrl);
        this.location.back();
        return;
      }
    }

    // Default fallback: if on any subpage, go to dashboard
    if (this.currentUrl !== '/dashboard' && this.vaultState.isUnlocked()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  /**
   * Intelligently navigates forward in history if forward stack exists
   */
  navigateForward(): void {
    if (this.forwardStack.length > 0) {
      const nextUrl = this.forwardStack.pop();
      if (nextUrl) {
        this.location.forward();
        return;
      }
    }
  }
}
