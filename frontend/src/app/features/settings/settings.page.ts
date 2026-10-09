import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { GeoPoint, ShopSettings } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/ui/toast.service';
import { MapViewComponent } from '../../shared/components/map-view.component';
import { BahtPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, LucideAngularModule, MapViewComponent, BahtPipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected form: ShopSettings | null = null;
  protected readonly location = signal<GeoPoint | null>(null);
  protected readonly revision = signal(0);

  protected readonly example = computed(() => {
    this.revision();
    const form = this.form;
    if (!form) {
      return null;
    }
    const boxes = 6;
    const km = 2;
    const fee = form.riderBaseFee + form.riderFeePerKmPerBox * boxes * km;
    return { boxes, km, fee, margin: boxes * (form.boxPrice - form.boxCost) - fee };
  });

  async ngOnInit(): Promise<void> {
    try {
      const settings = await this.shopService.settings(true);
      this.form = { ...settings };
      this.location.set(settings.shopLocation);
      this.revision.update((v) => v + 1);
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected touch(): void {
    this.revision.update((v) => v + 1);
  }

  protected async save(): Promise<void> {
    const form = this.form;
    const location = this.location();
    if (!form || !location) {
      return;
    }
    this.saving.set(true);
    try {
      const saved = await this.shopService.updateSettings({
        shopName: form.shopName,
        shopAddress: form.shopAddress,
        shopLocation: location,
        boxPrice: Number(form.boxPrice),
        boxCost: Number(form.boxCost),
        riderBaseFee: Number(form.riderBaseFee),
        riderFeePerKmPerBox: Number(form.riderFeePerKmPerBox),
        riderSpeedKmh: Number(form.riderSpeedKmh),
        maxOrdersPerRider: Number(form.maxOrdersPerRider),
        maxBoxesPerOrder: Number(form.maxBoxesPerOrder),
        departureTime: form.departureTime,
        deliveryWindowMinutes: Number(form.deliveryWindowMinutes),
        serviceMinutesPerStop: Number(form.serviceMinutesPerStop),
      });
      this.form = { ...saved };
      this.touch();
      this.toast.success('บันทึกการตั้งค่าร้านแล้ว');
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.saving.set(false);
    }
  }
}
