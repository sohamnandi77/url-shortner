import { validateScopesForRole } from "@/config/rbac/permissions";
import { ApiError } from "@/lib/errors";
import { parseRequestBody } from "@/lib/parse-request-body";
import { withWorkspace } from "@/lib/with-workspace";
import { tokenSchema, updateTokenSchema } from "@/schema/token";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

// GET /api/tokens/:id - get info about a specific token
export const GET = withWorkspace(
  async ({ workspace, params }) => {
    const token = await db.restrictedToken.findUnique({
      where: {
        id: params.id,
        workspaceId: workspace?.id,
      },
      select: {
        id: true,
        name: true,
        scopes: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!token) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: `Token with id ${params.id} not found.`,
      });
    }

    return NextResponse.json(tokenSchema.parse(token));
  },
  {
    requiredPermissions: ["TOKENS_READ"],
  },
);

// PATCH /api/tokens/:id - update a specific token
export const PATCH = withWorkspace(
  async ({ workspace, params, req, session }) => {
    const { name, scopes } = updateTokenSchema.parse(
      await parseRequestBody(req),
    );

    const { role } = await db.workspaceUsers.findUniqueOrThrow({
      where: {
        userId_workspaceId: {
          userId: session?.user.id ?? "",
          workspaceId: workspace?.id ?? "",
        },
      },
      select: {
        role: true,
      },
    });

    if (!validateScopesForRole(scopes, role)) {
      throw new ApiError({
        code: "UNPROCESSABLE_ENTITY",
        message: "Some of the given scopes are not available for your role.",
      });
    }

    const token = await db.restrictedToken.update({
      where: {
        id: params.id,
        workspaceId: workspace?.id,
      },
      data: {
        ...(name && { name }),
        ...(scopes && { scopes: [...new Set(scopes)].join(" ") }),
      },
      select: {
        id: true,
        name: true,
        scopes: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(tokenSchema.parse(token));
  },
  {
    requiredPermissions: ["TOKENS_UPDATE"],
  },
);

// DELETE /api/tokens/:id - delete a specific token
export const DELETE = withWorkspace(
  async ({ workspace, params }) => {
    const token = await db.restrictedToken.delete({
      where: {
        id: params.id,
        workspaceId: workspace?.id,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: token.id,
    });
  },
  {
    requiredPermissions: ["TOKENS_DELETE"],
  },
);
