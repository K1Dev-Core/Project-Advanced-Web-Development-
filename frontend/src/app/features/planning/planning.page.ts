import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../core/http/api-error';
import { DeliveryPlan, GeoPoint, ObjectiveOption, OrderSummary, PlanObjective, PlanRoute, Rider } from '../../core/models';
import { OrderService } from '../../core/services/order.service';
import { PlanService } from '../../core/services/plan.service';
import { RiderService } from '../../core/services/rider.service';
import { ShopService } from '../../core/services/shop.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { MapLine, MapMarker, MapViewComponent } from '../../shared/components/map-view.component';
import { Labels } from '../../shared/labels';
import { BahtPipe, KmPipe, MinutesPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-planning-page',
  imports: [FormsModule, RouterLink, LucideAngularModule, MapViewComponent, EmptyStateComponent, BahtPipe, KmPipe, MinutesPipe],
  templateUrl: './planning.page.html',
  styleUrl: './planning.page.scss',
})
export class PlanningPage implements OnInit {
  private readonly planService = inject(PlanService);
  private readonly orderService = inject(OrderService);
  private readonly riderService = inject(RiderService);
  private readonly shopService = inject(ShopService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly labels = Labels;
  protected readonly plan = signal<DeliveryPlan | null>(null);
  protected readonly objectives = signal<ObjectiveOption[]>([]);
  protected readonly objective = signal<PlanObjective>('cost');
  protected readonly riders = signal<Rider[]>([]);
  protected readonly orderSummary = signal<OrderSummary | null>(null);
  protected readonly shop = signal<GeoPoint | null>(null);
  protected readonly loading = signal(true);
  protected readonly working = signal<'calc' | 'recalc' | 'confirm' | 'cancel' | null>(null);
  protected readonly focusedRoute = signal<number | null>(null);
  protected readonly expandedRoute = signal<number | null>(null);

  protected readonly pendingCount = computed(() => this.orderSummary()?.byStatus.pending.orders ?? 0);

  protected readonly lines = computed<MapLine[]>(() => {
    const plan = this.plan();
    const focus = this.focusedRoute();
    return (plan?.routes ?? []).map((route) => ({
      points: route.geometry?.length ? route.geometry : route.path,
      color: route.color,
      weight: focus === route.sequence ? 7 : 5,
      faded: focus !== null && focus !== route.sequence,
    }));
  });

  protected readonly markers = computed<MapMarker[]>(() => {
    const plan = this.plan();
    const focus = this.focusedRoute();
    return (plan?.routes ?? []).flatMap((route) =>
      route.stops.map((stop) => ({
        id: `${route.sequence}-${stop.sequence}`,
        location: stop.location,
        color: stop.status === 'delivered' ? '#12a150' : route.color,
        label: String(stop.sequence),
        title: `${stop.sequence}. ${stop.customerName}`,
        subtitle: `ไรเดอร์ ${route.sequence} · ${stop.boxes} กล่อง · ถึง ${stop.eta} น.`,
        faded: focus !== null && focus !== route.sequence,
      })),
    );
  });

  protected readonly canEdit = computed(() => this.plan()?.status === 'draft');

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadStatic(), this.load()]);
  }

  private async loadStatic(): Promise<void> {
    try {
      const [objectives, riders, settings] = await Promise.all([
        this.planService.objectives(),
        this.riderService.list(),
        this.shopService.settings(),
      ]);
      this.objectives.set(objectives);
      this.riders.set(riders.items.filter((rider) => rider.active));
      this.shop.set(settings.shopLocation);
    } catch (error) {
      this.toast.error(error);
    }
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [plan, summary] = await Promise.all([this.planService.latest(), this.orderService.summary()]);
      this.setPlan(plan);
      this.orderSummary.set(summary);
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected async calculate(): Promise<void> {
    this.working.set('calc');
    try {
      const plan = await this.planService.create({ objective: this.objective() });
      this.setPlan(plan);
      this.toast.success(`จัดเส้นทางแล้ว ใช้ไรเดอร์ ${plan.summary.riderCount} คน`);
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.working.set(null);
    }
  }

  protected async recalculate(): Promise<void> {
    const plan = this.plan();
    if (!plan || plan.status !== 'draft') {
      await this.calculate();
      return;
    }
    this.working.set('recalc');
    try {
      const result = await this.planService.recalculate(plan.id, this.objective());
      this.setPlan(result.plan);
      this.toast[result.exhausted ? 'info' : 'success'](
        result.exhausted ? 'ไม่มีเส้นทางแบบใหม่แล้ว แสดงแบบที่ดีที่สุดให้' : `เสนอเส้นทางแบบใหม่ (ครั้งที่ ${result.plan.revision})`,
      );
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.working.set(null);
    }
  }

  protected async chooseObjective(key: PlanObjective): Promise<void> {
    if (this.objective() === key) {
      return;
    }
    this.objective.set(key);
    if (this.plan()?.status === 'draft') {
      await this.recalculate();
    }
  }

  protected async confirmPlan(): Promise<void> {
    const plan = this.plan();
    if (!plan) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'ยืนยันแผนจัดส่งนี้?',
      message: `ส่งใบงานให้ไรเดอร์ ${plan.summary.riderCount} คน ออเดอร์จะถูกล็อกจนกว่าจะยกเลิกแผน`,
      confirmText: 'ยืนยันและส่งใบงาน',
    });
    if (!ok) {
      return;
    }
    this.working.set('confirm');
    try {
      this.setPlan(await this.planService.confirm(plan.id));
      this.toast.success('ยืนยันแผนแล้ว ไรเดอร์เปิดใบงานได้ทันที');
      this.orderSummary.set(await this.orderService.summary());
    } catch (error) {
      const apiError = ApiError.from(error);
      this.toast.error(apiError);
      if (apiError.code === 'PLAN_STALE') {
        await this.recalculate();
      }
    } finally {
      this.working.set(null);
    }
  }

  protected async cancelPlan(): Promise<void> {
    const plan = this.plan();
    if (!plan) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'ยกเลิกแผนจัดส่ง?',
      message: 'ใบงานไรเดอร์จะใช้ไม่ได้ ออเดอร์ที่ยังไม่ส่งจะกลับไปรอจัดส่ง',
      confirmText: 'ยกเลิกแผน',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.working.set('cancel');
    try {
      await this.planService.cancel(plan.id);
      this.setPlan(null);
      this.toast.success('ยกเลิกแผนแล้ว');
      this.orderSummary.set(await this.orderService.summary());
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.working.set(null);
    }
  }

  protected async assignRider(route: PlanRoute, value: string): Promise<void> {
    const plan = this.plan();
    if (!plan || !route.id) {
      return;
    }
    try {
      const riderId = value ? Number(value) : null;
      this.setPlan(await this.planService.assignRider(plan.id, route.id, riderId), false);
      this.toast.success(riderId ? 'มอบหมายไรเดอร์แล้ว' : 'นำไรเดอร์ออกแล้ว');
    } catch (error) {
      this.toast.error(error);
    }
  }

  protected toggleRoute(route: PlanRoute): void {
    const same = this.focusedRoute() === route.sequence;
    this.focusedRoute.set(same ? null : route.sequence);
    this.expandedRoute.set(same ? null : route.sequence);
  }

  protected jobLink(route: PlanRoute): string {
    return `${location.origin}/rider/${route.jobCode}`;
  }

  protected async copyJob(route: PlanRoute): Promise<void> {
    const text = `ใบงานไรเดอร์ ${route.sequence} (${route.colorName}) เลขใบงาน ${route.jobCode}\n${this.jobLink(route)}`;
    try {
      await navigator.clipboard.writeText(text);
      this.toast.success(`คัดลอกลิงก์ใบงาน ${route.jobCode} แล้ว`);
    } catch {
      this.toast.info(`เลขใบงาน ${route.jobCode}`);
    }
  }

  private setPlan(plan: DeliveryPlan | null, resetFocus = true): void {
    this.plan.set(plan && plan.status !== 'cancelled' ? plan : null);
    if (plan) {
      this.objective.set(plan.objective);
    }
    if (resetFocus) {
      this.focusedRoute.set(null);
      this.expandedRoute.set(null);
    }
  }
}
