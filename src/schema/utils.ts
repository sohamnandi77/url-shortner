import { PLANS, USER_ROLES } from "@/constants/main";
import { parseDateTime } from "@/lib/datetime";
import { getUrlFromString, isValidUrl } from "@/lib/url";
import z from "zod";

export const parseUrlSchema = z
  .string()
  .transform((v) => getUrlFromString(v))
  .refine((v) => isValidUrl(v), { message: "Invalid URL" });

export const parseUrlSchemaAllowEmpty = z
  .string()
  .transform((v) => getUrlFromString(v));

export const parseDateSchema = z
  .string()
  .transform((v) => parseDateTime(v))
  .refine((v) => !!v, { message: "Invalid date" });

export const planSchema = z.enum(PLANS).describe("The plan of the workspace.");

export const roleSchema = z
  .enum(USER_ROLES)
  .describe("The role of the authenticated user in the workspace.");

// A boolean query schema that coerces the value to a boolean
export const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

// Pagination
export const getPaginationQuerySchema = ({ pageSize }: { pageSize: number }) =>
  z.object({
    page: z.coerce
      .number({ invalid_type_error: "Page must be a number." })
      .positive({ message: "Page must be greater than 0." })
      .optional()
      .default(1)
      .describe("The page number for pagination."),
    pageSize: z.coerce
      .number({ invalid_type_error: "Page size must be a number." })
      .positive({ message: "Page size must be greater than 0." })
      .max(pageSize, {
        message: `Max page size is ${pageSize}.`,
      })
      .optional()
      .default(pageSize)
      .describe("The number of items per page."),
  });
