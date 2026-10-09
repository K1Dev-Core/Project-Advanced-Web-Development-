import { Routes } from '@angular/router';
import { ownerGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.page').then((m) => m.LandingPage),
    title: 'ข้าวกล่อง · ส่งด่วนมื้อเที่ยง',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
    title: 'เข้าสู่ระบบเจ้าของร้าน',
  },
  {
    path: 'rider',
    loadComponent: () => import('./features/rider/job-entry.page').then((m) => m.JobEntryPage),
    title: 'ใบงานไรเดอร์',
  },
  {
    path: 'rider/:code',
    loadComponent: () => import('./features/rider/job-sheet.page').then((m) => m.JobSheetPage),
    title: 'ใบงานไรเดอร์',
  },
  {
    path: 'app',
    canActivate: [ownerGuard],
    loadComponent: () => import('./layout/owner-shell.component').then((m) => m.OwnerShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'ภาพรวมวันนี้',
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage),
        title: 'ออเดอร์',
      },
      {
        path: 'planning',
        loadComponent: () => import('./features/planning/planning.page').then((m) => m.PlanningPage),
        title: 'จัดเส้นทางส่ง',
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers.page').then((m) => m.CustomersPage),
        title: 'ลูกค้า',
      },
      {
        path: 'riders',
        loadComponent: () => import('./features/riders/riders.page').then((m) => m.RidersPage),
        title: 'ไรเดอร์',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
        title: 'ตั้งค่าร้าน',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
