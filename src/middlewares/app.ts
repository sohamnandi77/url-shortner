import { NextResponse, type NextRequest } from "next/server";

import { parse } from "@/lib/parse";
import NewLinkMiddleware from "@/middlewares/new-link";
import WorkspacesMiddleware from "@/middlewares/workspace";

interface CustomNextRequest extends NextRequest {
  auth?: unknown;
}

export default async function AppMiddleware(req: CustomNextRequest) {
  const { path, fullPath } = parse(req);
  const user = req?.auth;
  const isLoggedIn = !!user;

  // if the user is not logged in and the path isn't /login or /register, redirect to /login
  if (!isLoggedIn && path !== "/login" && path !== "/register") {
    return NextResponse.redirect(
      new URL(
        `/login${path === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        req.url,
      ),
    );
  }

  if (isLoggedIn) {
    // /new is a special path that creates a new link (or workspace if the user doesn't have one yet)
    if (path === "/new") {
      return NewLinkMiddleware(req, user);
    }

    if (
      ["/", "/login", "/register", "/analytics", "/settings"].includes(path)
    ) {
      // redirect to default workspace if the user has one
      return WorkspacesMiddleware(req, user);
    }
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(new URL(`/app${fullPath}`, req.url));
}
