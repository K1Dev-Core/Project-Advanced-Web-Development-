import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Notice } from './shared/notice';
import { DevTools } from './shared/dev-tools';
import { Icon } from './components/ui/icon';
import { Api } from './services/api';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, DevTools, Notice],
  templateUrl: './app.html',
})
export class AppComponent {
  api = inject(Api);
  readonly isDevPreview =
    window.self !== window.top || new URLSearchParams(location.search).get('dev-preview') === '1';
  ownerNav = [
    ['/admin', 'ภาพรวม', 'chart'],
    ['/admin/orders', 'รายการส่ง', 'box'],
    ['/admin/customers', 'ลูกค้า', 'users'],
    ['/admin/riders', 'ไรเดอร์', 'truck'],
    ['/admin/plans', 'แผนจัดส่ง', 'route'],
    ['/admin/settings', 'ตั้งค่าร้าน', 'settings'],
  ];
  publicNav = [
    ['/customer', 'หน้าหลัก', 'home'],
    ['/admin/login', 'ร้านค้า', 'user'],
    ['/rider', 'ไรเดอร์', 'truck'],
  ];
  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationEnd) document.getElementById('content')?.focus();
      });
  }
}
