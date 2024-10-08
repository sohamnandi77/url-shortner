import { getDefaultWorkspaceByEmail } from "@/data/workspace";
import { parse } from "@/lib/parse";
import { AUTH_ROUTES } from "@/routes";
import { type RequestAuthUser } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export default async function WorkspacesMiddleware(
  req: NextRequest,
  user: RequestAuthUser,
) {
  const { path, searchParamsString } = parse(req);

  const defaultWorkspace = await getDefaultWorkspaceByEmail(user?.email);

  if (defaultWorkspace) {
    let redirectPath = path;
    if (AUTH_ROUTES.has(path)) {
      redirectPath = "";
    }
    return NextResponse.redirect(
      new URL(
        `/${defaultWorkspace}${redirectPath}${searchParamsString}`,
        req.url,
      ),
    );
  }

  return NextResponse.redirect(new URL("/workspaces", req.url));
}
