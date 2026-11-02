import { ApiError, createApiClient, createSessionStore } from "@ecomerse/api";

export const session = createSessionStore("ecomerse.web.session");

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  getToken: session.getToken,
  // Expired or revoked token: drop it so the UI falls back to logged out
  onUnauthorized: session.clear,
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
