"use client";

import { useSyncExternalStore } from "react";
import { session } from "./api";

const noop = () => () => {};

/** Current session; null on the server and during hydration. */
export const useSession = () => useSyncExternalStore(session.subscribe, session.get, () => null);

/** False until the client has hydrated, so guards don't redirect before localStorage is read. */
export const useHydrated = () =>
  useSyncExternalStore(noop, () => true, () => false);
