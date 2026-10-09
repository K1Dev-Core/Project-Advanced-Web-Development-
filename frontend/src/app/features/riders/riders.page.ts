import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../core/http/api-error';
import { Rider, RiderInput } from '../../core/models';
import { RiderService } from '../../core/services/rider.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { InitialPipe } from '../../shared/pipes/format.pipes';

@Component({
  selector: 'app-riders-page',
  imports: [FormsModule, LucideAngularModule, ModalComponent, EmptyStateComponent, InitialPipe],
  templateUrl: './riders.page.html',
  styleUrl: './riders.page.scss',
})
export class RidersPage implements OnInit {
  private readonly riderService = inject(RiderService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly riders = signal<Rider[]>([]);
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Rider | null>(null);
  protected readonly formError = signal('');
  protected form: RiderInput = RidersPage.emptyForm();

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term
      ? this.riders().filter((r) => r.name.toLowerCase().includes(term) || r.phone.includes(term) || r.vehiclePlate.toLowerCase().includes(term))
      : this.riders();
  });

  protected readonly activeCount = computed(() => this.riders().filter((r) => r.active).length);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.riders.set((await this.riderService.list()).items);
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form = RidersPage.emptyForm();
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openEdit(rider: Rider): void {
    this.editing.set(rider);
    this.form = { name: rider.name, phone: rider.phone, vehiclePlate: rider.vehiclePlate, active: rider.active };
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    if (!this.form.name.trim()) {
      this.formError.set('กรอกชื่อไรเดอร์');
      return;
    }
    this.saving.set(true);
    try {
      const input = { ...this.form, name: this.form.name.trim(), phone: this.form.phone.trim(), vehiclePlate: this.form.vehiclePlate.trim() };
      const editing = this.editing();
      if (editing) {
        await this.riderService.update(editing.id, input);
      } else {
        await this.riderService.create(input);
      }
      this.toast.success(editing ? 'บันทึกข้อมูลไรเดอร์แล้ว' : 'เพิ่มไรเดอร์แล้ว');
      this.formOpen.set(false);
      await this.load();
    } catch (error) {
      this.formError.set(ApiError.from(error).message);
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggleActive(rider: Rider): Promise<void> {
    try {
      const updated = await this.riderService.update(rider.id, { active: !rider.active });
      this.riders.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      this.toast.error(error);
    }
  }

  protected async remove(rider: Rider): Promise<void> {
    const ok = await this.confirm.ask({ title: `ลบ ${rider.name}?`, message: 'ไรเดอร์จะถูกลบออกจากรายชื่อ', confirmText: 'ลบ', danger: true });
    if (!ok) {
      return;
    }
    try {
      await this.riderService.remove(rider.id);
      this.toast.success('ลบไรเดอร์แล้ว');
      await this.load();
    } catch (error) {
      this.toast.error(error);
    }
  }

  protected async simulate(): Promise<void> {
    try {
      const result = await this.riderService.simulate(5);
      this.toast.success(`เพิ่มไรเดอร์ตัวอย่าง ${result.created} คน`);
      await this.load();
    } catch (error) {
      this.toast.error(error);
    }
  }

  private static emptyForm(): RiderInput {
    return { name: '', phone: '', vehiclePlate: '', active: true };
  }
}
