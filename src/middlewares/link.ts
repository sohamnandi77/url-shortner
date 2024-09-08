import { getLinksBasedOnDomainAndKey } from "@/data/links";
import { isSupportedDeeplinkProtocol } from "@/lib/deeplink-supported";
import { detectBot } from "@/lib/detect-bot";
import { parse } from "@/lib/parse";
import { NextResponse, userAgent, type NextRequest } from "next/server";

export default async function LinkMiddleware(req: NextRequest) {
  const { domain, fullKey: originalKey } = parse(req);

  if (!domain) {
    return NextResponse.next();
  }

  // TODO: encode the key to ascii
  // let key = punyEncode(originalKey.toLowerCase());
  let key = originalKey;

  // if key is empty string, set to _root (root domain link)
  if (key === "") {
    key = "_root";
  }

  const linkData = await getLinksBasedOnDomainAndKey(domain, originalKey);

  if (!linkData) {
    return NextResponse.redirect(new URL("/", req.url), {
      status: 302, // !! why 302 ? 302 is temporary redirect, 301 is permanent
    });
  }

  const {
    id: linkId,
    password,
    expiresAt,
    expiredLinkByDate,
    expiredLink,
    expiredLinkByClicks,
    banned,
    androidTargeting,
    geoTargeting,
    iosTargeting,
    originalLink,
    uniqueClicks,
  } = linkData;

  // by default, we only index default dub domain links (e.g. dub.sh)
  // TODO: everything else is not indexed by default, unless the user has explicitly set it to be indexed
  // const shouldIndex = isDubDomain(domain) || doIndex === true;
  const shouldIndex = false;

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
            ...(!shouldIndex && {
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
        // ...DUB_HEADERS,
        ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
      },
    });
  }

  // CASE: if the link has expired by Date
  if (expiredLinkByDate && expiresAt && new Date(expiresAt) < new Date()) {
    if (expiredLink) {
      return NextResponse.redirect(expiredLink as string, {
        headers: {
          // ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    } else {
      return NextResponse.rewrite(new URL(`/expired/${domain}`, req.url), {
        headers: {
          // ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    }
  }

  // CASE: if the link has expired by Clicks
  if (expiredLinkByClicks && uniqueClicks >= parseInt(expiredLinkByClicks)) {
    if (expiredLink) {
      return NextResponse.redirect(expiredLink, {
        headers: {
          // ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    } else {
      return NextResponse.rewrite(new URL(`/expired/${domain}`, req.url), {
        headers: {
          // ...DUB_HEADERS,
          ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
        },
      });
    }
  }

  // TODO: CASE for root domain links, if there's no destination URL, rewrite to placeholder page
  if (!originalLink) {
    //   ev.waitUntil(
    //     recordClick({
    //       req,
    //       linkId,
    //       clickId,
    //       url,
    //       webhookIds,
    //     }),
    //   );
    //   return createResponseWithCookie(
    //     NextResponse.rewrite(new URL(`/${domain}`, req.url), {
    //       headers: {
    //         ...DUB_HEADERS,
    //         // we only index root domain links if they're not subdomains
    //         ...(shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //     }),
    //     { clickId, path: `/${originalKey}` },
    //   );
  }

  const isBot = detectBot(req);
  // TODO: CASE for bots, if the link is not indexed, rewrite to placeholder page
  if (isBot) {
    // return createResponseWithCookie(
    //   NextResponse.rewrite(
    //     new URL(`/proxy/${domain}/${encodeURIComponent(key)}`, req.url),
    //     {
    //       headers: {
    //         ...DUB_HEADERS,
    //         ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //     },
    //   ),
    //   { clickId, path: `/${originalKey}` },
    // );
  }

  // TODO: CASE: If url supports deeplinking
  if (isSupportedDeeplinkProtocol(originalLink)) {
    // ev.waitUntil(
    //   recordClick({
    //     req,
    //     linkId,
    //     clickId,
    //     url,
    //     webhookIds,
    //   }),
    // );
    // return createResponseWithCookie(
    //   NextResponse.rewrite(
    //     new URL(
    //       `/deeplink/${encodeURIComponent(
    //         getFinalUrl(url, {
    //           req,
    //           clickId: trackConversion ? clickId : undefined,
    //         }),
    //       )}`,
    //       req.url,
    //     ),
    //     {
    //       headers: {
    //         ...DUB_HEADERS,
    //         ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //     },
    //   ),
    //   { clickId, path: `/${originalKey}` },
    // );
  }

  // TODO: CASE: link cloaking is enabled

  // if (rewrite) {
  //   ev.waitUntil(
  //     recordClick({
  //       req,
  //       linkId,
  //       clickId,
  //       url,
  //       webhookIds,
  //     }),
  //   );

  //   if (iframeable) {
  //     return createResponseWithCookie(
  //       NextResponse.rewrite(
  //         new URL(
  //           `/cloaked/${encodeURIComponent(
  //             getFinalUrl(url, {
  //               req,
  //               clickId: trackConversion ? clickId : undefined,
  //             }),
  //           )}`,
  //           req.url,
  //         ),
  //         {
  //           headers: {
  //             ...DUB_HEADERS,
  //             ...(!shouldIndex && {
  //               "X-Robots-Tag": "googlebot: noindex",
  //             }),
  //           },
  //         },
  //       ),
  //       { clickId, path: `/${originalKey}` },
  //     );
  //   } else {
  //     // if link is not iframeable, use Next.js rewrite instead
  //     return createResponseWithCookie(
  //       NextResponse.rewrite(url, {
  //         headers: {
  //           ...DUB_HEADERS,
  //           ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
  //         },
  //       }),
  //       { clickId, path: `/${originalKey}` },
  //     );
  //   }

  // }

  // CASE: redirect to iOS link if it is specified and the user is on an iOS device
  if (iosTargeting && userAgent(req).os?.name === "iOS") {
    // ev.waitUntil(
    //   recordClick({
    //     req,
    //     linkId,
    //     clickId,
    //     url: ios,
    //     webhookIds,
    //   }),
    // );
    // return createResponseWithCookie(
    //   NextResponse.redirect(
    //     getFinalUrl(ios, {
    //       req,
    //       clickId: trackConversion ? clickId : undefined,
    //     }),
    //     {
    //       headers: {
    //         ...DUB_HEADERS,
    //         ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //       status: key === "_root" ? 301 : 302,
    //     },
    //   ),
    //   { clickId, path: `/${originalKey}` },
    // );
  }

  // CASE: redirect to Android link if it is specified and the user is on an Android device
  if (androidTargeting && userAgent(req).os?.name === "Android") {
    // ev.waitUntil(
    //   recordClick({
    //     req,
    //     linkId,
    //     clickId,
    //     url: android,
    //     webhookIds,
    //   }),
    // );
    // return createResponseWithCookie(
    //   NextResponse.redirect(
    //     getFinalUrl(android, {
    //       req,
    //       clickId: trackConversion ? clickId : undefined,
    //     }),
    //     {
    //       headers: {
    //         ...DUB_HEADERS,
    //         ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //       status: key === "_root" ? 301 : 302,
    //     },
    //   ),
    //   { clickId, path: `/${originalKey}` },
    // );
  }
  // TODO: CASE redirect to geo-specific link if it is specified and the user is in the specified country

  const { country } =
    process.env.VERCEL === "1" && req.geo ? req.geo : { country: null };

  if (geoTargeting && country && country in geoTargeting) {
    // ev.waitUntil(
    //   recordClick({
    //     req,
    //     linkId,
    //     clickId,
    //     url: geo[country],
    //     webhookIds,
    //   }),
    // );
    // return createResponseWithCookie(
    //   NextResponse.redirect(
    //     getFinalUrl(geo[country], {
    //       req,
    //       clickId: trackConversion ? clickId : undefined,
    //     }),
    //     {
    //       headers: {
    //         ...DUB_HEADERS,
    //         ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //       status: key === "_root" ? 301 : 302,
    //     },
    //   ),
    //   { clickId, path: `/${originalKey}` },
    // );
  }
  // regular redirect
  if (originalLink) {
    // ev.waitUntil(
    //   recordClick({
    //     req,
    //     linkId,
    //     clickId,
    //     url,
    //     webhookIds,
    //   }),
    // );
    // return createResponseWithCookie(
    //   NextResponse.redirect(
    //     getFinalUrl(url, {
    //       req,
    //       clickId: trackConversion ? clickId : undefined,
    //     }),
    //     {
    //       headers: {
    //         ...DUB_HEADERS,
    //         ...(!shouldIndex && { "X-Robots-Tag": "googlebot: noindex" }),
    //       },
    //       status: key === "_root" ? 301 : 302,
    //     },
    //   ),
    //   { clickId, path: `/${originalKey}` },
    // );
  }
}
