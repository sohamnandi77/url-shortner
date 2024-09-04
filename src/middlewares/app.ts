import { parse } from "@/lib/parse";
import { AUTH_ROUTES } from "@/routes";
import { NextResponse, type NextRequest } from "next/server";

interface CustomNextRequest extends NextRequest {
  auth?: unknown;
}

export default async function AppMiddleware(req: CustomNextRequest) {
  const { nextUrl } = req;
  const { path, fullPath, searchParamsString } = parse(req);
  const isLoggedIn = !!req?.auth;

  if (!isLoggedIn) {
    return NextResponse.redirect(
      new URL(
        `/login${path === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        req.url,
      ),
    );
  }

  if (isLoggedIn) {
    // TODO: /new is a special path that creates a new link (or workspace if the user doesn't have one yet)
    // TODO: /onboarding
    // ->  - User was created less than a day ago
    // -> - User is not invited to a workspace (redirect straight to the workspace)
    // -> - The path does not start with /onboarding

    // TODO: redirect to default workspace if the user has one

    // const defaultWorkspace = await getDefaultWorkspace(user);
    const defaultWorkspace = "soham-nandi";
    if (defaultWorkspace) {
      let redirectPath = path;
      if (AUTH_ROUTES.has(path)) {
        redirectPath = "";
      }
      //   else if (
      //     path === "/integrations" ||
      //     path.startsWith("/integrations/")
      //   ) {
      //     redirectPath = `/settings/${path}`;
      //   }
      return NextResponse.redirect(
        new URL(
          `/${defaultWorkspace}${redirectPath}${searchParamsString}`,
          req.url,
        ),
      );
    } else {
      return NextResponse.redirect(new URL("/workspaces", req.url));
    }
  }

  return;
}
