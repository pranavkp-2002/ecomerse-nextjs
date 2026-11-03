import type { AuthUser } from "./types";

export interface Session {
  token: string;
  user: AuthUser;
}

type Listener = (session: Session | null) => void;

/**
 * Persists the JWT and logged-in user in localStorage under `key` and notifies
 * subscribers on change (including changes from other tabs). Each app uses its
 * own key so a storefront login never grants the admin panel a session.
 *
 * With `cookie`, the token is mirrored into that cookie so server code (e.g. a
 * Next.js proxy) can see whether the user is signed in.
 */
export function createSessionStore(key: string, options: { cookie?: string } = {}) {
  const listeners = new Set<Listener>();
  let cachedRaw: string | null | undefined;
  let cached: Session | null = null;

  const read = (): Session | null => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      // Storage blocked (private mode, disabled site data): treat as logged out
    }
    // Return a stable object while storage is unchanged (useSyncExternalStore needs this)
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cached = raw ? (JSON.parse(raw) as Session) : null;
      } catch {
        cached = null;
      }
    }
    return cached;
  };

  const write = (session: Session | null) => {
    try {
      if (session) window.localStorage.setItem(key, JSON.stringify(session));
      else window.localStorage.removeItem(key);
    } catch {
      // Ignore: the session just won't survive a reload
    }
    if (options.cookie) {
      const value = session ? `${encodeURIComponent(session.token)}; Max-Age=${60 * 60 * 24 * 30}` : "; Max-Age=0";
      document.cookie = `${options.cookie}=${value}; Path=/; SameSite=Lax`;
    }
    listeners.forEach((listener) => listener(read()));
  };

  return {
    get: () => (typeof window === "undefined" ? null : read()),
    getToken: () => (typeof window === "undefined" ? null : (read()?.token ?? null)),
    set: (session: Session) => write(session),
    clear: () => write(null),
    subscribe(listener: Listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener(read());
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
