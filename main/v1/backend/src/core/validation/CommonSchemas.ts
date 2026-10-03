import { z } from "zod";

export class CommonSchemas {
  static readonly date = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use the format YYYY-MM-DD");

  static readonly time = z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use the format HH:mm");

  static readonly latitude = z.coerce.number().min(-90).max(90);

  static readonly longitude = z.coerce.number().min(-180).max(180);

  static readonly positiveId = z.coerce.number().int().positive();

  static readonly booleanFlag = z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .transform((value) => value === true || value === "true" || value === "1");

  static readonly pagination = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(50),
  });

  static readonly nearby = (defaultRadiusKm: number) =>
    z.object({
      lat: CommonSchemas.latitude,
      lng: CommonSchemas.longitude,
      radius: z.coerce.number().positive().max(100).default(defaultRadiusKm),
    });
}
