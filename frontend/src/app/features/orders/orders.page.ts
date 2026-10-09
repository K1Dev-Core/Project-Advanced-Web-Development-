import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Customer, Order, OrderStatus, OrderSummary } from '../../core/models';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';
import { ShopService } from '../../core/services/shop.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { Labels } from '../../shared/labels';
import { BahtPipe, InitialPipe, KmPipe, ThaiDatePipe } from '../../shared/pipes/format.pipes';

type StatusFilter = OrderStatus | 'all';

@Component({
  selector: 'app-orders-page',
  imports: [FormsModule, LucideAngularModule, ModalComponent, EmptyStateComponent, BahtPipe, KmPipe, InitialPipe, ThaiDatePipe],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrdersPage implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly shopService = inject(ShopService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly labels = Labels;
  protected readonly statusFilters: { key: StatusFilter; text: string }[] = [
    { key: 'all', text: 'ทั้งหมด' },
    { key: 'pending', text: 'รอจัดส่ง' },
    { key: 'assigned', text: 'จัดรถแล้ว' },
    { key: 'delivered', text: 'ส่งแล้ว' },
    { key: 'cancelled', text: 'ยกเลิก' },
  ];

  protected readonly date = signal(OrdersPage.today());
  protected readonly status = signal<StatusFilter>('all');
  protected readonly search = signal('');
  protected readonly nearbyOnly = signal(false);
  protected readonly orders = signal<Order[]>([]);
  protected readonly summary = signal<OrderSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal<number | null>(null);
  protected readonly working = signal(false);

  protected readonly formOpen = signal(false);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly customerSearch = signal('');
  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly newBoxes = signal(1);
  protected newNote = '';

  protected readonly visible = computed(() => {
    const status = this.status();
    const term = this.search().trim().toLowerCase();
    return this.orders().filter(
      (order) =>
        (status === 'all' || order.status === status) &&
        (!term || order.customer.fullName.toLowerCase().includes(term) || order.customer.phone.includes(term) || String(order.id) === term),
    );
  });

  protected readonly filteredCustomers = computed(() => {
    const term = this.customerSearch().trim().toLowerCase();
    const list = this.customers();
    return (term ? list.filter((c) => c.fullName.toLowerCase().includes(term) || c.phone.includes(term)) : list).slice(0, 40);
  });

  protected readonly counts = computed(() => {
    const map: Record<string, number> = { all: this.orders().length };
    for (const order of this.orders()) {
      map[order.status] = (map[order.status] ?? 0) + 1;
    }
    return map;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      const date = this.date();
      if (this.nearbyOnly()) {
        const settings = await this.shopService.settings();
        this.orders.set(await this.orderService.nearby(settings.shopLocation, 2, date));
      } else {
        this.orders.set((await this.orderService.list({ date })).items);
      }
      this.summary.set(await this.orderService.summary(date));
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected async setDate(value: string): Promise<void> {
    this.date.set(value || OrdersPage.today());
    await this.load();
  }

  protected async toggleNearby(): Promise<void> {
    this.nearbyOnly.set(!this.nearbyOnly());
    await this.load();
  }

  protected async changeBoxes(order: Order, change: number): Promise<void> {
    const next = order.boxes + change;
    if (next < 1) {
      await this.remove(order);
      return;
    }
    if (next > 3) {
      this.toast.info('ออเดอร์ละไม่เกิน 3 กล่อง');
      return;
    }
    this.busy.set(order.id);
    try {
      const updated = await this.orderService.changeBoxes(order.id, change);
      this.orders.update((list) => list.map((item) => (item.id === updated.id ? { ...updated, distanceKm: item.distanceKm } : item)));
      this.summary.set(await this.orderService.summary(this.date()));
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.busy.set(null);
    }
  }

  protected async remove(order: Order): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'ลบออเดอร์นี้?',
      message: `ออเดอร์ #${order.id} ของคุณ${order.customer.fullName} (${order.boxes} กล่อง) จะถูกลบ`,
      confirmText: 'ลบออเดอร์',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busy.set(order.id);
    try {
      await this.orderService.remove(order.id);
      this.toast.success('ลบออเดอร์แล้ว');
      await this.load();
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.busy.set(null);
    }
  }

  protected async simulate(): Promise<void> {
    this.working.set(true);
    try {
      const result = await this.orderService.simulate();
      this.toast.success(`จำลองออเดอร์ ${result.created} รายการ รวม ${result.totalBoxes} กล่อง`);
      this.date.set(result.deliveryDate);
      await this.load();
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.working.set(false);
    }
  }

  protected async clearSimulated(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'ล้างออเดอร์จำลองทั้งหมด?',
      message: 'ลบเฉพาะออเดอร์ที่สร้างจากการจำลอง ออเดอร์จริงจะไม่ถูกลบ',
      confirmText: 'ล้างออเดอร์จำลอง',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.working.set(true);
    try {
      const result = await this.orderService.clearSimulated();
      this.toast.success(`ลบออเดอร์จำลอง ${result.deletedOrders} รายการแล้ว`);
      await this.load();
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.working.set(false);
    }
  }

  protected async openForm(): Promise<void> {
    this.selectedCustomer.set(null);
    this.newBoxes.set(1);
    this.newNote = '';
    this.customerSearch.set('');
    this.formOpen.set(true);
    if (this.customers().length === 0) {
      try {
        this.customers.set((await this.customerService.list()).items);
      } catch (error) {
        this.toast.error(error);
      }
    }
  }

  protected async createOrder(): Promise<void> {
    const customer = this.selectedCustomer();
    if (!customer) {
      this.toast.info('เลือกลูกค้าก่อน');
      return;
    }
    this.working.set(true);
    try {
      await this.orderService.create({
        customerId: customer.id,
        boxes: this.newBoxes(),
        deliveryDate: this.date(),
        note: this.newNote.trim(),
      });
      this.toast.success(`เพิ่มออเดอร์ของคุณ${customer.fullName} แล้ว`);
      this.formOpen.set(false);
      await this.load();
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.working.set(false);
    }
  }

  private static today(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  }
}
