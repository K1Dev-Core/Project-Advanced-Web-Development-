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
      maxOrdersPerRider: settings.maxOrdersPerRider,
      departureTime: settings.departureTime,
      deliveryWindowMinutes: settings.deliveryWindowMinutes,
      serviceMinutesPerStop: settings.serviceMinutesPerStop,
      roadDistanceFactor: settings.roadDistanceFactor,
    };
  }
}
