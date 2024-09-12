import { ApiError } from "@/lib/errors";
import { withWorkspace } from "@/lib/with-workspace";
import { updateWorkspaceSchema, WorkspaceSchema } from "@/schema/workspaces";
import { db } from "@/server/db";
import { deleteWorkspace } from "@/services/workspaces/delete-workspace";
import { NextResponse } from "next/server";

// GET /api/workspaces/[idOrSlug] – get a specific workspace by id or slug
export const GET = withWorkspace(
  async ({ workspace, headers }) => {
    if (!workspace) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }

    return NextResponse.json(
      WorkspaceSchema.parse({
        ...workspace,
        id: `ws_${workspace.id}`,
      }),
      { headers },
    );
  },
  {
    requiredPermissions: ["WORKSPACES_READ"],
  },
);

// PATCH /api/workspaces/[idOrSlug] – update a specific workspace by id or slug
export const PATCH = withWorkspace(
  async ({ req, workspace }) => {
    if (!workspace) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }

    const { name, slug } = await updateWorkspaceSchema.parseAsync(
      await req.json(),
    );

    try {
      const response = await db.workspace.update({
        where: {
          slug: workspace.slug,
        },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
        },
        include: {
          users: true,
        },
      });

      if (slug !== workspace.slug) {
        await db.user.updateMany({
          where: {
            defaultWorkspace: workspace.slug,
          },
          data: {
            defaultWorkspace: slug,
          },
        });
      }

      return NextResponse.json(
        WorkspaceSchema.parse({
          ...response,
          id: `ws_${response.id}`,
        }),
      );
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
    requiredPermissions: ["WORKSPACES_UPDATE"],
  },
);

export const PUT = PATCH;

// DELETE /api/workspaces/[idOrSlug] – delete a specific project
export const DELETE = withWorkspace(
  async ({ workspace }) => {
    if (!workspace) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    }
    await deleteWorkspace(workspace);

    return NextResponse.json(workspace);
  },
  {
    requiredPermissions: ["WORKSPACES_DELETE"],
  },
);
