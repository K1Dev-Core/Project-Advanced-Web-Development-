import { GeoPoint } from './common.model';

export type OrderStatus = 'pending' | 'assigned' | 'delivered' | 'cancelled';

export interface OrderCustomer {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  location: GeoPoint;
}

export interface Order {
  id: number;
  customerId: number;
  customer: OrderCustomer;
  deliveryDate: string;
  boxes: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  note: string;
  simulated: boolean;
  planId: number | null;
  deliveredAt: string | null;
  createdAt: string | null;
  distanceKm?: number;
}

export interface OrderInput {
  customerId: number;
  boxes: number;
  deliveryDate?: string;
  note?: string;
}

export interface OrderQuery {
  date?: string;
  status?: OrderStatus;
  simulated?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderSummary {
  deliveryDate: string | null;
  totalOrders: number;
  totalBoxes: number;
  totalRevenue: number;
  byStatus: Record<OrderStatus, { orders: number; boxes: number }>;
}

export interface SimulationResult {
  seed: number;
  deliveryDate: string;
  created: number;
  totalBoxes: number;
  customersCreated: number;
}

export interface ClearResult {
  deletedOrders: number;
  deletedPlans: number;
}
