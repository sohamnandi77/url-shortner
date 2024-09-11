import { ApiError } from "@/lib/errors";
import { getSearchParamsWithArray } from "@/lib/get-search-params";
import { parseRequestBody } from "@/lib/parse-request-body";
import { withWorkspace } from "@/lib/with-workspace";
import {
  createLinkBodySchema,
  getLinksQuerySchemaExtended,
} from "@/schema/links";
import { createLink } from "@/services/links/create-link";
import { getLinksForWorkspace } from "@/services/links/get-links-for-workspace";
import { processLink } from "@/services/links/process-link";
import { throwIfLinksUsageExceeded } from "@/services/utils/usage-checks";
import { NextResponse } from "next/server";

// GET /api/links – get all links for a workspace
export const GET = withWorkspace(
  async ({ req, headers, workspace }) => {
    const searchParams = getSearchParamsWithArray(req.url);

    const {
      domain,
      tagIds,
      search,
      sort,
      page,
      pageSize,
      userId,
      showArchived,
      withTags,
      includeUser,
    } = getLinksQuerySchemaExtended.parse(searchParams);

    if (!workspace) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }

    const response = await getLinksForWorkspace({
      workspaceId: workspace?.id,
      domain,
      tagIds,
      search,
      sort,
      page,
      pageSize,
      userId,
      showArchived,
      withTags,
      includeUser,
    });

    return NextResponse.json(response, { headers });
  },
  {
    requiredPermissions: ["LINKS_READ"],
  },
);

// POST /api/links – create a new link
export const POST = withWorkspace(
  async ({ req, headers, session, workspace }) => {
    if (workspace) {
      throwIfLinksUsageExceeded(workspace);
    }

    const body = createLinkBodySchema.parse(await parseRequestBody(req));

    const { link, error, code } = await processLink({
      payload: body,
      workspace,
      ...(session && { userId: session?.user.id }),
    });

    if (error != null) {
      throw new ApiError({
        code: code!,
        message: error,
      });
    }

    try {
      const response = await createLink(link);

      return NextResponse.json(response, { headers });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ("code" in error && error.code === "P2002") {
          throw new ApiError({
            code: "CONFLICT",
            message: "A link with this externalId already exists.",
          });
        }

        throw new ApiError({
          code: "UNPROCESSABLE_ENTITY",
          message: error.message,
        });
      }

      throw new ApiError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  },
  {
    allowAnonymous: true,
    requiredPermissions: ["LINKS_CREATE"],
  },
);
