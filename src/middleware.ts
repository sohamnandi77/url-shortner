import NextAuth from "next-auth";

import {
  API_HOSTNAMES,
  APP_HOSTNAMES,
  DEFAULT_REDIRECTS,
} from "@/constants/main";
import { env } from "@/env";
import { parse } from "@/lib/parse";
import { isValidUrl } from "@/lib/url";
import {
  ApiMiddleware,
  AppMiddleware,
  CreateLinkMiddleware,
  LinkMiddleware,
} from "@/middlewares";
import { providers } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(providers);

export default auth((req: NextRequest) => {
  const { domain, key, fullKey } = parse(req);

  // for App
  if (APP_HOSTNAMES.has(domain)) {
    return AppMiddleware(req);
  }

  // for API
  if (API_HOSTNAMES.has(domain)) {
    return ApiMiddleware(req);
  }

  // default redirects for app domain
  if (
    domain === env.NEXT_PUBLIC_APP_DOMAIN &&
    DEFAULT_REDIRECTS[key as keyof typeof DEFAULT_REDIRECTS]
  ) {
    return NextResponse.redirect(
      DEFAULT_REDIRECTS[key as keyof typeof DEFAULT_REDIRECTS],
    );
  }

  if (isValidUrl(fullKey)) {
    return CreateLinkMiddleware(req);
  }

  return LinkMiddleware(req);
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_proxy/ (proxies for third-party services)
     * 4. /_static (inside /public)
     * 5. /_vercel (Vercel internals)
     * 6  /trpc (trpc routes)
     * 7. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    "/((?!_next/|_proxy/|trpc|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};
