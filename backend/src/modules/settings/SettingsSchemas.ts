import { z } from "zod";
import { CommonSchemas } from "../../core/validation/CommonSchemas";

export class SettingsSchemas {
  static readonly update = z
    .object({
      shopName: z.string().trim().min(1).max(200),
      shopAddress: z.string().trim().max(500),
      shopLocation: z.object({
        latitude: CommonSchemas.latitude,
        longitude: CommonSchemas.longitude,
      }),
      boxPrice: z.coerce.number().min(0),
      boxCost: z.coerce.number().min(0),
      riderBaseFee: z.coerce.number().min(0),
      riderFeePerKmPerBox: z.coerce.number().min(0),
      riderSpeedKmh: z.coerce.number().positive().max(200),
      maxOrdersPerRider: z.coerce.number().int().min(1).max(20),
      maxBoxesPerOrder: z.coerce.number().int().min(1).max(100),
      departureTime: CommonSchemas.time,
      deliveryWindowMinutes: z.coerce.number().int().min(1).max(1440),
      serviceMinutesPerStop: z.coerce.number().min(0).max(120),
      roadDistanceFactor: z.coerce.number().min(1).max(3),
      serviceRadiusKm: z.coerce.number().positive().max(100),
    })
    .partial()
    .strict();
}
