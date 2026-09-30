import { z } from "zod";
import { CommonSchemas } from "../../core/validation/CommonSchemas";

const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[0-9+\-\s()]*$/, "Phone may contain only digits, spaces, +, - and parentheses");

export class RiderSchemas {
  static readonly create = z.object({
    name: z.string().trim().min(1).max(150),
    phone: phone.default(""),
    vehiclePlate: z.string().trim().max(30).default(""),
    active: z.boolean().default(true),
  });

  static readonly update = z.object({
    name: z.string().trim().min(1).max(150).optional(),
    phone: phone.optional(),
    vehiclePlate: z.string().trim().max(30).optional(),
    active: z.boolean().optional(),
  });

  static readonly list = CommonSchemas.pagination.extend({
    search: z.string().trim().min(1).optional(),
    active: CommonSchemas.booleanFlag.optional(),
  });
}
