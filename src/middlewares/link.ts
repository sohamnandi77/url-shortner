import { APP_HEADERS } from "@/constants/main";
import { getLinksBasedOnDomainAndKey } from "@/data/links";
import { createResponseWithCookie } from "@/lib/create-response-with-cookie";
import { isSupportedDeeplinkProtocol } from "@/lib/deeplink-supported";
import { detectBot } from "@/lib/detect-bot";
import { isDefaultDomain } from "@/lib/domains";
import { getFinalUrl } from "@/lib/get-final-url";
import { parse } from "@/lib/parse";
import { punyEncode } from "@/lib/vendors";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { NextResponse, userAgent, type NextRequest } from "next/server";

export default async function LinkMiddleware(req: NextRequest) {
  const { domain, fullKey: originalKey } = parse(req);

  if (!domain) {
    return NextResponse.next();
  }

  // encode the key to ascii
  // links are case insensitive by default
  let key = punyEncode(originalKey.toLowerCase());

  // if key is empty string, set to _root (root domain link)
  if (key === "") {
    key = "_root";
  }

  const linkData = await getLinksBasedOnDomainAndKey(domain, originalKey);

  if (!linkData) {
    return NextResponse.redirect(new URL("/", req.url), {
      headers: {
        ...APP_HEADERS,
      },
      status: 302, // !! why 302 ? 302 is temporary redirect, 301 is permanent
    });
  }

  const {
    originalLink,
    proxy,
    cloaked,
    iframeable,
    password,
    expiredLinkByDate,
    expiredLink,
    expiredLinkByClicks,
    banned,
    shouldIndex,
    androidTargeting,
    geoTargeting,
    iosTargeting,
    uniqueClicks,
  } = linkData;

  // by default, we only index default dub domain links (e.g. dub.sh)
  // TODO: everything else is not indexed by default, unless the user has explicitly set it to be indexed
  const isIndexed = isDefaultDomain(domain) || shouldIndex === true;

  // CASE: If the link is password protected
  if (password) {
    const pass = req.nextUrl.searchParams.get("pass");
    // rewrite to auth page (/password/[domain]/[key]) if:
    // - no `pass` param is provided
    // - the `pass` param is incorrect
    // this will also ensure that no clicks are tracked unless the password is correct
    if (!pass) {
      return NextResponse.rewrite(
        new URL(`/password/${domain}/${encodeURIComponent(key)}`, req.url),
        {
          headers: {
            ...APP_HEADERS,
            ...(!isIndexed && {
              "X-Robots-Tag": "googlebot: noindex",
            }),
          },
        },
      );
    } else if (pass) {
      // strip it from the URL if it's correct
      req.nextUrl.searchParams.delete("pass");
    }
  }

  // CASE:  if the link is banned
  if (banned) {
    return NextResponse.rewrite(new URL("/banned", req.url), {
      headers: {
        ...APP_HEADERS,
        ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
      },
    });
  }

  // CASE: if the link has expired by Date
  if (
    expiredLinkByDate &&
    expiredLinkByDate &&
    new Date(expiredLinkByDate) < new Date()
  ) {
    if (expiredLink) {
      return NextResponse.redirect(expiredLink, {
        headers: {
          ...APP_HEADERS,
          ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    } else {
      return NextResponse.rewrite(new URL(`/expired/${domain}`, req.url), {
        headers: {
          ...APP_HEADERS,
          ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    }
  }

  // CASE: if the link has expired by Clicks
  if (expiredLinkByClicks && uniqueClicks >= parseInt(expiredLinkByClicks)) {
    if (expiredLink) {
      return NextResponse.redirect(expiredLink, {
        headers: {
          ...APP_HEADERS,
          ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    } else {
      return NextResponse.rewrite(new URL(`/expired/${domain}`, req.url), {
        headers: {
          ...APP_HEADERS,
          ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    }
  }

  const cookieStore = cookies();
  let clickId = cookieStore.get("dclid")?.value;
  if (!clickId) {
    clickId = nanoid(16);
  }

  // TODO: CASE for root domain links, if there's no destination URL, rewrite to placeholder page
  if (!originalLink) {
    return createResponseWithCookie(
      NextResponse.rewrite(new URL(`/${domain}`, req.url), {
        headers: {
          ...APP_HEADERS,
          // we only index root domain links if they're not subdomains
          ...(isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      }),
      { clickId, path: `/${originalKey}` },
    );
  }

  const isBot = detectBot(req);
  // CASE for bots, if the link is not indexed, rewrite to placeholder page
  if (isBot && proxy) {
    return createResponseWithCookie(
      NextResponse.rewrite(
        new URL(`/proxy/${domain}/${encodeURIComponent(key)}`, req.url),
        {
          headers: {
            ...APP_HEADERS,
            ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
          },
        },
      ),
      { clickId, path: `/${originalKey}` },
    );
  }

  //  CASE: If url supports deeplinking
  if (isSupportedDeeplinkProtocol(originalLink)) {
    return createResponseWithCookie(
      NextResponse.rewrite(
        new URL(
          `/deeplink/${encodeURIComponent(
            getFinalUrl(originalLink, {
              req,
              clickId,
            }),
          )}`,
          req.url,
        ),
        {
          headers: {
            ...APP_HEADERS,
            ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
          },
        },
      ),
      { clickId, path: `/${originalKey}` },
    );
  }

  // TODO: CASE: link cloaking is enabled

  if (cloaked) {
    if (iframeable) {
      return createResponseWithCookie(
        NextResponse.rewrite(
          new URL(
            `/cloaked/${encodeURIComponent(
              getFinalUrl(originalLink, {
                req,
                clickId,
              }),
            )}`,
            req.url,
          ),
          {
            headers: {
              ...APP_HEADERS,
              ...(!isIndexed && {
                "X-Robots-Tag": "googlebot: noindex",
              }),
            },
          },
        ),
        { clickId, path: `/${originalKey}` },
      );
    } else {
      // if link is not iframeable, use Next.js rewrite instead
      return createResponseWithCookie(
        NextResponse.rewrite(new URL(originalLink), {
          headers: {
            ...APP_HEADERS,
            ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
          },
        }),
        { clickId, path: `/${originalKey}` },
      );
    }
  }

  // CASE: redirect to iOS link if it is specified and the user is on an iOS device
  if (iosTargeting && userAgent(req).os?.name === "iOS") {
    return createResponseWithCookie(
      NextResponse.redirect(
        getFinalUrl(iosTargeting, {
          req,
          clickId,
        }),
        {
          headers: {
            ...APP_HEADERS,
            ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      { clickId, path: `/${originalKey}` },
    );
  }

  // CASE: redirect to Android link if it is specified and the user is on an Android device
  if (androidTargeting && userAgent(req).os?.name === "Android") {
    return createResponseWithCookie(
      NextResponse.redirect(
        getFinalUrl(androidTargeting, {
          req,
          clickId,
        }),
        {
          headers: {
            ...APP_HEADERS,
            ...(!isIndexed && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      { clickId, path: `/${originalKey}` },
    );
  }
  // TODO: CASE redirect to geo-specific link if it is specified and the user is in the specified country

  const { country } =
    process.env.VERCEL === "1" && req.geo ? req.geo : { country: null };

  if (geoTargeting && country) {
    return createResponseWithCookie(
      NextResponse.redirect(
        getFinalUrl(geoTargeting[country as keyof typeof geoTargeting], {
          req,
          clickId,
        }),
        {
          headers: {
            ...APP_HEADERS,
            ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      { clickId, path: `/${originalKey}` },
    );
  }
  // regular redirect
  if (originalLink) {
    return createResponseWithCookie(
      NextResponse.redirect(
        getFinalUrl(originalLink, {
          req,
          clickId,
        }),
        {
          headers: {
            ...APP_HEADERS,
            ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
          },
          status: key === "_root" ? 301 : 302,
        },
      ),
      { clickId, path: `/${originalKey}` },
    );
  }
}
