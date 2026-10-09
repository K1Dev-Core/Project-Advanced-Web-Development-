import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../models/common.model';
import { ApiError } from '../http/api-error';

interface LoginResponse {
  token: string;
  expiresAt: string;
  user: { username: string; role: 'owner' };
}

interface MeResponse {
  authEnabled: boolean;
  user: { username: string } | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly STORAGE_KEY = 'khaokong.session';

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly token = signal<string | null>(null);
  private readonly username = signal<string | null>(null);
  private readonly authDisabled = signal(false);
  private checked = false;

  readonly isLoggedIn = computed(() => this.authDisabled() || this.token() !== null);
  readonly displayName = computed(() => this.username() ?? 'เจ้าของร้าน');

  constructor() {
    this.restore();
  }

  accessToken(): string | null {
    return this.token();
  }

  async login(username: string, password: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiEnvelope<LoginResponse>>(`${environment.apiBaseUrl}/auth/login`, { username, password }),
      );
      this.store(response.data.token, response.data.user.username, response.data.expiresAt);
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  async ensureSession(): Promise<boolean> {
    if (this.token()) {
      return true;
    }
    if (this.checked) {
      return this.authDisabled();
    }
    this.checked = true;
    try {
      const response = await firstValueFrom(this.http.get<ApiEnvelope<MeResponse>>(`${environment.apiBaseUrl}/auth/me`));
      this.authDisabled.set(!response.data.authEnabled);
    } catch {
      this.authDisabled.set(false);
    }
    return this.authDisabled();
  }

  logout(redirect = true): void {
    this.token.set(null);
    this.username.set(null);
    try {
      localStorage.removeItem(AuthService.STORAGE_KEY);
    } catch {
      this.token.set(null);
    }
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  private store(token: string, username: string, expiresAt: string): void {
    this.token.set(token);
    this.username.set(username);
    try {
      localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify({ token, username, expiresAt }));
    } catch {
      return;
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(AuthService.STORAGE_KEY);
      if (!raw) {
        return;
      }
      const session = JSON.parse(raw) as { token: string; username: string; expiresAt: string };
      if (new Date(session.expiresAt).getTime() > Date.now()) {
        this.token.set(session.token);
        this.username.set(session.username);
      } else {
        localStorage.removeItem(AuthService.STORAGE_KEY);
      }
    } catch {
      return;
    }
  }
}
