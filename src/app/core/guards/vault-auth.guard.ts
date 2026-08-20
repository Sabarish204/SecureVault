import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VaultStateService } from '../state/vault-state.service';

export const vaultAuthGuard: CanActivateFn = () => {
  const vaultState = inject(VaultStateService);
  const router = inject(Router);

  if (vaultState.isUnlocked()) {
    return true;
  }

  // If vault is locked or uninitialized, redirect to unlock screen
  return router.createUrlTree(['/unlock']);
};
