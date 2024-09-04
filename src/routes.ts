/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 */
export const PUBLIC_ROUTES = new Set(["/"]);

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 */
export const AUTH_ROUTES = new Set([
  "/login",
  "/register",
  "/reset",
  "/new-password",
]);

/**
 * An array of routes that are used for the app
 * These routes are only accessible to logged in users
 */
export const APP_ROUTES = new Set([
  "/settings",
  "/integrations",
  "/workspaces",
]);

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 */
export const API_AUTH_PREFIX = "/api";
