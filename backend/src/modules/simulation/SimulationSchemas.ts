import { z } from "zod";
import { CommonSchemas } from "../../core/validation/CommonSchemas";

const seed = z.coerce.number().int().min(0).max(4294967295);

export class SimulationSchemas {
  static readonly customers = z.object({
    count: z.coerce.number().int().min(1).max(500).default(30),
    radiusKm: z.coerce.number().positive().max(50).optional(),
    minRadiusKm: z.coerce.number().min(0).max(50).default(0.2),
    seed: seed.optional(),
  });

  static readonly orders = z
    .object({
      count: z.coerce.number().int().min(1).max(500).optional(),
      minCount: z.coerce.number().int().min(1).max(500).default(20),
      maxCount: z.coerce.number().int().min(1).max(500).default(30),
      deliveryDate: CommonSchemas.date.optional(),
      clearExisting: z.boolean().default(false),
      ensureCustomers: z.boolean().default(true),
      uniqueCustomers: z.boolean().default(true),
      seed: seed.optional(),
    })
    .refine((value) => value.minCount <= value.maxCount, {
      message: "minCount must not exceed maxCount",
      path: ["minCount"],
    });

  static readonly riders = z.object({
    count: z.coerce.number().int().min(1).max(100).default(10),
    seed: seed.optional(),
  });

  static readonly clearOrders = z
    .object({
      date: CommonSchemas.date.optional(),
      deliveryDate: CommonSchemas.date.optional(),
    })
    .transform(({ date, deliveryDate }) => ({ deliveryDate: deliveryDate ?? date }));

  static readonly reset = z.object({
    includeRiders: CommonSchemas.booleanFlag.default(false),
  });
}
