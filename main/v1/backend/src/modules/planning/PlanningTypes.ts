import { GeoPoint } from "../../shared/geo/GeoPoint";
import { DistanceSource } from "../routing/RoutingProvider";

export const PLAN_OBJECTIVES = ["cost", "distance", "time", "balanced"] as const;

export type PlanObjective = (typeof PLAN_OBJECTIVES)[number];

export interface DeliveryRequest {
  orderId: number;
  customerId: number;
  customerName: string;
  phone: string;
  address: string;
  location: GeoPoint;
  boxes: number;
}

export interface PlanningParameters {
  depot: GeoPoint;
  boxPrice: number;
  boxCost: number;
  riderBaseFee: number;
  riderFeePerKmPerBox: number;
  riderSpeedKmh: number;
  maxOrdersPerRider: number;
  departureTime: string;
  deliveryWindowMinutes: number;
  serviceMinutesPerStop: number;
  roadDistanceFactor: number;
}

export interface PlanningOptions {
  objective: PlanObjective;
  seed: number;
  alternatives: number;
  excludeSignatures?: string[];
}

export interface PlannedStop {
  sequence: number;
  orderId: number;
  customerId: number;
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
}

export interface PlannedRoute {
  sequence: number;
  color: string;
  colorName: string;
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
  stops: PlannedStop[];
  path: GeoPoint[];
  geometry: GeoPoint[];
  navigationUrl: string;
}

export interface PlanSummary {
  distanceSource: DistanceSource;
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
  routes: PlannedRoute[];
}
