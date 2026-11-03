"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useSWRConfig } from "swr";
import { session } from "./api";

const noop = () => () => {};

/** Current session; null on the server and during hydration. */
export const useSession = () => useSyncExternalStore(session.subscribe, session.get, () => null);

/** False until the client has hydrated, so guards don't redirect before localStorage is read. */
export const useHydrated = () =>
  useSyncExternalStore(noop, () => true, () => false);

/** Log out locally, drop every cached response so the next user starts clean, then go to `to`. */
export function useSignOut() {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  return (to = "/") => {
    session.clear();
    mutate(() => true, undefined, { revalidate: false });
    router.replace(to);
  };
}
