import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../http/api-client';
import { ApiError } from '../http/api-error';
import { Paged } from '../models/common.model';
import { DeliveryPlan, ObjectiveOption, PlanObjective, PlanPreview, PlanRequest } from '../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly api = inject(ApiClient);

  objectives(): Promise<ObjectiveOption[]> {
    return this.api.get<ObjectiveOption[]>('/plans/objectives');
  }

  list(date?: string): Promise<Paged<DeliveryPlan>> {
    return this.api.page<DeliveryPlan>('/plans', { date, limit: 20 });
  }

  async latest(date?: string): Promise<DeliveryPlan | null> {
    try {
      return await this.api.get<DeliveryPlan>('/plans/latest', { date });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  get(id: number): Promise<DeliveryPlan> {
    return this.api.get<DeliveryPlan>(`/plans/${id}`);
  }

  preview(request: PlanRequest): Promise<PlanPreview> {
    return this.api.post<PlanPreview>('/plans/preview', request);
  }

  create(request: PlanRequest): Promise<DeliveryPlan> {
    return this.api.post<DeliveryPlan>('/plans', request);
  }

  async recalculate(id: number, objective?: PlanObjective): Promise<{ plan: DeliveryPlan; exhausted: boolean }> {
    const body = await this.api.postEnvelope<DeliveryPlan>(`/plans/${id}/recalculate`, objective ? { objective } : {});
    return { plan: body.data, exhausted: Boolean(body.meta?.['exhaustedAlternatives']) };
  }

  confirm(id: number): Promise<DeliveryPlan> {
    return this.api.post<DeliveryPlan>(`/plans/${id}/confirm`);
  }

  cancel(id: number): Promise<DeliveryPlan> {
    return this.api.post<DeliveryPlan>(`/plans/${id}/cancel`);
  }

  assignRider(planId: number, routeId: number, riderId: number | null): Promise<DeliveryPlan> {
    return this.api.patch<DeliveryPlan>(`/plans/${planId}/routes/${routeId}/rider`, { riderId });
  }
}
