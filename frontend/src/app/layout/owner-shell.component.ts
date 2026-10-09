import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth/auth.service';
import { ConfirmService } from '../core/ui/confirm.service';
import { BrandComponent } from '../shared/components/brand.component';

interface NavItem {
  path: string;
  label: string;
  short: string;
  icon: string;
}

@Component({
  selector: 'app-owner-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, BrandComponent],
  templateUrl: './owner-shell.component.html',
  styleUrl: './owner-shell.component.scss',
})
export class OwnerShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);

  protected readonly nav: NavItem[] = [
    { path: '/app/dashboard', label: 'ภาพรวมวันนี้', short: 'หน้าหลัก', icon: 'layout-dashboard' },
    { path: '/app/orders', label: 'ออเดอร์', short: 'ออเดอร์', icon: 'shopping-bag' },
    { path: '/app/planning', label: 'จัดเส้นทางส่ง', short: 'จัดเส้นทาง', icon: 'route' },
    { path: '/app/customers', label: 'ลูกค้า', short: 'ลูกค้า', icon: 'users' },
    { path: '/app/riders', label: 'ไรเดอร์', short: 'ไรเดอร์', icon: 'bike' },
  ];

  protected readonly today = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  protected async logout(): Promise<void> {
    const ok = await this.confirm.ask({ title: 'ออกจากระบบ?', message: 'ต้องเข้าสู่ระบบใหม่เพื่อจัดการร้าน', confirmText: 'ออกจากระบบ' });
    if (ok) {
      this.auth.logout();
    }
  }
}
