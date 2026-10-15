import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Api } from './services/api';
const owner: CanActivateFn = () =>
  inject(Api).token() ? true : inject(Router).createUrlTree(['/admin/login']);
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'customer' },
  { path: 'customer', loadComponent: () => import('./pages/home/home').then((m) => m.HomePage) },
  { path: 'admin/login', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage) },
  {
    path: 'admin',
    canActivate: [owner],
    loadComponent: () => import('./pages/overview/overview').then((m) => m.OverviewPage),
  },
  ...['customers', 'orders', 'riders'].map((kind) => ({
    path: `admin/${kind}`,
    data: { kind },
    canActivate: [owner],
    loadComponent: () => import('./pages/records/records').then((m) => m.RecordsPage),
  })),
  {
    path: 'admin/plans',
    canActivate: [owner],
    loadComponent: () => import('./pages/plans/plans').then((m) => m.PlansPage),
  },
  {
    path: 'admin/settings',
    canActivate: [owner],
    loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage),
  },
  { path: 'rider', loadComponent: () => import('./pages/rider/rider').then((m) => m.RiderPage) },
  {
    path: 'rider/jobs/:code',
    loadComponent: () => import('./pages/rider/rider').then((m) => m.RiderPage),
  },
  { path: '**', redirectTo: 'customer' },
];
