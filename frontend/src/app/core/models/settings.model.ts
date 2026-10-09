import { GeoPoint } from './common.model';
import { OrderSummary } from './order.model';
import { PlanStatus, PlanSummary } from './plan.model';

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopLocation: GeoPoint;
  boxPrice: number;
  boxCost: number;
  riderBaseFee: number;
  riderFeePerKmPerBox: number;
  riderSpeedKmh: number;
  maxOrdersPerRider: number;
  maxBoxesPerOrder: number;
  departureTime: string;
  deliveryWindowMinutes: number;
  serviceMinutesPerStop: number;
  roadDistanceFactor: number;
  serviceRadiusKm: number;
}

export interface DashboardPlan {
  id: number;
  status: PlanStatus;
  deliveryDate: string;
  revision: number;
  summary: PlanSummary;
}

export interface Dashboard {
  deliveryDate: string;
  shop: {
    name: string;
    address: string;
    location: GeoPoint;
    departureTime: string;
    deadlineTime: string;
  };
  customers: { total: number };
  riders: { active: number };
  orders: OrderSummary;
  plans: { total: number; byStatus: Record<string, number>; active: DashboardPlan | null };
}
