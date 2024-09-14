import NextAuth from "next-auth";

import { APP_HOSTNAMES, DEFAULT_REDIRECTS } from "@/constants/main";
import { env } from "@/env";
import { parse } from "@/lib/parse";
import { AppMiddleware, AxiomMiddleware } from "@/middlewares";
import { providers } from "@/server/providers";
import { type NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(providers);

export default auth(async (req: NextRequest) => {
  const { domain, key } = parse(req);

  await AxiomMiddleware(req);

  // for App
  if (APP_HOSTNAMES.has(domain)) {
    return AppMiddleware(req);
  }

  // for API
  // if (API_HOSTNAMES.has(domain)) {
  //   return ApiMiddleware(req);
  // }

  // default redirects for app domain
  if (
    domain === env.NEXT_PUBLIC_APP_DOMAIN &&
    DEFAULT_REDIRECTS[key as keyof typeof DEFAULT_REDIRECTS]
  ) {
    return NextResponse.redirect(
      DEFAULT_REDIRECTS[key as keyof typeof DEFAULT_REDIRECTS],
    );
  }

  // return LinkMiddleware(req);
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
    "/((?!api/|_next/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};
