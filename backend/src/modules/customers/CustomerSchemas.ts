import { z } from "zod";
import { CommonSchemas } from "../../core/validation/CommonSchemas";

const location = z.object({
  latitude: CommonSchemas.latitude,
  longitude: CommonSchemas.longitude,
});

const withNestedLocation = (value: unknown): unknown => {
  if (value && typeof value === "object" && !("location" in value)) {
    const body = value as Record<string, unknown>;
    if (body.latitude !== undefined || body.longitude !== undefined) {
      const { latitude, longitude, ...rest } = body;
      return { ...rest, location: { latitude, longitude } };
    }
  }
  return value;
};

const fields = {
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).default(""),
  phone: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[0-9+\-\s()]+$/, "Phone may contain only digits, spaces, +, - and parentheses"),
  address: z.string().trim().max(500).default(""),
  location,
  note: z.string().trim().max(500).default(""),
};

export class CustomerSchemas {
  static readonly create = z.preprocess(withNestedLocation, z.object(fields));

  static readonly update = z.preprocess(
    withNestedLocation,
    z.object({
      firstName: fields.firstName.optional(),
      lastName: z.string().trim().max(100).optional(),
      phone: fields.phone.optional(),
      address: z.string().trim().max(500).optional(),
      location: location.optional(),
      note: z.string().trim().max(500).optional(),
    }),
  );

  static readonly list = CommonSchemas.pagination.extend({
    search: z.string().trim().min(1).optional(),
    q: z.string().trim().min(1).optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    sort: z.enum(["id", "name", "createdAt"]).default("id"),
    order: z.enum(["asc", "desc"]).default("asc"),
  });

  static readonly remove = z.object({
    force: CommonSchemas.booleanFlag.default(false),
  });
}
