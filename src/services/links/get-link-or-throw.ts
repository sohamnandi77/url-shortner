import { ApiError } from "@/lib/errors";
import { db } from "@/server/db";
import { type WorkspaceWithUsers } from "@/types";
import { type Link } from "@prisma/client";

interface GetLinkParams {
  workspace: WorkspaceWithUsers;
  linkId?: string;
  domain?: string;
  keyword?: string;
}

// Find link
export const getLinkOrThrow = async (params: GetLinkParams) => {
  const { workspace, domain } = params;
  let { keyword } = params;
  let link: Link | null = null;

  const linkId = params.linkId ?? undefined;
  const { id: workspaceId } = workspace;

  if (domain && (!keyword || keyword === "")) {
    keyword = "_root";
  }

  // Get link by linkId or externalId
  if (linkId) {
    link = await db.link.findUnique({
      where: {
        id: linkId,
      },
    });
  }

  // Get link by domain and key
  else if (domain && keyword) {
    link = await db.link.findUnique({
      where: {
        domain_keyword: {
          domain,
          keyword,
        },
      },
    });
  }

  if (!link) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: "Link not found.",
    });
  }

  if (link.workspaceId !== workspaceId) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: `Link does not belong to workspace ws_${workspace.id}.`,
    });
  }

  return link;
};
