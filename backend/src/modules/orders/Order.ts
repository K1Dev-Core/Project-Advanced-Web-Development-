import { GeoPoint } from "../../shared/geo/GeoPoint";

export const ORDER_STATUSES = ["pending", "assigned", "delivered", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
  planId: number | null;
  deliveredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderWithDistance extends Order {
  distanceKm: number;
}

export interface OrderCreateInput {
  customerId: number;
  deliveryDate: string;
  boxes: number;
  unitPrice: number;
  note: string;
}

export interface OrderUpdateInput {
  customerId?: number;
  deliveryDate?: string;
  boxes?: number;
  note?: string;
  status?: OrderStatus;
}

export interface OrderQuery {
  deliveryDate?: string;
  status?: OrderStatus;
  customerId?: number;
  search?: string;
  page: number;
  limit: number;
}

export interface OrderFilter {
  deliveryDate?: string;
  status?: OrderStatus;
}

export interface OrderSummary {
  deliveryDate: string | null;
  totalOrders: number;
  totalBoxes: number;
  totalRevenue: number;
  byStatus: Record<OrderStatus, { orders: number; boxes: number }>;
}
