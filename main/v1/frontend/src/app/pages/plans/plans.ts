import { Confirm } from '../../shared/confirm';
import { DateControl } from '../../shared/date-control';
import { MatSelectModule } from '@angular/material/select';
import { Icon } from '../../components/ui/icon';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Api } from '../../services/api';
import { Plan, Proposal, Rider, today } from '../../models/models';
import { ParcelMap } from '../../components/map/parcel-map';
import { PageTitle } from '../../components/ui/page-title';
import { RequestState } from '../../components/ui/request-state';
import { DeliveryStatus } from '../../components/ui/delivery-status';
import { RouteCard } from '../../shared/route-card';
import { Task } from '../../shared/task';
import { allRecords } from '../../shared/data';
@Component({
  imports: [
    DateControl,
    MatSelectModule,
    Icon,
    FormsModule,
    DecimalPipe,
    PageTitle,
    RequestState,
    DeliveryStatus,
    ParcelMap,
    RouteCard,
  ],
  templateUrl: './plans.html',
})
export class PlansPage {
  api = inject(Api);
  confirmation = inject(Confirm);
  task = new Task();
  date = today();
  objective = 'balanced';
  choice = 0;
  plans = signal<Plan[]>([]);
  plan = signal<Plan | null>(null);
  riders = signal<Rider[]>([]);
  proposals = signal<Proposal[]>([]);
  constructor() {
    this.load();
  }
  async read(selectedId?: number) {
    const [plans, riders] = await Promise.all([
      allRecords<Plan>(this.api, '/plans?date=' + this.date),
      allRecords<Rider>(this.api, '/riders?active=true'),
    ]);
    this.plans.set(plans);
    this.riders.set(riders);
    const id = selectedId || plans[0]?.id;
    this.plan.set(id ? (await this.api.request<Plan>('/plans/' + id)).data : null);
  }
  @HostListener('window:dev-data-created') refreshFromDev() {
    this.load();
  }
  load() {
    return this.task.run(async () => {
      this.proposals.set([]);
      this.plan.set(null);
      await this.read();
    });
  }
  preview() {
    return this.task.run(async () => {
      this.proposals.set([]);
      const result = await this.api.request<{ proposals: Proposal[] }>('/plans/preview', 'POST', {
        objective: this.objective,
        deliveryDate: this.date,
        alternatives: 3,
      });
      this.proposals.set(result.data.proposals);
      this.choice = 0;
    });
  }
  create() {
    return this.task.run(async () => {
      const proposal = this.proposals()[this.choice];
      if (!proposal) throw new Error('กรุณาเลือกตัวเลือกเส้นทาง');
      const result = await this.api.request<Plan>('/plans', 'POST', {
        objective: this.objective,
        seed: proposal.seed,
        alternativeIndex: this.choice,
        alternatives: 3,
        deliveryDate: this.date,
      });
      this.proposals.set([]);
      await this.read(result.data.id);
    }, 'บันทึกแผนร่างแล้ว');
  }
  select(id: number) {
    return this.task.run(async () => {
      this.plan.set((await this.api.request<Plan>('/plans/' + id)).data);
    });
  }
  assigned(plan: Plan) {
    return !!plan.routes.length && plan.routes.every((route) => route.rider);
  }
  action(action: string) {
    return this.task.run(async () => {
      const plan = this.plan();
      if (!plan) return;
      const result = await this.api.request<Plan>(
        `/plans/${plan.id}/${action}`,
        'POST',
        action === 'recalculate' ? { objective: this.objective } : {},
      );
      await this.read(result.data.id);
    }, 'อัปเดตแผนแล้ว');
  }
  async cancel() {
    if (
      await this.confirmation.ask(
        'ยกเลิกแผนจัดส่ง?',
        'รายการในแผนนี้จะถูกคืนเพื่อจัดส่งใหม่',
        'ยกเลิกแผน',
      )
    )
      this.action('cancel');
  }
  assign(routeId: number, value: number | string) {
    return this.task.run(async () => {
      const plan = this.plan();
      if (!plan) return;
      this.plan.set(
        (
          await this.api.request<Plan>(`/plans/${plan.id}/routes/${routeId}/rider`, 'PATCH', {
            riderId: value ? Number(value) : null,
          })
        ).data,
      );
    });
  }
  statusLabel(value: string) {
    return (
      (
        {
          draft: 'แบบร่าง',
          confirmed: 'ยืนยันแล้ว',
          cancelled: 'ยกเลิก',
          completed: 'เสร็จสิ้น',
        } as Record<string, string>
      )[value] || value
    );
  }
}
