import { TOKEN_PREFIX } from "@/constants/main";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { type Session } from "next-auth";
import { type AxiomRequest, withAxiom } from "next-axiom";
import { ApiError, handleAndReturnErrorResponse } from "./errors";
import { getSearchParams } from "./get-search-params";
import { hashToken } from "./hash-token";

type WithSessionHandler = ({
  req,
  params,
  searchParams,
  session,
}: {
  req: Request;
  params: Record<string, string>;
  searchParams: Record<string, string>;
  session: Session;
}) => Promise<Response>;

export const withSession = (handler: WithSessionHandler) =>
  withAxiom(
    async (
      req: AxiomRequest,
      { params = {} }: { params: Record<string, string> | undefined },
    ) => {
      try {
        let session: Session | null;
        let token;

        const authorizationHeader = req.headers.get("Authorization");
        if (authorizationHeader) {
          if (!authorizationHeader.includes("Bearer ")) {
            throw new ApiError({
              code: "BAD_REQUEST",
              message:
                "Misconfigured authorization header. Did you forget to add 'Bearer '?",
            });
          }
          const apiKey = authorizationHeader.replace("Bearer ", "");
          const isRestrictedToken = apiKey?.startsWith(TOKEN_PREFIX);

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
                    createdAt: true,
                    updatedAt: true,
                    lockedAt: true,
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
              provider: "credentials",
              createdAt: token.user.createdAt,
              updatedAt: token.user.updatedAt,
              lockedAt: token.user.lockedAt ?? undefined,
            },
            expires: token.expires?.toDateString() ?? "",
          };
        } else {
          session = await auth();
          if (!session?.user.id) {
            throw new ApiError({
              code: "UNAUTHORIZED",
              message: "Unauthorized: Login required.",
            });
          }
        }

        if (!session) {
          throw new ApiError({
            code: "UNAUTHORIZED",
            message: "Unauthorized: Default workspace not set.",
          });
        }

        const searchParams = getSearchParams(req.url);
        return await handler({ req, params, searchParams, session });
      } catch (error) {
        req.log.error(error as string);
        return handleAndReturnErrorResponse(error);
      }
    },
  );
