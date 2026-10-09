import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../http/api-client';
import { Paged } from '../models/common.model';
import { Rider, RiderInput } from '../models/rider.model';

@Injectable({ providedIn: 'root' })
export class RiderService {
  private readonly api = inject(ApiClient);

  list(search?: string): Promise<Paged<Rider>> {
    return this.api.page<Rider>('/riders', { search, limit: 500 });
  }

  create(input: RiderInput): Promise<Rider> {
    return this.api.post<Rider>('/riders', input);
  }

  update(id: number, input: Partial<RiderInput>): Promise<Rider> {
    return this.api.patch<Rider>(`/riders/${id}`, input);
  }

  remove(id: number): Promise<{ id: number }> {
    return this.api.delete(`/riders/${id}`);
  }

  simulate(count = 5): Promise<{ created: number }> {
    return this.api.post('/simulations/riders', { count });
  }
}
