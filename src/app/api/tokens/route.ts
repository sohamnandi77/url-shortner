import { validateScopesForRole } from "@/config/rbac/permissions";
import { TOKEN_PREFIX } from "@/constants/main";
import { ApiError } from "@/lib/errors";
import { hashToken } from "@/lib/hash-token";
import { parseRequestBody } from "@/lib/parse-request-body";
import { withWorkspace } from "@/lib/with-workspace";
import { createTokenSchema, tokenSchema } from "@/schema/token";
import { db } from "@/server/db";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

// GET /api/tokens - get all tokens for a workspace
export const GET = withWorkspace(
  async ({ workspace }) => {
    const tokens = await db.restrictedToken.findMany({
      where: {
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
      orderBy: [{ lastUsed: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(tokenSchema.array().parse(tokens));
  },
  {
    requiredPermissions: ["TOKENS_READ"],
  },
);

// POST /api/tokens – create a new token for a workspace
export const POST = withWorkspace(
  async ({ req, session, workspace }) => {
    const { name, scopes } = createTokenSchema.parse(
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

    // Only workspace owners can create machine users
    if (role !== "ADMIN") {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "Only workspace owners can create machine users.",
      });
    }

    if (!validateScopesForRole(scopes ?? [], role)) {
      throw new ApiError({
        code: "UNPROCESSABLE_ENTITY",
        message: "Some of the given scopes are not available for your role.",
      });
    }

    // Create token
    const token = `${TOKEN_PREFIX}${nanoid(24)}`;
    const hashedKey = await hashToken(token);

    await db.restrictedToken.create({
      data: {
        name,
        hashedKey,
        userId: session?.user.id ?? "",
        workspaceId: workspace?.id ?? "",
        scopes:
          scopes && scopes.length > 0 ? [...new Set(scopes)].join(" ") : null,
      },
    });

    return NextResponse.json({ token });
  },
  {
    requiredPermissions: ["TOKENS_CREATE"],
  },
);
