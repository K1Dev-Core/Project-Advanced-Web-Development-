import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from '../http/api-client';
import { Dashboard, ShopSettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly api = inject(ApiClient);
  private readonly cached = signal<ShopSettings | null>(null);

  readonly settingsSnapshot = this.cached.asReadonly();

  async settings(refresh = false): Promise<ShopSettings> {
    const current = this.cached();
    if (current && !refresh) {
      return current;
    }
    const settings = await this.api.get<ShopSettings>('/settings');
    this.cached.set(settings);
    return settings;
  }

  async updateSettings(changes: Partial<ShopSettings>): Promise<ShopSettings> {
    const settings = await this.api.patch<ShopSettings>('/settings', changes);
    this.cached.set(settings);
    return settings;
  }

  dashboard(date?: string): Promise<Dashboard> {
    return this.api.get<Dashboard>('/dashboard', { date });
  }
}
