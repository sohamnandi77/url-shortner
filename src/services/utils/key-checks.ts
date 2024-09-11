import { DEFAULT_REDIRECTS } from "@/constants/main";
import { env } from "@/env";
import { isDefaultDomain } from "@/lib/domains";
import { type ApiError } from "@/lib/errors";
import { type IWorkspace } from "@/types";
import { checkIfKeywordExists } from "../links/check-if-keyword-exists";

export async function keyChecks({
  domain,
  keyword,
  workspace,
}: {
  domain?: string;
  keyword: string;
  workspace?: Pick<IWorkspace, "plan">;
}): Promise<{ error: string | null; code?: ApiError["code"] }> {
  if (!domain || !keyword) {
    return {
      error: "Invalid request",
      code: "BAD_REQUEST",
    };
  }

  if (
    (keyword.length === 0 || keyword === "_root") &&
    workspace?.plan === "FREE"
  ) {
    return {
      error:
        "You can only set a redirect for your root domain on a Pro plan and above. Upgrade to Pro to unlock this feature.",
      code: "FORBIDDEN",
    };
  }

  const link = await checkIfKeywordExists(domain, keyword);
  if (link) {
    return {
      error: "Duplicate key: This short link already exists.",
      code: "CONFLICT",
    };
  }

  if (isDefaultDomain(domain)) {
    if (domain === env.NEXT_PUBLIC_APP_DOMAIN) {
      if (DEFAULT_REDIRECTS[keyword as keyof typeof DEFAULT_REDIRECTS]) {
        return {
          error: "Duplicate key: This short link already exists.",
          code: "CONFLICT",
        };
      }
    }
  }
  return {
    error: null,
  };
}
