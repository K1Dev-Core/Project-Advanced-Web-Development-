import { GeoPoint } from "../../shared/geo/GeoPoint";
import { PlanStatus, RouteRider, RouteStatus, StopStatus } from "../plans/DeliveryPlan";

export interface JobSheetStop {
  id: number;
  sequence: number;
  label: string;
  orderId: number | null;
  customerName: string;
  phone: string;
  callUrl: string;
  address: string;
  location: GeoPoint;
  boxes: number;
  eta: string;
  legDistanceKm: number;
  late: boolean;
  status: StopStatus;
  deliveredAt: string | null;
  mapUrl: string;
}

export interface JobSheet {
  jobCode: string;
  planId: number;
  planStatus: PlanStatus;
  deliveryDate: string;
  riderNumber: number;
  color: string;
  colorName: string;
  rider: RouteRider | null;
  status: RouteStatus;
  shop: { name: string; location: GeoPoint; mapUrl: string };
  departureTime: string;
  deadlineTime: string;
  finishTime: string;
  totalOrders: number;
  totalBoxes: number;
  distanceKm: number;
  durationMinutes: number;
  riderFee: number;
  deliveredStops: number;
  remainingStops: number;
  instructions: string[];
  navigationUrl: string;
  path: GeoPoint[];
  stops: JobSheetStop[];
  startedAt: string | null;
  completedAt: string | null;
}
