import { FREE_WORKSPACES_LIMIT } from "@/constants/main";
import { ApiError } from "@/lib/errors";
import { withSession } from "@/lib/with-session";
import { createWorkspaceSchema, WorkspaceSchema } from "@/schema/workspaces";
import { db } from "@/server/db";
import { checkIfUserExists } from "@/services/users/check-If-user-exists";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

// GET /api/workspaces - get all projects for the current user
export const GET = withSession(async ({ session }) => {
  const workspaces = await db.workspace.findMany({
    where: {
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      users: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });
  return NextResponse.json(
    workspaces.map((workspace) =>
      WorkspaceSchema.parse({ ...workspace, id: `ws_${workspace.id}` }),
    ),
  );
});

// POST /api/workspaces - create a new workspace
export const POST = withSession(async ({ req, session }) => {
  const { name, slug } = await createWorkspaceSchema.parseAsync(
    await req.json(),
  );

  const userExists = await checkIfUserExists(session.user.id);

  if (!userExists) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: "Session expired. Please log in again.",
    });
  }

  const freeWorkspaces = await db.workspace.count({
    where: {
      plan: "FREE",
      users: {
        some: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  });

  if (freeWorkspaces >= FREE_WORKSPACES_LIMIT) {
    throw new ApiError({
      code: "LIMIT_EXCEEDED",
      message: `You can only create up to ${FREE_WORKSPACES_LIMIT} free workspaces. Additional workspaces require a paid plan.`,
    });
  }

  try {
    const workspaceResponse = await db.workspace.create({
      data: {
        name,
        slug,
        users: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
        inviteCode: nanoid(24),
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        users: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // if the user has no default workspace, set the new workspace as the default
    if (session.user.defaultWorkspace === null) {
      await db.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          defaultWorkspace: workspaceResponse.slug,
        },
      });
    }

    return NextResponse.json(
      WorkspaceSchema.parse({
        ...workspaceResponse,
        id: `ws_${workspaceResponse.id}`,
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
});
