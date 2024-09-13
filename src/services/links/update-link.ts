import { ApiError } from "@/lib/errors";
import { truncate } from "@/lib/truncate";
import { getParamsFromURL } from "@/lib/url";
import { db } from "@/server/db";
import { type ProcessedLinkProps } from "@/types";
import { type Link, Prisma } from "@prisma/client";
import { combineTagIds } from "../utils/combine-tag-ids";
import { transformLink } from "./transform-link";

export async function updateLink({
  userId,
  updatedLink,
}: {
  userId?: string;
  updatedLink: ProcessedLinkProps &
    Pick<Link, "id" | "clicks" | "lastClicked" | "updatedAt">;
}) {
  if (!userId) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to update a link",
    });
  }

  const {
    id,
    keyword,
    originalLink,
    expiredLinkByDate,
    ogTitle,
    ogDescription,
    ogImage,
    geoTargeting,
  } = updatedLink;
  const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent } =
    getParamsFromURL(originalLink);

  // exclude fields that should not be updated
  const { tagIds, tagNames, ...rest } = updatedLink;

  const combinedTagIds = combineTagIds({ tagIds });

  const response = await db.link.update({
    where: {
      id,
    },
    data: {
      ...rest,
      keyword,
      ogTitle: truncate(ogTitle, 120),
      ogDescription: truncate(ogDescription, 240),
      ogImage,
      utmSource: utmSource ?? null,
      utmMedium: utmMedium ?? null,
      utmCampaign: utmCampaign ?? null,
      utmTerm: utmTerm ?? null,
      utmContent: utmContent ?? null,
      expiredLinkByDate: expiredLinkByDate ? new Date(expiredLinkByDate) : null,
      geoTargeting: geoTargeting ?? Prisma.JsonNull,
      updatedBy: userId,

      // Associate tags by tagNames
      ...(tagNames &&
        updatedLink.workspaceId && {
          tags: {
            deleteMany: {},
            create: tagNames.map((name) => ({
              name,
              createdBy: userId, // !! This is a bug, should be updatedBy
              updatedBy: userId,
              tag: {
                connect: {
                  name_workspaceId: {
                    name,
                    workspaceId: updatedLink.workspaceId!,
                  },
                },
              },
            })),
          },
        }),

      // Associate tags by IDs (takes priority over tagNames)
      ...(combinedTagIds && {
        tags: {
          deleteMany: {},
          create: combinedTagIds.map((tagId) => ({
            tagId,
            createdBy: userId, // !! This is a bug, should be updatedBy
            updatedBy: userId,
            name: "", // ! Add a default value for the name field
          })),
        },
      }),
    },
    include: {
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  return transformLink(response);
}
