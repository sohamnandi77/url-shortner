import { KEY_REGEX } from "@/constants/regex";
import { isDefaultDomain } from "@/lib/domains";
import { punyEncode } from "@/lib/vendors";

export function processKey({
  domain,
  keyword,
}: {
  domain?: string;
  keyword?: string;
}) {
  if (!keyword || !domain) {
    return null;
  }

  // Skip if root domain
  if (keyword === "_root") {
    return keyword;
  }

  if (!KEY_REGEX.test(keyword)) {
    return null;
  }
  // if key starts with _, return null (reserved route for Dub internals)
  if (keyword.startsWith("_")) {
    return null;
  }

  // remove all leading and trailing slashes from key
  keyword = keyword.replace(/^\/+|\/+$/g, "");
  /* 
      for default dub domains, remove all special characters + unicode normalization 
        to remove accents / diacritical marks. this is to prevent phishing/typo squatting
      for custom domains this is fine, since only the workspace can set the key
    */
  if (isDefaultDomain(domain)) {
    keyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  // encode the key to ascii
  keyword = punyEncode(keyword);

  return keyword;
}
