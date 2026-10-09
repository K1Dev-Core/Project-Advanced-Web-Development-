import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../http/api-client';
import { JobSheet } from '../models/rider.model';

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly api = inject(ApiClient);

  get(code: string): Promise<JobSheet> {
    return this.api.get<JobSheet>(`/jobs/${encodeURIComponent(code.trim().toUpperCase())}`);
  }

  start(code: string): Promise<JobSheet> {
    return this.api.post<JobSheet>(`/jobs/${code}/start`);
  }

  deliver(code: string, stopId: number): Promise<JobSheet> {
    return this.api.post<JobSheet>(`/jobs/${code}/stops/${stopId}/deliver`);
  }

  undo(code: string, stopId: number): Promise<JobSheet> {
    return this.api.post<JobSheet>(`/jobs/${code}/stops/${stopId}/undo`);
  }
}
