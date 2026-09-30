import { z } from "zod";
import { CommonSchemas } from "../../core/validation/CommonSchemas";
import { ORDER_STATUSES } from "./Order";

const status = z.enum(ORDER_STATUSES);

export class OrderSchemas {
  static readonly create = z.object({
    customerId: CommonSchemas.positiveId,
    boxes: z.coerce.number().int().min(1),
    deliveryDate: CommonSchemas.date.optional(),
    note: z.string().trim().max(500).default(""),
  });

  static readonly update = z.object({
    customerId: CommonSchemas.positiveId.optional(),
    boxes: z.coerce.number().int().min(1).optional(),
    deliveryDate: CommonSchemas.date.optional(),
    note: z.string().trim().max(500).optional(),
    status: status.optional(),
  });

  static readonly boxes = z.union([
    z.object({ boxes: z.coerce.number().int().min(1) }).strict(),
    z.object({ change: z.coerce.number().int().refine((value) => value !== 0, "Change must not be zero") }).strict(),
  ]);

  static readonly list = CommonSchemas.pagination.extend({
    date: CommonSchemas.date.optional(),
    deliveryDate: CommonSchemas.date.optional(),
    status: status.optional(),
    customerId: CommonSchemas.positiveId.optional(),
    search: z.string().trim().min(1).optional(),
  }).transform(({ date, deliveryDate, ...rest }) => ({ ...rest, deliveryDate: deliveryDate ?? date }));

  static readonly filter = z
    .object({
      date: CommonSchemas.date.optional(),
      deliveryDate: CommonSchemas.date.optional(),
      status: status.optional(),
    })
    .transform(({ date, deliveryDate, status: value }) => ({ deliveryDate: deliveryDate ?? date, status: value }));

  static readonly summary = z
    .object({
      date: CommonSchemas.date.optional(),
      deliveryDate: CommonSchemas.date.optional(),
      all: CommonSchemas.booleanFlag.default(false),
    })
    .transform(({ date, deliveryDate, all }) => ({ deliveryDate: deliveryDate ?? date, all }));

  static readonly nearby = CommonSchemas.nearby(2).extend({
    date: CommonSchemas.date.optional(),
    deliveryDate: CommonSchemas.date.optional(),
    status: status.optional(),
  });
}
