"use client";

import useSWR from "swr";
import { api } from "./api";
import { useSession } from "./session";

/** The logged-in user's cart; keyed by user so switching accounts never shows a stale cart. */
export function useCart() {
  const current = useSession();
  return useSWR(current ? ["cart", current.user.id] : null, () => api.cart.get());
}
