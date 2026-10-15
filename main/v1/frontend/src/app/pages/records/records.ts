import { Confirm } from '../../shared/confirm';
import { DateControl } from '../../shared/date-control';
import { MatSelectModule } from '@angular/material/select';
import { Icon } from '../../components/ui/icon';
import { Component, HostListener, inject, signal, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api } from '../../services/api';
import { Customer, Order, Rider, Settings, Point, today } from '../../models/models';
import { ParcelMap } from '../../components/map/parcel-map';
import { PageTitle } from '../../components/ui/page-title';
import { RequestState } from '../../components/ui/request-state';
import { Field, FormFields, Values } from '../../shared/fields';
import { Task } from '../../shared/task';
import { allRecords } from '../../shared/data';
import { customerFields, riderFields, recordNames, RecordKind } from './record-fields';
type Row = Customer | Order | Rider;
@Component({
  imports: [
    DateControl,
    MatSelectModule,
    Icon,
    FormsModule,
    PageTitle,
    RequestState,
    FormFields,
    ParcelMap,
  ],
  templateUrl: './records.html',
})
export class RecordsPage {
  api = inject(Api);
  confirmation = inject(Confirm);
  task = new Task();
  saveTask = new Task();
  names = recordNames;
  kind: RecordKind = 'customers';
  rows = signal<Row[]>([]);
  selected: Row | null = null;
  search = '';
  date = today();
  status = '';
  page = 1;
  totalPages = 1;
  fields: Field[] = [];
  values: Values = {};
  customers: Customer[] = [];
  private customersLoaded = false;
  settings?: Settings;
  editor = viewChild<ElementRef<HTMLDialogElement>>('editor');
  constructor() {
    const route = inject(ActivatedRoute);
    combineLatest([route.data, route.queryParamMap])
      .pipe(takeUntilDestroyed())
      .subscribe(([data, params]) => {
        const requestedDate = params.get('date') || '';
        this.date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today();
        this.editor()?.nativeElement.close();
        this.kind = data['kind'];
        this.settings = undefined;
        this.customers = [];
        this.customersLoaded = false;
        this.page = 1;
        this.search = '';
        this.status = '';
        this.rows.set([]);
        this.task = new Task();
        this.load();
      });
  }
  @HostListener('window:dev-data-created') refreshFromDev() {
    this.customersLoaded = false;
    this.settings = undefined;
    this.load();
  }
  load() {
    const kind = this.kind;
    return this.task.run(async () => {
      const query = new URLSearchParams({
        page: String(this.page),
        limit: '10',
        ...(this.search.trim() ? { search: this.search.trim() } : {}),
      });
      if (kind === 'orders') {
        query.set('date', this.date);
        if (this.status) query.set('status', this.status);
      }
      const [result, settings, customers] = await Promise.all([
        this.api.request<Row[]>(`/${kind}?${query}`),
        this.settings
          ? Promise.resolve({ data: this.settings })
          : kind === 'riders'
            ? Promise.resolve({ data: undefined })
            : this.api.request<Settings>('/settings'),
        kind === 'orders' && !this.customersLoaded
          ? allRecords<Customer>(this.api, '/customers')
          : Promise.resolve(this.customers),
      ]);
      if (kind !== this.kind) return;
      this.rows.set(result.data);
      this.totalPages = Math.max(1, result.meta?.totalPages || 1);
      this.settings = settings.data;
      this.customers = customers;
      if (kind === 'orders') this.customersLoaded = true;
    });
  }
  name(row: Row) {
    return 'customer' in row
      ? `#${row.id} · ${row.customer.fullName}`
      : 'fullName' in row
        ? row.fullName
        : row.name;
  }
  detail(row: Row) {
    if ('boxes' in row)
      return `${row.boxes} กล่อง · ฿${row.totalPrice} · ${statusNames[row.status] || row.status}`;
    return 'address' in row
      ? `${row.phone} · ${row.address}`
      : `${row.phone || 'ไม่มีเบอร์โทร'} · ${row.active ? 'พร้อมรับงาน' : 'พักงาน'}`;
  }
  locked(row: Row) {
    return 'status' in row && ['assigned', 'delivered'].includes(row.status);
  }
  edit(row?: Row) {
    this.selected = row || null;
    this.saveTask = new Task();
    if (this.kind === 'customers') {
      this.fields = customerFields;
      const customer = row as Customer | undefined;
      this.values = {
        firstName: customer?.firstName || '',
        lastName: customer?.lastName || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        note: customer?.note || '',
        latitude: customer?.location.latitude ?? this.settings?.shopLocation.latitude ?? 16.246825,
        longitude:
          customer?.location.longitude ?? this.settings?.shopLocation.longitude ?? 103.252021,
      };
    } else if (this.kind === 'riders') {
      this.fields = riderFields;
      const rider = row as Rider | undefined;
      this.values = {
        name: rider?.name || '',
        phone: rider?.phone || '',
        vehiclePlate: rider?.vehiclePlate || '',
        active: rider?.active ?? true,
      };
    } else {
      const order = row as Order | undefined;
      this.fields = [
        {
          key: 'customerId',
          label: 'ลูกค้าผู้รับ',
          required: true,
          options: [
            { value: 0, label: 'เลือกลูกค้า' },
            ...this.customers.map((c) => ({ value: c.id, label: c.fullName + ' · ' + c.phone })),
          ],
        },
        {
          key: 'boxes',
          label: 'จำนวนกล่อง',
          type: 'number',
          required: true,
          min: 1,
          max: this.settings?.maxBoxesPerOrder || 3,
          step: 1,
        },
        { key: 'deliveryDate', label: 'วันที่จัดส่ง', type: 'date', required: true },
        { key: 'note', label: 'หมายเหตุ' },
        ...(order
          ? [
              {
                key: 'status',
                label: 'สถานะ',
                options: [
                  { value: 'pending', label: 'รอจัดส่ง' },
                  { value: 'cancelled', label: 'ยกเลิก' },
                ],
              },
            ]
          : []),
      ];
      this.values = {
        customerId: order?.customerId || 0,
        boxes: order?.boxes || 1,
        deliveryDate: order?.deliveryDate || this.date,
        note: order?.note || '',
        ...(order ? { status: order.status } : {}),
      };
    }
    this.editor()?.nativeElement.showModal();
  }
  point(): Point {
    return {
      latitude: Number(this.values['latitude']),
      longitude: Number(this.values['longitude']),
    };
  }
  pick(point: Point) {
    this.values['latitude'] = point.latitude;
    this.values['longitude'] = point.longitude;
  }
  guardClose(event: Event) {
    if (this.saveTask.busy()) event.preventDefault();
  }
  close() {
    this.editor()?.nativeElement.close();
  }
  save() {
    return this.saveTask.run(async () => {
      let body: object = { ...this.values };
      if (this.kind === 'customers') {
        const { latitude, longitude, ...rest } = this.values;
        body = { ...rest, location: { latitude: Number(latitude), longitude: Number(longitude) } };
      }
      if (this.kind === 'orders' && !Number(this.values['customerId']))
        throw new Error('กรุณาเลือกลูกค้า');
      await this.api.request(
        `/${this.kind}${this.selected ? '/' + this.selected.id : ''}`,
        this.selected ? 'PATCH' : 'POST',
        body,
      );
      this.close();
      this.api.toast('บันทึกข้อมูลแล้ว');
      await this.load();
    });
  }
  async remove(row: Row) {
    if (
      !(await this.confirmation.ask('ลบรายการนี้?', `ลบ ${this.name(row)} ออกจากระบบ`, 'ลบรายการ'))
    )
      return;
    await this.task.run(async () => {
      await this.api.request(`/${this.kind}/${row.id}`, 'DELETE');
    });
    if (!this.task.error()) {
      if (this.rows().length === 1 && this.page > 1) this.page--;
      await this.load();
    }
  }
}
const statusNames: Record<string, string> = {
  pending: 'รอจัดส่ง',
  assigned: 'จัดไรเดอร์แล้ว',
  delivered: 'ส่งสำเร็จ',
  cancelled: 'ยกเลิก',
};
