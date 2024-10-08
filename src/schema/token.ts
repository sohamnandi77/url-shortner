import { PERMISSION_ACTIONS } from "@/config/rbac/permissions";
import { z } from "zod";

const SCOPES = Object.values(PERMISSION_ACTIONS) as [string, ...string[]];

// Schema to validate the request body when creating a new token
export const createTokenSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
    })
    .min(1)
    .max(50),
  scopes: z.array(z.enum(SCOPES)).default([]).optional(),
});

// Schema to validate the request body when updating a token
export const updateTokenSchema = createTokenSchema
  .pick({
    name: true,
    scopes: true,
  })
  .required();

// Represent the shape of a token returned from the API
export const tokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z
    .string()
    .nullable()
    .transform((val) => val?.split(" ") ?? []),
  lastUsed: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});
