import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Dashboard, Order } from '../../core/models';
import { OrderService } from '../../core/services/order.service';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/ui/toast.service';
import { MapMarker, MapViewComponent } from '../../shared/components/map-view.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { Labels } from '../../shared/labels';
import { BahtPipe, ThaiDatePipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, LucideAngularModule, StatCardComponent, MapViewComponent, BahtPipe, ThaiDatePipe],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);

  protected readonly data = signal<Dashboard | null>(null);
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly simulating = signal(false);
  protected readonly labels = Labels;

  protected readonly markers = computed<MapMarker[]>(() =>
    this.orders().map((order) => ({
      id: order.id,
      location: order.customer.location,
      color: order.status === 'delivered' ? '#12a150' : order.status === 'assigned' ? '#2f6fed' : '#ff5a1f',
      label: String(order.boxes),
      title: order.customer.fullName,
      subtitle: `${order.boxes} กล่อง · ${Labels.orderStatus[order.status].text}`,
    })),
  );

  protected readonly countdown = computed(() => {
    const shop = this.data()?.shop;
    if (!shop) {
      return '';
    }
    const [hours, minutes] = shop.departureTime.split(':').map(Number);
    const now = new Date();
    const departure = new Date(now);
    departure.setHours(hours, minutes, 0, 0);
    const diff = Math.round((departure.getTime() - now.getTime()) / 60000);
    if (diff > 0) {
      return diff >= 60 ? `อีก ${Math.floor(diff / 60)} ชม. ${diff % 60} นาที ออกรถ` : `อีก ${diff} นาที ออกรถ`;
    }
    return diff > -60 ? 'ช่วงออกส่ง ต้องถึงมือก่อน ' + shop.deadlineTime : 'ปิดรอบส่งของวันนี้แล้ว';
  });

  protected readonly statusBars = computed(() => {
    const summary = this.data()?.orders;
    if (!summary) {
      return [];
    }
    const total = Math.max(1, Object.values(summary.byStatus).reduce((sum, item) => sum + item.orders, 0));
    return (['pending', 'assigned', 'delivered', 'cancelled'] as const).map((status) => ({
      status,
      label: Labels.orderStatus[status].text,
      tone: Labels.orderStatus[status].tone,
      count: summary.byStatus[status].orders,
      percent: (summary.byStatus[status].orders / total) * 100,
    }));
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      const dashboard = await this.shopService.dashboard();
      this.data.set(dashboard);
      const orders = await this.orderService.list({ date: dashboard.deliveryDate });
      this.orders.set(orders.items);
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected async simulate(): Promise<void> {
    this.simulating.set(true);
    try {
      const result = await this.orderService.simulate();
      this.toast.success(`จำลองออเดอร์ ${result.created} รายการ (${result.totalBoxes} กล่อง) แล้ว`);
      await this.load();
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.simulating.set(false);
    }
  }
}
