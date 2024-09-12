import { DEFAULT_REDIRECTS } from "@/constants/main";
import { DOMAIN_REGEX, SLUG_REGEX } from "@/constants/regex";
import slugify from "@sindresorhus/slugify";
import { z } from "zod";
import { planSchema, roleSchema } from "./utils";

export const workspaceIdSchema = z.object({
  workspaceId: z
    .string()
    .min(1, "Workspace ID is required.")
    .describe("The ID of the workspace the link belongs to."),
});

export const WorkspaceSchema = z.object({
  id: z.string().describe("The unique ID of the workspace."),
  name: z.string().describe("The name of the workspace."),
  slug: z.string().describe("The slug of the workspace."),
  logo: z
    .string()
    .nullable()
    .default(null)
    .describe("The logo of the workspace."),
  plan: planSchema,
  inviteCode: z
    .string()
    .nullable()
    .describe("The invite code of the workspace."),
  usage: z.number().describe("The usage of the workspace."),
  usageLimit: z.number().describe("The usage limit of the workspace."),
  linksUsage: z.number().describe("The links usage of the workspace."),
  linksLimit: z.number().describe("The links limit of the workspace."),
  domainsLimit: z.number().describe("The domains limit of the workspace."),
  tagsLimit: z.number().describe("The tags limit of the workspace."),
  usersLimit: z.number().describe("The users limit of the workspace."),
  createdAt: z
    .date()
    .describe("The date and time when the workspace was created."),
  users: z
    .array(
      z.object({
        role: roleSchema,
      }),
    )
    .describe("The role of the authenticated user in the workspace."),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(32),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(48, "Slug must be less than 48 characters")
    .transform((v) => slugify(v))
    .refine((v) => SLUG_REGEX.test(v), { message: "Invalid slug format" })
    .refine(
      async (v) => !DEFAULT_REDIRECTS[v as keyof typeof DEFAULT_REDIRECTS],
      {
        message: "Cannot use reserved slugs",
      },
    ),
  domain: z
    .string()
    .refine((v) => DOMAIN_REGEX.test(v), {
      message: "Invalid domain format",
    })
    .optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema
  .pick({
    name: true,
    slug: true,
  })
  .partial();
