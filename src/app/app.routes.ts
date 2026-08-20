import { Routes } from '@angular/router';
import { vaultAuthGuard } from './core/guards/vault-auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'unlock',
    loadComponent: () => import('./features/unlock/unlock.component').then(m => m.UnlockComponent),
    title: 'Unlock — SecureVault'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [vaultAuthGuard],
    title: 'Dashboard — SecureVault'
  },
  {
    path: 'items',
    loadComponent: () => import('./features/items/item-list/item-list.component').then(m => m.ItemListComponent),
    canActivate: [vaultAuthGuard],
    title: 'Vault Records — SecureVault'
  },
  {
    path: 'items/new',
    loadComponent: () => import('./features/items/item-form/item-form.component').then(m => m.ItemFormComponent),
    canActivate: [vaultAuthGuard],
    title: 'Add Credential — SecureVault'
  },
  {
    path: 'items/:id',
    loadComponent: () => import('./features/items/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
    canActivate: [vaultAuthGuard],
    title: 'Credential Detail — SecureVault'
  },
  {
    path: 'items/:id/edit',
    loadComponent: () => import('./features/items/item-form/item-form.component').then(m => m.ItemFormComponent),
    canActivate: [vaultAuthGuard],
    title: 'Edit Credential — SecureVault'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [vaultAuthGuard],
    title: 'Settings — SecureVault'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
