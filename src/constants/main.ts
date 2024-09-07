import { env } from "@/env";

export const APP_HOSTNAMES = new Set([
  `app.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "localhost:3000",
  "localhost",
]);

export const API_HOSTNAMES = new Set([
  `api.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "api.localhost:8888",
]);

export const APP_DOMAIN_ROUTE =
  env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : `https://${env.NEXT_PUBLIC_APP_DOMAIN}`;

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
