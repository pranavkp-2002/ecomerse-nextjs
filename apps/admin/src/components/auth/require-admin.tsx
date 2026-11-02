"use client";

import { Loading } from "@ecomerse/ui";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { session } from "@/lib/api";
import { useHydrated, useSession } from "@/lib/session";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const current = useSession();
  const hydrated = useHydrated();
  const router = useRouter();
  const isAdmin = current?.user.role === "admin";

  useEffect(() => {
    if (!hydrated || isAdmin) return;
    if (current) session.clear();
    const here = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(here)}${current ? "&reason=forbidden" : ""}`);
  }, [hydrated, isAdmin, current, router]);

  if (!hydrated || !isAdmin) return <Loading />;
  return children;
}
