import { UTM_TAGS } from "@/constants/main";
import { deepEqual } from "@/lib/deep-equal";
import { ApiError } from "@/lib/errors";
import { parseRequestBody } from "@/lib/parse-request-body";
import { withWorkspace } from "@/lib/with-workspace";
import { updateLinkBodySchema } from "@/schema/links";
import { db } from "@/server/db";
import { deleteLink } from "@/services/links/delete-link";
import { getLinkOrThrow } from "@/services/links/get-link-or-throw";
import { processLink } from "@/services/links/process-link";
import { transformLink } from "@/services/links/transform-link";
import { updateLink } from "@/services/links/update-link";
import { type NewLinkProps } from "@/types";
import { NextResponse } from "next/server";

// GET /api/links/[linkId] – get a link
export const GET = withWorkspace(
  async ({ headers, workspace, params }) => {
    if (!workspace) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }

    const link = await getLinkOrThrow({
      workspace,
      linkId: params.linkId,
    });

    const tags = await db.tag.findMany({
      where: {
        links: {
          some: {
            linkId: link.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const response = transformLink({
      ...link,
      tags: tags.map((tag) => {
        return { tag };
      }),
    });

    return NextResponse.json(response, { headers });
  },
  {
    requiredPermissions: ["LINKS_READ"],
  },
);

// PATCH /api/links/[linkId] – update a link
export const PATCH = withWorkspace(
  async ({ req, headers, workspace, params, session }) => {
    if (!workspace || !session) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }

    const link = await getLinkOrThrow({
      workspace,
      linkId: params.linkId,
    });

    const body = updateLinkBodySchema.parse(await parseRequestBody(req)) ?? {};

    // Add body onto existing link but maintain NewLinkProps form for processLink
    const updatedLink = {
      ...link,
      expiresAt:
        link.expiredLinkByDate instanceof Date
          ? link.expiredLinkByDate.toISOString()
          : link.expiredLinkByDate,
      geoTargeting: link.geoTargeting as NewLinkProps["geoTargeting"],
      ...body,
      // for UTM tags, we only pass them to processLink if they have changed from their previous value
      // or else they will override any changes to the UTM params in the destination URL
      ...Object.fromEntries(
        UTM_TAGS.map((tag) => [
          tag,
          body[tag] === link[tag] ? undefined : body[tag],
        ]),
      ),

      // When root domain
      ...(link.keyword === "_root" && {
        domain: link.domain,
        key: link.keyword,
      }),
      expiredLinkByDate: link.expiredLinkByDate
        ? link.expiredLinkByDate.toString()
        : null,
    };

    // if link and updatedLink are identical, return the link
    if (deepEqual(link, updatedLink)) {
      return NextResponse.json(link, { headers });
    }

    if (updatedLink.workspaceId !== link?.workspaceId) {
      throw new ApiError({
        code: "FORBIDDEN",
        message:
          "Transferring links to another workspace is only allowed via the /links/[linkId]/transfer endpoint.",
      });
    }

    const {
      link: processedLink,
      error,
      code,
    } = await processLink({
      payload: updatedLink,
      workspace,
      // if domain and key are the same, we don't need to check if the key exists
      skipKeyChecks:
        link.domain === updatedLink.domain &&
        link.keyword.toLowerCase() === updatedLink.key?.toLowerCase(),
    });

    if (error) {
      throw new ApiError({
        code: code!,
        message: error,
      });
    }

    try {
      const response = await updateLink({
        userId: session?.user.id,
        updatedLink: processedLink,
      });

      return NextResponse.json(response, {
        headers,
      });
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
    requiredPermissions: ["LINKS_UPDATE"],
  },
);

// DELETE /api/links/[linkId] – delete a link
export const DELETE = withWorkspace(
  async ({ headers, params, workspace }) => {
    if (!workspace) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }

    const link = await getLinkOrThrow({
      workspace,
      linkId: params.linkId,
    });

    await deleteLink(link.id);

    return NextResponse.json({ id: link.id }, { headers });
  },
  {
    requiredPermissions: ["LINKS_DELETE"],
  },
);
