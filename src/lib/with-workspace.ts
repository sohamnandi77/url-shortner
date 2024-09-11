import {
  getPermissionsByRole,
  type PermissionAction,
} from "@/config/rbac/permissions";
import { TOKEN_PREFIX, type Plan } from "@/constants/main";
import { ApiError, handleAndReturnErrorResponse } from "@/lib/errors";
import { getSearchParams } from "@/lib/get-search-params";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { type WorkspaceWithUsers } from "@/types";
import { type Session } from "next-auth";
import { withAxiom, type AxiomRequest } from "next-axiom";
import { hashToken } from "./hash-token";
import { throwIfNoAccess } from "./permissions";

type WithWorkspaceHandler = ({
  req,
  params,
  searchParams,
  headers,
  session,
  workspace,
  permissions,
}: {
  req: Request;
  params: Record<string, string>;
  searchParams: Record<string, string>;
  headers?: Record<string, string>;
  session?: Session;
  workspace?: WorkspaceWithUsers;
  permissions?: PermissionAction[];
}) => Promise<Response>;

export const withWorkspace = (
  handler: WithWorkspaceHandler,
  {
    requiredPermissions = [],
    allowAnonymous, // special case for /api/links (POST /api/links) – allow no session
    skipPermissionChecks, // if the action doesn't need to check for required permission(s)
  }: {
    requiredPlan?: Plan[];
    allowAnonymous?: boolean;
    skipPermissionChecks?: boolean;
    requiredPermissions?: PermissionAction[];
  } = {},
) => {
  return withAxiom(
    async (
      req: AxiomRequest,
      { params = {} }: { params?: Record<string, string> },
    ) => {
      const searchParams = getSearchParams(req.url);

      let apiKey: string | undefined = undefined;
      const headers = {};

      try {
        const authorizationHeader = req.headers.get("Authorization");
        if (authorizationHeader) {
          if (!authorizationHeader.includes("Bearer ")) {
            throw new ApiError({
              code: "BAD_REQUEST",
              message: "Misconfigured authorization header.",
            });
          }
          apiKey = authorizationHeader.replace("Bearer ", "");
        }

        let workspaceSlug: string | undefined;
        let permissions: PermissionAction[] = [];
        let token;
        let session: Session | null;

        const isRestrictedToken = apiKey?.startsWith(TOKEN_PREFIX);

        const idOrSlug = params?.slug ?? searchParams.workspaceSlug;

        // if there's no slug and it's not a restricted token
        // For restricted tokens, we find the workspaceId from the token
        if (!idOrSlug) {
          // for /api/links (POST /api/links) – allow no session (but warn if user provides apiKey)
          if (allowAnonymous && !apiKey) {
            return await handler({
              req,
              params,
              searchParams,
              headers,
            });
          } else {
            throw new ApiError({
              code: "NOT_FOUND",
              message: "Workspace ID not found.",
            });
          }
        }

        if (idOrSlug) {
          workspaceSlug = idOrSlug;
        }

        // Either
        if (apiKey) {
          const hashedKey = await hashToken(apiKey);
          if (isRestrictedToken) {
            token = await db.restrictedToken.findUnique({
              where: {
                hashedKey,
              },
              select: {
                ...(isRestrictedToken && {
                  scopes: true,
                  rateLimit: true,
                  workspaceId: true,
                  expires: true,
                }),
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    defaultWorkspace: true,
                  },
                },
              },
            });
          }

          if (!token?.user) {
            throw new ApiError({
              code: "UNAUTHORIZED",
              message: "Unauthorized: Invalid API key.",
            });
          }

          if (token.expires && token.expires < new Date()) {
            throw new ApiError({
              code: "UNAUTHORIZED",
              message: "Unauthorized: Access token expired.",
            });
          }

          if (isRestrictedToken) {
            await db.restrictedToken.update({
              where: {
                hashedKey,
              },
              data: {
                lastUsed: new Date(),
              },
            });
          }

          session = {
            user: {
              id: token.user.id,
              name: token.user.name ?? "",
              email: token.user.email ?? "",
              image: token.user.image ?? "",
              defaultWorkspace: token.user.defaultWorkspace ?? "",
            },
            expires: token.expires?.toDateString() ?? "",
          };
        } else {
          session = await auth();
          if (!session?.user?.id) {
            throw new ApiError({
              code: "UNAUTHORIZED",
              message: "Unauthorized: Login required.",
            });
          }
        }

        const workspace = (await prisma?.workspace.findUnique({
          where: {
            slug: workspaceSlug ?? undefined,
          },
          include: {
            users: {
              where: {
                userId: session?.user.id,
              },
              select: {
                role: true,
              },
            },
          },
        })) as WorkspaceWithUsers;

        // workspace doesn't exist
        if (!workspace?.users) {
          throw new ApiError({
            code: "NOT_FOUND",
            message: "Workspace not found.",
          });
        }

        permissions = getPermissionsByRole(workspace?.users[0]?.role);

        // Check user has permission to make the action
        if (!skipPermissionChecks) {
          throwIfNoAccess({
            permissions,
            requiredPermissions,
            workspaceId: workspace.id,
          });
        }

        // TODO: beta feature checks

        return await handler({
          req,
          params,
          searchParams,
          headers,
          session,
          workspace,
          permissions,
        });
      } catch (error) {
        req.log.error(error as string);
        return handleAndReturnErrorResponse(error, headers);
      }
    },
  );
};
