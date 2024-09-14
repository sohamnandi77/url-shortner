import { env } from "@/env";

export const SHORT_DOMAIN = env.NEXT_PUBLIC_APP_SHORT_DOMAIN ?? "dub.sh";

export const APP_HOSTNAMES = new Set([
  `app.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "localhost:3000",
  "localhost",
]);

export const API_HOSTNAMES = new Set([
  `api.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "api.localhost:3000",
]);

export const APP_DOMAIN_ROUTE =
  env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : `https://${env.NEXT_PUBLIC_APP_DOMAIN}`;

export const API_DOMAIN_ROUTE =
  env.NODE_ENV === "development"
    ? "http://api.localhost:3000"
    : `https://api.${env.NEXT_PUBLIC_APP_DOMAIN}`;

export const DEFAULT_REDIRECTS = {
  home: `${APP_DOMAIN_ROUTE}`,
  signin: `${APP_DOMAIN_ROUTE}/login`,
  login: `${APP_DOMAIN_ROUTE}/login`,
  register: `${APP_DOMAIN_ROUTE}/register`,
  signup: `${APP_DOMAIN_ROUTE}/register`,
  app: `${APP_DOMAIN_ROUTE}`,
  dashboard: `${APP_DOMAIN_ROUTE}`,
  settings: `${APP_DOMAIN_ROUTE}/settings`,
} as const;

export const DEFAULT_DOMAINS = [
  {
    slug: env.NEXT_PUBLIC_APP_DOMAIN,
  },
] as const;

export const PLANS = ["FREE", "PRO"] as const;

export type Plan = (typeof PLANS)[number];

export const USER_ROLES = ["ADMIN", "MEMBER", "GUEST"] as const;

export const UTM_TAGS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
] as const;

export const TOKEN_PREFIX = "lw_";

export const PASSWORD_RESET_TOKEN_EXPIRY = 1 * 60 * 60; // 1 hour

export const FREE_WORKSPACES_LIMIT = 5;

export const MAX_LOGIN_ATTEMPTS = 10;

export const APP_HEADERS = {
  "x-powered-by": "Link with",
};
