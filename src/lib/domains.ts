import { DEFAULT_DOMAINS } from "@/constants/main";

export const isDefaultDomain = (domain: string) => {
  return DEFAULT_DOMAINS.some((d) => d.slug === domain);
};
