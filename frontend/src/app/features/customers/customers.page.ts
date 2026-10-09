import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../core/http/api-error';
import { Customer, CustomerInput, GeoPoint } from '../../core/models';
import { CustomerService } from '../../core/services/customer.service';
import { ShopService } from '../../core/services/shop.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { MapCircle, MapMarker, MapViewComponent } from '../../shared/components/map-view.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { InitialPipe, KmPipe } from '../../shared/pipes/format.pipes';

interface CustomerForm {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  note: string;
  location: GeoPoint | null;
}

@Component({
  selector: 'app-customers-page',
  imports: [FormsModule, LucideAngularModule, MapViewComponent, ModalComponent, EmptyStateComponent, InitialPipe, KmPipe],
  templateUrl: './customers.page.html',
  styleUrl: './customers.page.scss',
})
export class CustomersPage implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly shopService = inject(ShopService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly map = viewChild<MapViewComponent>('map');

  protected readonly customers = signal<Customer[]>([]);
  protected readonly nearbyResult = signal<Customer[] | null>(null);
  protected readonly shop = signal<GeoPoint | null>(null);
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly mobileView = signal<'list' | 'map'>('list');

  protected readonly nearbyMode = signal(false);
  protected readonly nearbyCenter = signal<GeoPoint | null>(null);
  protected readonly nearbyRadius = signal(1);

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Customer | null>(null);
  protected form: CustomerForm = CustomersPage.emptyForm();
  protected readonly formLocation = signal<GeoPoint | null>(null);
  protected readonly formError = signal('');

  protected readonly visible = computed(() => {
    const base = this.nearbyResult() ?? this.customers();
    const term = this.search().trim().toLowerCase();
    return term
      ? base.filter((c) => c.fullName.toLowerCase().includes(term) || c.phone.includes(term) || c.address.toLowerCase().includes(term))
      : base;
  });

  protected readonly markers = computed<MapMarker[]>(() =>
    this.visible().map((customer) => ({
      id: customer.id,
      location: customer.location,
      color: customer.id === this.selectedId() ? '#1d1f24' : customer.simulated ? '#ff8a5c' : '#ff5a1f',
      label: '',
      title: customer.fullName,
      subtitle: customer.phone,
    })),
  );

  protected readonly circle = computed<MapCircle | null>(() => {
    const center = this.nearbyCenter();
    return this.nearbyMode() && center ? { center, radiusKm: this.nearbyRadius() } : null;
  });

  async ngOnInit(): Promise<void> {
    try {
      const settings = await this.shopService.settings();
      this.shop.set(settings.shopLocation);
    } catch (error) {
      this.toast.error(error);
    }
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.customers.set((await this.customerService.list()).items);
      if (this.nearbyMode()) {
        await this.runNearby();
      }
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected select(customer: Customer): void {
    this.selectedId.set(customer.id);
    this.map()?.focus(customer.location, 17);
  }

  protected async toggleNearby(): Promise<void> {
    const next = !this.nearbyMode();
    this.nearbyMode.set(next);
    if (next) {
      this.nearbyCenter.set(this.nearbyCenter() ?? this.shop());
      await this.runNearby();
      this.toast.info('แตะบนแผนที่เพื่อเปลี่ยนจุดศูนย์กลางการค้นหา');
    } else {
      this.nearbyResult.set(null);
    }
  }

  protected async setRadius(radius: number): Promise<void> {
    this.nearbyRadius.set(radius);
    await this.runNearby();
  }

  protected async onMapPick(point: GeoPoint): Promise<void> {
    if (this.nearbyMode()) {
      this.nearbyCenter.set(point);
      await this.runNearby();
    }
  }

  private async runNearby(): Promise<void> {
    const center = this.nearbyCenter();
    if (!center) {
      return;
    }
    try {
      this.nearbyResult.set(await this.customerService.nearby(center, this.nearbyRadius()));
    } catch (error) {
      this.toast.error(error);
    }
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form = CustomersPage.emptyForm();
    this.formLocation.set(null);
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openEdit(customer: Customer): void {
    this.editing.set(customer);
    this.form = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: customer.address,
      note: customer.note,
      location: customer.location,
    };
    this.formLocation.set(customer.location);
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected setFormLocation(point: GeoPoint): void {
    this.formLocation.set(point);
  }

  protected useMyLocation(): void {
    if (!navigator.geolocation) {
      this.toast.info('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        this.formLocation.set({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }),
      () => this.toast.info('ไม่สามารถอ่านตำแหน่งได้ แตะบนแผนที่แทน'),
    );
  }

  protected async save(): Promise<void> {
    const location = this.formLocation();
    if (!this.form.firstName.trim() || !this.form.phone.trim()) {
      this.formError.set('กรอกชื่อและเบอร์โทรให้ครบ');
      return;
    }
    if (!location) {
      this.formError.set('แตะบนแผนที่เพื่อปักหมุดบ้านลูกค้า');
      return;
    }
    const input: CustomerInput = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      phone: this.form.phone.trim(),
      address: this.form.address.trim(),
      note: this.form.note.trim(),
      location,
    };
    this.saving.set(true);
    this.formError.set('');
    try {
      const editing = this.editing();
      if (editing) {
        await this.customerService.update(editing.id, input);
        this.toast.success('บันทึกข้อมูลลูกค้าแล้ว');
      } else {
        await this.customerService.create(input);
        this.toast.success('เพิ่มลูกค้าใหม่แล้ว');
      }
      this.formOpen.set(false);
      await this.load();
    } catch (error) {
      this.formError.set(ApiError.from(error).message);
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(customer: Customer): Promise<void> {
    const ok = await this.confirm.ask({
      title: `ลบคุณ${customer.fullName}?`,
      message: 'ข้อมูลลูกค้าจะถูกลบออกจากระบบ',
      confirmText: 'ลบลูกค้า',
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await this.customerService.remove(customer.id);
      this.toast.success('ลบลูกค้าแล้ว');
      await this.load();
    } catch (error) {
      const apiError = ApiError.from(error);
      if (apiError.code === 'CUSTOMER_HAS_ORDERS') {
        const force = await this.confirm.ask({
          title: 'ลูกค้ายังมีออเดอร์อยู่',
          message: 'ต้องการลบลูกค้าพร้อมออเดอร์ทั้งหมดของลูกค้ารายนี้หรือไม่',
          confirmText: 'ลบทั้งหมด',
          danger: true,
        });
        if (force) {
          await this.customerService.remove(customer.id, true);
          this.toast.success('ลบลูกค้าและออเดอร์แล้ว');
          await this.load();
        }
        return;
      }
      this.toast.error(apiError);
    }
  }

  private static emptyForm(): CustomerForm {
    return { firstName: '', lastName: '', phone: '', address: '', note: '', location: null };
  }
}
