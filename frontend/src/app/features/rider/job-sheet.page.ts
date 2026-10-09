import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../core/http/api-error';
import { JobSheet, JobStop } from '../../core/models';
import { JobService } from '../../core/services/job.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { MapLine, MapMarker, MapViewComponent } from '../../shared/components/map-view.component';
import { FoodBoxIllustrationComponent } from '../../shared/illustrations/food-box-illustration.component';
import { BahtPipe, KmPipe } from '../../shared/pipes/format.pipes';
import { JobEntryPage } from './job-entry.page';

@Component({
  selector: 'app-job-sheet-page',
  imports: [RouterLink, LucideAngularModule, MapViewComponent, FoodBoxIllustrationComponent, BahtPipe, KmPipe],
  templateUrl: './job-sheet.page.html',
  styleUrl: './job-sheet.page.scss',
})
export class JobSheetPage implements OnInit {
  private readonly jobs = inject(JobService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly code = input.required<string>();

  protected readonly job = signal<JobSheet | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly busyStop = signal<number | null>(null);
  protected readonly starting = signal(false);

  protected readonly nextStop = computed(() => this.job()?.stops.find((stop) => stop.status !== 'delivered') ?? null);
  protected readonly progress = computed(() => {
    const job = this.job();
    return job && job.stops.length ? Math.round((job.deliveredStops / job.stops.length) * 100) : 0;
  });

  protected readonly lines = computed<MapLine[]>(() => {
    const job = this.job();
    return job ? [{ points: job.geometry?.length ? job.geometry : job.path, color: job.color, weight: 5 }] : [];
  });

  protected readonly markers = computed<MapMarker[]>(() =>
    (this.job()?.stops ?? []).map((stop) => ({
      id: stop.id,
      location: stop.location,
      color: stop.status === 'delivered' ? '#12a150' : this.job()!.color,
      label: String(stop.sequence),
      title: `จุดที่ ${stop.sequence} ${stop.customerName}`,
      subtitle: `${stop.boxes} กล่อง · ถึง ${stop.eta}`,
    })),
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const job = await this.jobs.get(this.code());
      this.job.set(job);
      JobEntryPage.remember(job.jobCode);
    } catch (error) {
      this.error.set(ApiError.from(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected async start(): Promise<void> {
    const job = this.job();
    if (!job) {
      return;
    }
    this.starting.set(true);
    try {
      this.job.set(await this.jobs.start(job.jobCode));
      this.toast.success('เริ่มออกส่งแล้ว ขับขี่ปลอดภัย');
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.starting.set(false);
    }
  }

  protected async deliver(stop: JobStop): Promise<void> {
    const job = this.job();
    if (!job) {
      return;
    }
    this.busyStop.set(stop.id);
    try {
      const updated = await this.jobs.deliver(job.jobCode, stop.id);
      this.job.set(updated);
      this.toast.success(updated.remainingStops === 0 ? 'ส่งครบทุกจุดแล้ว เก่งมาก!' : `ส่งคุณ${stop.customerName} เรียบร้อย`);
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.busyStop.set(null);
    }
  }

  protected async undo(stop: JobStop): Promise<void> {
    const job = this.job();
    if (!job) {
      return;
    }
    const ok = await this.confirm.ask({ title: 'ยกเลิกการส่งสำเร็จ?', message: `จุดที่ ${stop.sequence} จะกลับเป็นยังไม่ส่ง`, confirmText: 'ยกเลิกการส่ง' });
    if (!ok) {
      return;
    }
    this.busyStop.set(stop.id);
    try {
      this.job.set(await this.jobs.undo(job.jobCode, stop.id));
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.busyStop.set(null);
    }
  }
}
