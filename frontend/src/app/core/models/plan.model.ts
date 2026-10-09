import { GeoPoint } from './common.model';

export type PlanObjective = 'cost' | 'distance' | 'time' | 'balanced';
export type PlanStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';
export type RouteStatus = 'pending' | 'in_progress' | 'completed';
export type StopStatus = 'pending' | 'delivered';

export interface ObjectiveOption {
  key: PlanObjective;
  label: string;
  description: string;
}

export interface PlanStop {
  id?: number;
  sequence: number;
  orderId: number | null;
  customerId: number | null;
  customerName: string;
  phone: string;
  address: string;
  location: GeoPoint;
  boxes: number;
  legDistanceKm: number;
  cumulativeDistanceKm: number;
  arrivalMinutes: number;
  eta: string;
  late: boolean;
  mapUrl: string;
  status?: StopStatus;
  deliveredAt?: string | null;
}

export interface RouteRider {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
}

export interface PlanRoute {
  id?: number;
  sequence: number;
  jobCode?: string;
  color: string;
  colorName: string;
  status?: RouteStatus;
  rider?: RouteRider | null;
  orderCount: number;
  boxCount: number;
  distanceKm: number;
  durationMinutes: number;
  finishTime: string;
  riderFee: number;
  revenue: number;
  foodCost: number;
  profit: number;
  lateStops: number;
  stops: PlanStop[];
  path: GeoPoint[];
  geometry: GeoPoint[];
  navigationUrl: string;
}

export interface PlanSummary {
  distanceSource: 'road' | 'estimated';
  riderCount: number;
  orderCount: number;
  boxCount: number;
  totalDistanceKm: number;
  totalRiderFee: number;
  revenue: number;
  foodCost: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  isProfitable: boolean;
  riderFeePerBox: number;
  departureTime: string;
  deadlineTime: string;
  latestArrivalTime: string;
  latestArrivalMinutes: number;
  averageArrivalMinutes: number;
  longestRouteMinutes: number;
  lateStops: number;
  onTime: boolean;
}

export interface PlanProposal {
  objective: PlanObjective;
  seed: number;
  score: number;
  signature: string;
  summary: PlanSummary;
  routes: PlanRoute[];
}

export interface PlanPreview {
  deliveryDate: string;
  orderCount: number;
  boxCount: number;
  proposals: PlanProposal[];
}

export interface DeliveryPlan {
  id: number;
  deliveryDate: string;
  objective: PlanObjective;
  seed: number;
  revision: number;
  status: PlanStatus;
  departureTime: string;
  deadlineTime: string;
  summary: PlanSummary;
  shop: { name: string; location: GeoPoint };
  routes: PlanRoute[];
  createdAt: string | null;
  confirmedAt: string | null;
}

export interface PlanRequest {
  objective: PlanObjective;
  alternatives?: number;
  alternativeIndex?: number;
  seed?: number;
  deliveryDate?: string;
}
