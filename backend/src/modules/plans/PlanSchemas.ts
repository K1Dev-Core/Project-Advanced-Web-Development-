import { z } from "zod";
import { CommonSchemas } from "../../core/validation/CommonSchemas";
import { PLAN_OBJECTIVES } from "../planning/PlanningTypes";
import { PLAN_STATUSES } from "./DeliveryPlan";

const seed = z.coerce.number().int().min(0).max(4294967295);

export class PlanSchemas {
  static readonly generate = z.object({
    deliveryDate: CommonSchemas.date.optional(),
    objective: z.enum(PLAN_OBJECTIVES).default("cost"),
    seed: seed.optional(),
    alternatives: z.coerce.number().int().min(1).max(10).default(3),
    alternativeIndex: z.coerce.number().int().min(0).max(9).default(0),
    orderIds: z.array(CommonSchemas.positiveId).min(1).optional(),
  });

  static readonly recalculate = z.object({
    objective: z.enum(PLAN_OBJECTIVES).optional(),
    seed: seed.optional(),
    includeNewOrders: z.boolean().default(false),
  });

  static readonly assignRider = z.object({
    riderId: CommonSchemas.positiveId.nullable(),
  });

  static readonly list = CommonSchemas.pagination
    .extend({
      date: CommonSchemas.date.optional(),
      deliveryDate: CommonSchemas.date.optional(),
      status: z.enum(PLAN_STATUSES).optional(),
    })
    .transform(({ date, deliveryDate, ...rest }) => ({ ...rest, deliveryDate: deliveryDate ?? date }));

  static readonly latest = z.object({
    date: CommonSchemas.date.optional(),
    deliveryDate: CommonSchemas.date.optional(),
  });
}
