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

          const hashedKey = await hashToken(apiKey);

          const user = await db.user.findFirst({
            where: {
              tokens: {
                some: {
                  hashedKey,
                },
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              defaultWorkspace: true,
            },
          });
          if (!user) {
            throw new ApiError({
              code: "UNAUTHORIZED",
              message: "Unauthorized: Invalid API key.",
            });
          }

          await db.token.update({
            where: {
              hashedKey,
            },
            data: {
              lastUsed: new Date(),
            },
          });

          session = {
            user: {
              id: user.id,
              name: user.name ?? "",
              email: user.email ?? "",
              image: user.image ?? "",
              defaultWorkspace: user.defaultWorkspace ?? "",
            },
            expires: new Date()?.toDateString() ?? "",
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
