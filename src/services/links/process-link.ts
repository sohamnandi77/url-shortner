import { UTM_TAGS } from "@/constants/main";
import { env } from "@/env";
import { parseDateTime } from "@/lib/datetime";
import { type ErrorCodes } from "@/lib/errors";
import {
  constructURLFromUTMParams,
  getUrlFromString,
  isValidUrl,
} from "@/lib/url";
import { db } from "@/server/db";
import {
  type IWorkspace,
  type NewLinkProps,
  type ProcessedLinkProps,
} from "@/types";
import { checkIfUserExists } from "../users/check-If-user-exists";
import { combineTagIds } from "../utils/combine-tag-ids";
import { keyChecks } from "../utils/key-checks";
import { processKey } from "../utils/process-key";

export async function processLink<T extends Record<string, unknown>>({
  payload,
  workspace,
  userId,
  skipKeyChecks = false, // only skip when key doesn't change (e.g. when editing a link)
}: {
  payload: NewLinkProps & T;
  workspace?: Pick<IWorkspace, "id" | "plan">;
  userId?: string;
  skipKeyChecks?: boolean;
}): Promise<
  | {
      link: NewLinkProps & T;
      error: string;
      code?: ErrorCodes;
      status?: number;
    }
  | {
      link: ProcessedLinkProps & T;
      error: null;
      code?: never;
      status?: never;
    }
> {
  const { tagNames } = payload;

  let { originalLink, expiredUrl, keyword, domain } = payload;

  let expiresAt: string | Date | null | undefined = payload.expiredLinkByDate;
  const tagIds = combineTagIds(payload);

  // if URL is defined, perform URL checks
  if (originalLink) {
    originalLink = getUrlFromString(payload.originalLink);

    if (!isValidUrl(originalLink)) {
      return {
        link: payload,
        error: "Invalid destination URL",
        code: "UNPROCESSABLE_ENTITY",
      };
    }
    if (UTM_TAGS.some((tag) => payload[tag])) {
      const utmParams = UTM_TAGS.reduce<Record<string, string>>((acc, tag) => {
        if (payload[tag]) {
          acc[tag] = payload[tag];
        }
        return acc;
      }, {});
      originalLink = constructURLFromUTMParams(originalLink, utmParams);
    }
    // only root domain links can have empty desintation URL
  } else if (keyword !== "_root") {
    return {
      link: payload,
      error: "Missing destination URL",
      code: "BAD_REQUEST",
    };
  }

  // if domain is not defined, set it to the workspace's primary domain
  if (!domain) {
    domain = env.NEXT_PUBLIC_APP_DOMAIN;
  }

  // checks for dub.sh links
  if (domain === env.NEXT_PUBLIC_APP_DOMAIN) {
    // check if user exists (if userId is passed)
    if (userId) {
      const userExists = await checkIfUserExists(userId);
      if (!userExists) {
        return {
          link: payload,
          error: "Session expired. Please log in again.",
          code: "NOT_FOUND",
        };
      }
    }
  } else if (!skipKeyChecks) {
    const processedKeyword = processKey({ domain, keyword });

    if (!processedKeyword) {
      return {
        link: payload,
        error: "Invalid keyword.",
        code: "UNPROCESSABLE_ENTITY",
      };
    }
    keyword = processedKeyword;

    const response = await keyChecks({ domain, keyword, workspace });
    if (response.error && response.code) {
      return {
        link: payload,
        error: response.error,
        code: response.code,
      };
    }
  } else if (tagIds && tagIds.length > 0) {
    const tags = await db.tag.findMany({
      select: {
        id: true,
      },
      where: { workspaceId: workspace?.id, id: { in: tagIds } },
    });

    if (tags.length !== tagIds.length) {
      return {
        link: payload,
        error:
          "Invalid tagIds detected: " +
          tagIds
            .filter(
              (tagId) => tags.find(({ id }) => tagId === id) === undefined,
            )
            .join(", "),
        code: "UNPROCESSABLE_ENTITY",
      };
    }
  } else if (tagNames && tagNames.length > 0) {
    const tags = await db.tag.findMany({
      select: {
        name: true,
      },
      where: {
        workspaceId: workspace?.id,
        name: { in: tagNames },
      },
    });

    if (tags.length !== tagNames.length) {
      return {
        link: payload,
        error:
          "Invalid tagNames detected: " +
          tagNames
            .filter(
              (tagName) =>
                tags.find(({ name }) => tagName === name) === undefined,
            )
            .join(", "),
        code: "UNPROCESSABLE_ENTITY",
      };
    }
  }

  // expire date checks
  if (expiresAt) {
    const datetime = parseDateTime(expiresAt);
    if (!datetime) {
      return {
        link: payload,
        error: "Invalid expiration date.",
        code: "UNPROCESSABLE_ENTITY",
      };
    }
    expiresAt = datetime;
    if (expiredUrl) {
      expiredUrl = getUrlFromString(expiredUrl);
      if (!isValidUrl(expiredUrl)) {
        return {
          link: payload,
          error: "Invalid expired URL.",
          code: "UNPROCESSABLE_ENTITY",
        };
      }
    }
  }

  // remove polyfill attributes from payload
  delete payload.shortLink;
  delete payload.qrCode;
  delete payload.prefix;
  UTM_TAGS.forEach((tag) => {
    delete payload[tag];
  });

  return {
    link: {
      ...payload,
      domain,
      keyword: keyword!,
      // we're redefining these fields because they're processed in the function
      originalLink,
      expiresAt,
      expiredUrl,
      // make sure projectId is set to the current workspace
      workspaceId: workspace?.id ?? null,
      // if userId is passed, set it (we don't change the userId if it's already set, e.g. when editing a link)
      ...(userId && {
        userId,
      }),
    },
    error: null,
  };
}
