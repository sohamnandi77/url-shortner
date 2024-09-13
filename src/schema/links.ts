import { COUNTRY_CODES } from "@/constants/countries";
import { DOMAIN_REGEX } from "@/constants/regex";
import { z } from "zod";
import { TagSchema } from "./tag";
import {
  booleanQuerySchema,
  getPaginationQuerySchema,
  parseUrlSchema,
  parseUrlSchemaAllowEmpty,
} from "./utils";

export const UrlQuerySchema = z.object({
  url: parseUrlSchema,
});

export const getDomainQuerySchema = z.object({
  domain: z
    .string()
    .min(1, "Missing required `domain` query parameter.")
    .refine((v) => DOMAIN_REGEX.test(v), {
      message: "Invalid domain",
    }),
});

export const LinksQuerySchema = z.object({
  domain: z
    .string()
    .optional()
    .describe(
      "The domain to filter the links by. E.g. `ac.me`. If not provided, all links for the workspace will be returned.",
    ),
  tagIds: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .optional()
    .describe("The tag IDs to filter the links by."),
  tagNames: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .optional()
    .describe(
      "The unique name of the tags assigned to the short link (case insensitive).",
    ),
  search: z
    .string()
    .optional()
    .describe(
      "The search term to filter the links by. The search term will be matched against the short link slug and the destination url.",
    ),
  userId: z.string().optional().describe("The user ID to filter the links by."),
  showArchived: booleanQuerySchema
    .optional()
    .default("false")
    .describe(
      "Whether to include archived links in the response. Defaults to `false` if not provided.",
    ),
  withTags: booleanQuerySchema
    .optional()
    .default("false")
    .describe(
      "Whether to include tags in the response. Defaults to `false` if not provided.",
    ),
});

export const getLinksCountQuerySchema = LinksQuerySchema.merge(
  z.object({
    groupBy: z
      .union([z.literal("domain"), z.literal("tagId"), z.literal("userId")])
      .optional()
      .describe("The field to group the links by."),
  }),
);

export const createLinkBodySchema = z.object({
  originalLink: parseUrlSchemaAllowEmpty.describe(
    "The destination URL of the short link.",
  ),
  domain: z
    .string()
    .optional()
    .describe(
      "The domain of the short link. If not provided, the primary domain for the workspace will be used (or `dub.sh` if the workspace has no domains).",
    ),
  keyword: z
    .string()
    .optional()
    .describe(
      "The short link slug. If not provided, a random 7-character slug will be generated.",
    ),
  prefix: z
    .string()
    .optional()
    .describe(
      "The prefix of the short link slug for randomly-generated keys (e.g. if prefix is `/c/`, generated keys will be in the `/c/:key` format). Will be ignored if `key` is provided.",
    ),
  archived: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether the short link is archived."),
  showAnalytics: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether the short link's analytics are accessible."),
  tagId: z
    .string()
    .nullish()
    .describe(
      "The unique ID of the tag assigned to the short link. This field is deprecated – use `tagIds` instead.",
    ),
  tagIds: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .optional()
    .describe("The unique IDs of the tags assigned to the short link."),
  tagNames: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .optional()
    .describe(
      "The unique name of the tags assigned to the short link (case insensitive).",
    ),
  comments: z.string().nullish().describe("The comments for the short link."),
  expiredLinkByDate: z
    .string()
    .nullish()
    .describe("The date and time when the short link will expire at."),
  expiredLinkByClicks: z
    .string()
    .nullish()
    .describe("The number of clicks required to expire the short link."),
  expiredUrl: parseUrlSchema
    .nullish()
    .describe("The URL to redirect to when the short link has expired."),
  password: z
    .string()
    .nullish()
    .describe(
      "The password required to access the destination URL of the short link.",
    ),
  proxy: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether the short link uses Custom Social Media Cards feature."),
  ogTitle: z
    .string()
    .nullish()
    .describe(
      "The custom link preview title (og:title). Will be used for Custom Social Media Cards if `proxy` is true. Learn more: https://d.to/og",
    ),
  ogDescription: z
    .string()
    .nullish()
    .describe(
      "The custom link preview description (og:description). Will be used for Custom Social Media Cards if `proxy` is true. Learn more: https://d.to/og",
    ),
  ogImage: z
    .string()
    .nullish()
    .describe(
      "The custom link preview image (og:image). Will be used for Custom Social Media Cards if `proxy` is true. Learn more: https://d.to/og",
    ),
  ogVideo: z
    .string()
    .nullish()
    .describe(
      "The custom link preview video (og:video). Will be used for Custom Social Media Cards if `proxy` is true. Learn more: https://d.to/og",
    ),
  cloaked: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether the short link uses link cloaking."),
  iosTargeting: parseUrlSchema
    .nullish()
    .describe(
      "The iOS destination URL for the short link for iOS device targeting.",
    ),
  androidTargeting: parseUrlSchema
    .nullish()
    .describe(
      "The Android destination URL for the short link for Android device targeting.",
    ),
  geoTargeting: z
    .record(z.enum(COUNTRY_CODES), parseUrlSchema)
    .nullish()
    .describe(
      "Geo targeting information for the short link in JSON format `{[COUNTRY]: https://example.com }`.",
    ),
  shouldIndex: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Allow search engines to index your short link. Defaults to `false` if not provided.",
    ),
  utmSource: z
    .string()
    .nullish()
    .describe(
      "The UTM source of the short link. If set, this will populate or override the UTM source in the destination URL.",
    ),
  utmMedium: z
    .string()
    .nullish()
    .describe(
      "The UTM medium of the short link. If set, this will populate or override the UTM medium in the destination URL.",
    ),
  utmCampaign: z
    .string()
    .nullish()
    .describe(
      "The UTM campaign of the short link. If set, this will populate or override the UTM campaign in the destination URL.",
    ),
  utmTerm: z
    .string()
    .nullish()
    .describe(
      "The UTM term of the short link. If set, this will populate or override the UTM term in the destination URL.",
    ),
  utmContent: z
    .string()
    .nullish()
    .describe(
      "The UTM content of the short link. If set, this will populate or override the UTM content in the destination URL.",
    ),
});

export const updateLinkBodySchema = createLinkBodySchema.partial().optional();

export const LinkSchema = z.object({
  id: z.string().describe("The unique ID of the short link."),
  domain: z
    .string()
    .describe(
      "The domain of the short link. If not provided, the primary domain for the workspace will be used (or `dub.sh` if the workspace has no domains).",
    ),
  keyword: z
    .string()
    .describe(
      "The short link slug. If not provided, a random 7-character slug will be generated.",
    ),
  originalLink: z
    .string()
    .url()
    .describe("The destination URL of the short link."),
  archived: z
    .boolean()
    .default(false)
    .describe("Whether the short link is archived."),
  expiredLinkByDate: z
    .string()
    .nullable()
    .describe(
      "The date and time when the short link will expire in ISO-8601 format.",
    ),
  expiredLinkByClicks: z
    .string()
    .nullable()
    .describe("The number of clicks required to expire the short link."),
  expiredUrl: z
    .string()
    .url()
    .nullable()
    .describe("The URL to redirect to when the short link has expired."),
  password: z
    .string()
    .nullable()
    .describe(
      "The password required to access the destination URL of the short link.",
    ),
  proxy: z
    .boolean()
    .default(false)
    .describe("Whether the short link uses Custom Social Media Cards feature."),
  ogTitle: z
    .string()
    .nullable()
    .describe(
      "The title of the short link generated via `api.dub.co/metatags`. Will be used for Custom Social Media Cards if `proxy` is true.",
    ),
  ogDescription: z
    .string()
    .nullable()
    .describe(
      "The description of the short link generated via `api.dub.co/metatags`. Will be used for Custom Social Media Cards if `proxy` is true.",
    ),
  ogImage: z
    .string()
    .nullable()
    .describe(
      "The image of the short link generated via `api.dub.co/metatags`. Will be used for Custom Social Media Cards if `proxy` is true.",
    ),
  ogVideo: z
    .string()
    .nullable()
    .describe(
      "The custom link preview video (og:video). Will be used for Custom Social Media Cards if `proxy` is true. Learn more: https://d.to/og",
    ),
  cloaked: z
    .boolean()
    .default(false)
    .describe("Whether the short link uses link cloaking."),
  shouldIndex: z
    .boolean()
    .default(false)
    .describe("Whether to allow search engines to index the short link."),
  iosTargeting: z
    .string()
    .nullable()
    .describe(
      "The iOS destination URL for the short link for iOS device targeting.",
    ),
  androidTargeting: z
    .string()
    .nullable()
    .describe(
      "The Android destination URL for the short link for Android device targeting.",
    ),
  geo: z
    .record(z.enum(COUNTRY_CODES), z.string().url())
    .nullable()
    .describe(
      "Geo targeting information for the short link in JSON format `{[COUNTRY]: https://example.com }`. Learn more: https://d.to/geo",
    ),
  showAnalytics: z
    .boolean()
    .default(false)
    .describe("Whether to show analytics for the short link."),
  tagId: z
    .string()
    .nullable()
    .describe(
      "The unique ID of the tag assigned to the short link. This field is deprecated – use `tags` instead.",
    ),
  tags: TagSchema.array()
    .nullable()
    .describe("The tags assigned to the short link."),
  comments: z.string().nullable().describe("The comments for the short link."),
  shortLink: z
    .string()
    .url()
    .describe("The full URL of the short link, including the https protocol."),
  qrCode: z
    .string()
    .url()
    .describe("The full URL of the QR code for the short link."),
  utmSource: z
    .string()
    .nullable()
    .describe("The UTM source of the short link."),
  utmMedium: z
    .string()
    .nullable()
    .describe("The UTM medium of the short link."),
  utmCampaign: z
    .string()
    .nullable()
    .describe("The UTM campaign of the short link."),
  utmTerm: z.string().nullable().describe("The UTM term of the short link."),
  utmContent: z
    .string()
    .nullable()
    .describe("The UTM content of the short link."),
  userId: z.string().describe("The user ID of the creator of the short link."),
  workspaceId: z.string().describe("The workspace ID of the short link."),
  clicks: z
    .number()
    .default(0)
    .describe("The number of clicks on the short link."),
  lastClicked: z
    .string()
    .nullable()
    .describe("The date and time when the short link was last clicked."),
  createdAt: z
    .string()
    .describe("The date and time when the short link was created."),
  updatedAt: z
    .string()
    .describe("The date and time when the short link was last updated."),
});

export const getLinksQuerySchema = LinksQuerySchema.merge(
  z.object({
    sort: z
      .enum(["createdAt", "clicks", "lastClicked", "updatedAt"])
      .optional()
      .default("updatedAt")
      .describe(
        "The field to sort the links by. The default is `updatedAt`, and sort order is always descending.",
      ),
  }),
).merge(getPaginationQuerySchema({ pageSize: 100 }));

export const getLinksQuerySchemaExtended = getLinksQuerySchema.merge(
  z.object({
    includeUser: booleanQuerySchema.default("false"),
  }),
);
