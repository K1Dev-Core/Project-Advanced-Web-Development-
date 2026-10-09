import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../http/api-client';
import { GeoPoint, Paged } from '../models/common.model';
import { Customer, CustomerInput, CustomerQuery } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiClient);

  list(query: CustomerQuery = {}): Promise<Paged<Customer>> {
    return this.api.page<Customer>('/customers', { limit: 500, sort: 'id', order: 'desc', ...query });
  }

  nearby(center: GeoPoint, radiusKm: number): Promise<Customer[]> {
    return this.api.get<Customer[]>('/customers/nearby', {
      lat: center.latitude,
      lng: center.longitude,
      radius: radiusKm,
    });
  }

  create(input: CustomerInput): Promise<Customer> {
    return this.api.post<Customer>('/customers', input);
  }

  update(id: number, input: Partial<CustomerInput>): Promise<Customer> {
    return this.api.patch<Customer>(`/customers/${id}`, input);
  }

  remove(id: number, force = false): Promise<{ id: number; deletedOrders: number }> {
    return this.api.delete(`/customers/${id}`, { force });
  }
}
