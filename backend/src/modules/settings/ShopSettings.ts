import { GeoPoint } from "../../shared/geo/GeoPoint";

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
  updatedAt: string | null;
}

export type ShopSettingsUpdate = Partial<Omit<ShopSettings, "updatedAt" | "shopLocation">> & {
  shopLocation?: GeoPoint;
};
