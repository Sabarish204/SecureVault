import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { AutoLockService } from './core/services/auto-lock.service';
import { PwaService } from './core/services/pwa.service';
import { VaultStateService } from './core/state/vault-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly autoLock = inject(AutoLockService);
  private readonly pwaService = inject(PwaService);
  readonly vaultState = inject(VaultStateService);

  ngOnInit(): void {
    this.autoLock.init();
    this.pwaService.init();
  }
}
