import { z } from "zod";

export const createTagBodySchema = z
  .object({
    name: z.string().min(1).trim().describe("The name of the tag to create."),
    color: z
      .string()
      .describe(
        "The color of the tag. If not provided, a random color will be used.",
      ),
    tag: z.string().min(1).trim().describe("The name of the tag to create."),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (!data.name && !data.tag) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Name is required.",
      });
    }
  });

export const updateTagBodySchema = createTagBodySchema;

export const TagSchema = z.object({
  id: z.string().describe("The unique ID of the tag."),
  name: z.string().describe("The name of the tag."),
  color: z.string().describe("The color of the tag."),
});
