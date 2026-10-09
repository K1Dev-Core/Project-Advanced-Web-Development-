import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApiError } from '../../core/http/api-error';
import { JobService } from '../../core/services/job.service';
import { BrandComponent } from '../../shared/components/brand.component';
import { RiderIllustrationComponent } from '../../shared/illustrations/rider-illustration.component';

@Component({
  selector: 'app-job-entry-page',
  imports: [FormsModule, RouterLink, LucideAngularModule, BrandComponent, RiderIllustrationComponent],
  templateUrl: './job-entry.page.html',
  styleUrl: './job-entry.page.scss',
})
export class JobEntryPage {
  static readonly RECENT_KEY = 'khaokong.recentJobs';

  private readonly jobs = inject(JobService);
  private readonly router = inject(Router);

  protected code = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly recent = signal<string[]>(JobEntryPage.readRecent());

  protected normalize(value: string): void {
    this.code = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    this.error.set('');
  }

  protected async open(code = this.code): Promise<void> {
    const value = code.trim().toUpperCase();
    if (value.length < 4) {
      this.error.set('กรอกเลขใบงานอย่างน้อย 4 ตัว');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.jobs.get(value);
      JobEntryPage.remember(value);
      await this.router.navigate(['/rider', value]);
    } catch (error) {
      this.error.set(ApiError.from(error).message);
    } finally {
      this.loading.set(false);
    }
  }

  static remember(code: string): void {
    try {
      const list = [code, ...JobEntryPage.readRecent().filter((item) => item !== code)].slice(0, 3);
      localStorage.setItem(JobEntryPage.RECENT_KEY, JSON.stringify(list));
    } catch {
      return;
    }
  }

  private static readRecent(): string[] {
    try {
      return JSON.parse(localStorage.getItem(JobEntryPage.RECENT_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  }
}
