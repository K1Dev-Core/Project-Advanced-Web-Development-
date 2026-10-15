import { Icon } from "../../components/ui/icon";
import { DeliveryStopCard } from "../../components/delivery-stop-card/delivery-stop-card";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Api } from "../../services/api";
import { Job } from "../../models/models";
import { ParcelMap } from "../../components/map/parcel-map";
import { PageTitle } from "../../components/ui/page-title";
import { RequestState } from "../../components/ui/request-state";
import { DeliveryStatus } from "../../components/ui/delivery-status";
import { Task } from "../../shared/task";
@Component({
  imports: [
    Icon,
    FormsModule,
    PageTitle,
    RequestState,
    DeliveryStatus,
    ParcelMap,
    DeliveryStopCard,
  ],
  templateUrl: "./rider.html",
  styleUrl: "./rider.css",
})
export class RiderPage {
  api = inject(Api);
  router = inject(Router);
  task = new Task();
  code = "";
  job = signal<Job | null>(null);
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const code = params.get("code");
        if (code) {
          this.code = code;
          this.load();
        }
      });
  }
  open() {
    const code = this.code.trim().toUpperCase();
    if (!code) return;
    return this.router.url.endsWith("/" + code)
      ? this.load()
      : this.router.navigate(["/rider/jobs", code]);
  }
  load() {
    return this.task.run(async () => {
      this.job.set(null);
      this.job.set(
        (
          await this.api.request<Job>(
            "/jobs/" + encodeURIComponent(this.code.trim()),
            "GET",
            undefined,
            false,
          )
        ).data,
      );
    });
  }
  action(action: string) {
    return this.task.run(async () => {
      const job = this.job();
      if (!job) return;
      this.job.set(
        (
          await this.api.request<Job>(
            `/jobs/${encodeURIComponent(job.jobCode)}/${action}`,
            "POST",
            {},
            false,
          )
        ).data,
      );
    }, "อัปเดตใบงานแล้ว");
  }
  progress(job: Job) {
    return job.totalOrders > 0
      ? Math.min(100, Math.max(0, (job.deliveredStops / job.totalOrders) * 100))
      : 0;
  }
  nextStep(job: Job) {
    return job.remainingStops > 0
      ? `ขั้นตอนถัดไป: จุดส่ง ${job.deliveredStops + 1}`
      : "ส่งครบทุกจุดแล้ว";
  }
}
