import { ApiError } from "@/lib/errors";
import { withSession } from "@/lib/with-session";
import { UpdateUserSchema } from "@/schema/user";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

// GET /api/user – get a specific user
export const GET = withSession(async ({ session }) => {
  const [user, account] = await Promise.all([
    db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        defaultWorkspace: true,
        password: true,
      },
    }),
    db.account.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        provider: true,
      },
    }),
  ]);

  return NextResponse.json({
    ...user,
    provider: account?.provider,
    hasPassword: user?.password !== null,
    passwordHash: undefined,
  });
});

// PATCH /api/user – edit a specific user
export const PATCH = withSession(async ({ req, session }) => {
  const { name, email, image, defaultWorkspace } =
    await UpdateUserSchema.parseAsync(await req.json());

  if (defaultWorkspace) {
    const workspaceUser = await db.workspaceUsers.findFirst({
      where: {
        userId: session.user.id,
        workspace: {
          slug: defaultWorkspace,
        },
      },
    });

    if (!workspaceUser) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: `You don't have access to the workspace ${defaultWorkspace}.`,
      });
    }
  }

  try {
    const response = await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(image && { image }),
        ...(defaultWorkspace && { defaultWorkspace }),
        ...(name || email || image || defaultWorkspace
          ? { updatedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ("code" in error && (error as { code?: string }).code === "P2002") {
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

// DELETE /api/user – delete a specific user
export const DELETE = withSession(async ({ session }) => {
  const userIsOwnerOfWorkspaces = await db.workspaceUsers.findMany({
    where: {
      userId: session.user.id,
      role: "ADMIN",
    },
  });
  if (userIsOwnerOfWorkspaces.length > 0) {
    return new Response(
      "You must transfer ownership of your workspaces or delete them before you can delete your account.",
      { status: 422 },
    );
  } else {
    const response = await db.user.delete({
      where: {
        id: session.user.id,
      },
    });
    return NextResponse.json(response);
  }
});
