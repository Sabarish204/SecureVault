import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { UpdateDialogComponent } from './shared/components/update-dialog/update-dialog.component';
import { FeedbackModalComponent } from './shared/components/feedback-modal/feedback-modal.component';
import { AutoLockService } from './core/services/auto-lock.service';
import { BiometricService } from './core/services/biometric.service';
import { PwaService } from './core/services/pwa.service';
import { VaultStateService } from './core/state/vault-state.service';
import { AppUpdateService } from './core/update/app-update.service';
import { FeedbackService } from './core/services/feedback.service';
import { GestureNavigationService } from './core/services/gesture-navigation.service';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    BottomNavComponent,
    UpdateDialogComponent,
    FeedbackModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly autoLock = inject(AutoLockService);
  private readonly biometricService = inject(BiometricService);
  private readonly pwaService = inject(PwaService);
  private readonly appUpdate = inject(AppUpdateService);
  private readonly gestureNav = inject(GestureNavigationService);
  readonly feedbackService = inject(FeedbackService);
  readonly vaultState = inject(VaultStateService);

  async ngOnInit(): Promise<void> {
    this.gestureNav.init();
    this.autoLock.init();
    this.pwaService.init();
    this.biometricService.init();

    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#090d16' });
      } catch {
        // Fallback for non-native environments
      }
    }

    // Non-blocking asynchronous in-app update check
    this.appUpdate.checkForUpdates().catch(() => {});
  }
}
