import { NextResponse, type NextRequest } from "next/server";

import { parse } from "@/lib/parse";
// import WorkspacesMiddleware from "@/middlewares/workspace";
import { type RequestAuthUser } from "@/types";

interface CustomNextRequest extends NextRequest {
  auth?: {
    user: RequestAuthUser;
  };
}

export default async function AppMiddleware(req: CustomNextRequest) {
  const { path, fullPath } = parse(req);
  const auth = req?.auth;
  const isLoggedIn = !!auth;
  const user = auth?.user;

  // if the user is not logged in and the path isn't /login or /register, redirect to /login
  if (!isLoggedIn && path !== "/login" && path !== "/register") {
    return NextResponse.redirect(
      new URL(
        `/login${path === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        req.url,
      ),
    );
  }

  if (isLoggedIn && user) {
    // /new is a special path that creates a new link (or workspace if the user doesn't have one yet)
    // if (path === "/new") {
    //   return NewLinkMiddleware(req, user);
    // }

    // if (["/", "/login", "/register", "/settings"].includes(path)) {
    //   // redirect to default workspace if the user has one
    //   return WorkspacesMiddleware(req, user);
    // }
    return NextResponse.redirect(new URL("/workspaces", req.url));
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(new URL(`/app${fullPath}`, req.url));
}
