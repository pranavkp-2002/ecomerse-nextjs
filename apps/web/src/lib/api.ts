import { ApiError, createApiClient, createSessionStore } from "@ecomerse/api";

// Dev only: print each request as curl in the browser console and,
// via /dev/curl, in the `next dev` terminal
function logCurl(curl: string) {
  console.debug(curl);
  fetch("/dev/curl", { method: "POST", body: curl }).catch(() => {});
}

export const session = createSessionStore("ecomerse.web.session");

// Set when the API rejects the token, so login can say "Session expired" rather than
// treating it like a first visit. Cleared on the next login.
let expired = false;
export const sessionExpired = () => expired;
export const startSession = (next: Parameters<typeof session.set>[0]) => {
  expired = false;
  session.set(next);
};

export const api = createApiClient({
  // Same-origin /api, proxied to NEXT_PUBLIC_API_URL by next.config.ts (avoids CORS)
  baseUrl: "",
  curlBaseUrl: process.env.NEXT_PUBLIC_API_URL,
  getToken: session.getToken,
  // Expired or revoked token: drop it so the UI falls back to logged out
  onUnauthorized: () => {
    expired = true;
    session.clear();
  },
  onRequest: process.env.NODE_ENV === "development" ? logCurl : undefined,
});

export const errorMessage = (error: unknown) =>
  error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong";

export const fieldErrors = (error: unknown) => {
  const map: Record<string, string> = {};
  if (error instanceof ApiError) {
    // Field paths look like "body.shippingAddress.city"; key by the last segment
    for (const { field, message } of error.errors) map[field.split(".").pop()!] ??= message;
  }
  return map;
};

/** Only follow same-site relative redirects from ?next= */
export const safeNext = (next: string | null, fallback = "/") =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
