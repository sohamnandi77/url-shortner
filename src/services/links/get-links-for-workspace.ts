import { type getLinksQuerySchemaExtended } from "@/schema/links";
import { db } from "@/server/db";
import { type z } from "zod";
import { combineTagIds } from "../utils/combine-tag-ids";
import { transformLink } from "./transform-link";

export async function getLinksForWorkspace({
  workspaceId,
  domain,
  tagIds,
  tagNames,
  search,
  sort = "updatedAt",
  page,
  pageSize,
  userId,
  showArchived,
  withTags,
  includeUser,
}: z.infer<typeof getLinksQuerySchemaExtended> & {
  workspaceId: string;
}) {
  const combinedTagIds = combineTagIds({ tagIds });

  const links = await db.link.findMany({
    where: {
      workspaceId: workspaceId,
      archived: showArchived ? undefined : false,
      ...(domain && { domain }),
      ...(search && {
        OR: [
          {
            keyword: { contains: search },
          },
          {
            originalLink: { contains: search },
          },
        ],
      }),
      ...(withTags && {
        tags: {
          some: {},
        },
      }),
      ...(combinedTagIds && combinedTagIds.length > 0
        ? {
            tags: { some: { tagId: { in: combinedTagIds } } },
          }
        : tagNames
          ? {
              tags: {
                some: {
                  tag: {
                    name: {
                      in: tagNames,
                    },
                  },
                },
              },
            }
          : {}),
      ...(userId && { userId }),
    },
    include: {
      user: includeUser,
      tags: {
        include: {
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
    orderBy: {
      [sort]: "desc",
    },
    take: pageSize,
    ...(page && {
      skip: (page - 1) * pageSize,
    }),
  });

  return links.map((link) => transformLink(link));
}
