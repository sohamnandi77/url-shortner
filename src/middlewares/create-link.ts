import { APP_DOMAIN_ROUTE } from "@/constants/main";
import { parse } from "@/lib/parse";
import { getUrlFromString } from "@/lib/url";
import { type NextRequest, NextResponse } from "next/server";

export default function CreateLinkMiddleware(req: NextRequest) {
  const { domain, fullPath } = parse(req);

  const url = getUrlFromString(fullPath.slice(1));

  const redirectURL = new URL(`${APP_DOMAIN_ROUTE}/new`);
  redirectURL.searchParams.append("link", url);
  redirectURL.searchParams.append("domain", domain);

  return NextResponse.redirect(redirectURL.toString());
}
