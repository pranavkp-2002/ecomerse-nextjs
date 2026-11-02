"use client";

import { Loading } from "@ecomerse/ui";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useHydrated, useSession } from "@/lib/session";

export function RequireAuth({ children }: { children: ReactNode }) {
  const current = useSession();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !current) {
      // Read the URL here rather than via usePathname, which would make every guarded route block on it
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [hydrated, current, router]);

  if (!hydrated || !current) return <Loading />;
  return children;
}
