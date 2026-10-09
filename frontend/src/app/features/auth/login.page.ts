import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { BrandComponent } from '../../shared/components/brand.component';
import { FoodBoxIllustrationComponent } from '../../shared/illustrations/food-box-illustration.component';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, LucideAngularModule, BrandComponent, FoodBoxIllustrationComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected username = 'owner';
  protected password = '';
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  async submit(): Promise<void> {
    if (!this.username || !this.password || this.loading()) {
      this.error.set('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.username.trim(), this.password);
      const next = this.route.snapshot.queryParamMap.get('next') ?? '/app/dashboard';
      await this.router.navigateByUrl(next);
    } catch (error) {
      this.error.set(ApiError.from(error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
