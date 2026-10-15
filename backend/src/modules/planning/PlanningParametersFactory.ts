import { ShopSettings } from "../settings/ShopSettings";
import { PlanningParameters } from "./PlanningTypes";

export class PlanningParametersFactory {
  static fromSettings(settings: ShopSettings): PlanningParameters {
    return {
      depot: settings.shopLocation,
      boxPrice: settings.boxPrice,
      boxCost: settings.boxCost,
      riderBaseFee: settings.riderBaseFee,
      riderFeePerKmPerBox: settings.riderFeePerKmPerBox,
      riderSpeedKmh: settings.riderSpeedKmh,
      maxOrdersPerRider: Math.min(settings.maxOrdersPerRider, 3),
      departureTime: settings.departureTime,
      deliveryWindowMinutes: Math.min(settings.deliveryWindowMinutes, 60),
      serviceMinutesPerStop: settings.serviceMinutesPerStop,
      roadDistanceFactor: settings.roadDistanceFactor,
    };
  }
}
