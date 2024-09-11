import { APP_DOMAIN_ROUTE } from "@/constants/main";
import { getDefaultWorkspaceByEmail } from "@/data/workspace";
import { parse } from "@/lib/parse";
import { type RequestAuthUser } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export default async function NewLinkMiddleware(
  req: NextRequest,
  user: RequestAuthUser,
) {
  const { fullPath } = parse(req);

  const defaultWorkspace = await getDefaultWorkspaceByEmail(user?.email);

  const searchParams = new URL(fullPath, APP_DOMAIN_ROUTE).searchParams;

  if (defaultWorkspace) {
    return NextResponse.redirect(
      new URL(
        `/${defaultWorkspace}?newLink=${searchParams.get("link") ?? true}${searchParams.has("domain") ? `&newLinkDomain=${searchParams.get("domain")}` : ""}`,
        req.url,
      ),
    );
  } else {
    return NextResponse.redirect(
      new URL(`/workspaces?newWorkspace=true`, req.url),
    );
  }
}
