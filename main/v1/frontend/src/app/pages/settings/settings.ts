import { Icon } from '../../components/ui/icon';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../services/api';
import { Settings } from '../../models/models';
import { Field, FormFields, Values } from '../../shared/fields';
import { PageTitle } from '../../components/ui/page-title';
import { RequestState } from '../../components/ui/request-state';
import { Task } from '../../shared/task';
@Component({
  imports: [Icon, FormsModule, FormFields, PageTitle, RequestState],
  templateUrl: './settings.html',
})
export class SettingsPage {
  api = inject(Api);
  task = new Task();
  values: Values = {};
  loaded = false;
  shopFields: Field[] = [
    { key: 'shopName', label: 'ชื่อร้าน', required: true },
    { key: 'shopAddress', label: 'ที่อยู่ร้าน' },
  ];
  mainFields: Field[] = [
    { key: 'departureTime', label: 'เวลาออกส่ง', type: 'time', required: true },
    numberField('deliveryWindowMinutes', 'ระยะเวลาส่ง (นาที)', 1, 60, 1),
    numberField('boxPrice', 'ราคาต่อกล่อง', 0),
    numberField('boxCost', 'ต้นทุนต่อกล่อง', 0),
    numberField('maxOrdersPerRider', 'รายการสูงสุดต่อไรเดอร์', 1, 3, 1),
    numberField('maxBoxesPerOrder', 'กล่องสูงสุดต่อรายการ', 1, 3, 1),
  ];
  extraFields: Field[] = [
    numberField('riderBaseFee', 'ค่าไรเดอร์เริ่มต้น', 0),
    numberField('riderFeePerKmPerBox', 'ค่าไรเดอร์ต่อ กม. ต่อกล่อง', 0),
    numberField('riderSpeedKmh', 'ความเร็วไรเดอร์ (กม./ชม.)', 1, 200),
    numberField('serviceMinutesPerStop', 'เวลาจอดส่งต่อจุด (นาที)', 0, 120),
    numberField('roadDistanceFactor', 'ตัวคูณระยะทางถนน', 1, 3),
    numberField('serviceRadiusKm', 'รัศมีบริการ (กม.)', 0.01, 100),
  ];
  constructor() {
    this.load();
  }
  load() {
    return this.task.run(async () => {
      const { shopLocation, ...rest } = (await this.api.request<Settings>('/settings')).data;
      const keys = [...this.shopFields, ...this.mainFields, ...this.extraFields].map((f) => f.key);
      this.values = Object.fromEntries(
        keys.map((key) => [key, rest[key as keyof typeof rest]]),
      ) as Values;
      this.values['departureTime'] = String(rest.departureTime).slice(0, 5);
      Object.assign(this.values, shopLocation);
      this.loaded = true;
    });
  }
  save() {
    return this.task.run(async () => {
      const { latitude, longitude } = this.values;
      const keys = [...this.shopFields, ...this.mainFields, ...this.extraFields].map((f) => f.key);
      const rest = Object.fromEntries(keys.map((key) => [key, this.values[key]]));
      await this.api.request('/settings', 'PATCH', {
        ...rest,
        shopLocation: { latitude: Number(latitude), longitude: Number(longitude) },
      });
    }, 'บันทึกการตั้งค่าแล้ว');
  }
}
function numberField(key: string, label: string, min: number, max?: number, step?: number): Field {
  return { key, label, type: 'number', required: true, min, max, step };
}
