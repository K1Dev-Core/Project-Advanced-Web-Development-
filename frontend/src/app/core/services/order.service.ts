import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../http/api-client';
import { GeoPoint, Paged } from '../models/common.model';
import { ClearResult, Order, OrderInput, OrderQuery, OrderSummary, SimulationResult } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiClient);

  list(query: OrderQuery = {}): Promise<Paged<Order>> {
    return this.api.page<Order>('/orders', { limit: 500, ...query });
  }

  summary(date?: string): Promise<OrderSummary> {
    return this.api.get<OrderSummary>('/orders/summary', { date });
  }

  nearby(center: GeoPoint, radiusKm: number, date?: string): Promise<Order[]> {
    return this.api.get<Order[]>('/orders/nearby', {
      lat: center.latitude,
      lng: center.longitude,
      radius: radiusKm,
      date,
    });
  }

  create(input: OrderInput): Promise<Order> {
    return this.api.post<Order>('/orders', input);
  }

  update(id: number, input: Partial<OrderInput> & { status?: string }): Promise<Order> {
    return this.api.patch<Order>(`/orders/${id}`, input);
  }

  changeBoxes(id: number, change: number): Promise<Order> {
    return this.api.patch<Order>(`/orders/${id}/boxes`, { change });
  }

  remove(id: number): Promise<{ id: number }> {
    return this.api.delete(`/orders/${id}`);
  }

  simulate(count?: number): Promise<SimulationResult> {
    return this.api.post<SimulationResult>('/simulations/orders', count ? { count } : { minCount: 20, maxCount: 30 });
  }

  clearSimulated(date?: string): Promise<ClearResult> {
    return this.api.delete<ClearResult>('/simulations/orders', { date });
  }
}
