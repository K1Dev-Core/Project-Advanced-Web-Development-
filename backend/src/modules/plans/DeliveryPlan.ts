import { GeoPoint } from "../../shared/geo/GeoPoint";
import { PlannedRoute, PlannedStop, PlanningParameters, PlanObjective, PlanSummary } from "../planning/PlanningTypes";

export const PLAN_STATUSES = ["draft", "confirmed", "completed", "cancelled"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const ROUTE_STATUSES = ["pending", "in_progress", "completed"] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const STOP_STATUSES = ["pending", "delivered"] as const;
export type StopStatus = (typeof STOP_STATUSES)[number];

export interface PlanStop extends Omit<PlannedStop, "orderId" | "customerId"> {
  id: number;
  orderId: number | null;
  customerId: number | null;
  status: StopStatus;
  deliveredAt: string | null;
}

export interface RouteRider {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
}

export interface PlanRoute extends Omit<PlannedRoute, "stops"> {
  id: number;
  planId: number;
  jobCode: string;
  status: RouteStatus;
  rider: RouteRider | null;
  startedAt: string | null;
  completedAt: string | null;
  stops: PlanStop[];
}

export interface DeliveryPlanHeader {
  id: number;
  deliveryDate: string;
  objective: PlanObjective;
  seed: number;
  revision: number;
  status: PlanStatus;
  departureTime: string;
  deadlineTime: string;
  signature: string;
  summary: PlanSummary;
  shop: { name: string; location: GeoPoint };
  createdAt: string | null;
  updatedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
}

export interface DeliveryPlan extends DeliveryPlanHeader {
  parameters: PlanningParameters;
  routes: PlanRoute[];
}

export interface PlanSnapshot {
  parameters: PlanningParameters;
  shopName: string;
}

export interface NewPlanRecord {
  deliveryDate: string;
  objective: PlanObjective;
  seed: number;
  revision: number;
  status: PlanStatus;
  departureTime: string;
  deadlineTime: string;
  snapshot: PlanSnapshot;
  summary: PlanSummary;
  signature: string;
  exploredSignatures: string[];
}

export interface PlanListQuery {
  deliveryDate?: string;
  status?: PlanStatus;
  page: number;
  limit: number;
}
