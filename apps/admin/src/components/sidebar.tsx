"use client";

import { cx } from "@ecomerse/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSWRConfig } from "swr";
import { session } from "@/lib/api";
import { useSession } from "@/lib/session";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "Orders" },
];

export const SidebarShell = ({ children }: { children?: ReactNode }) => (
  <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-zinc-900 px-3 py-6 text-zinc-300 max-md:w-44">
    <Link href="/" className="mb-8 px-3 text-lg font-semibold text-white">
      Ecomerse <span className="text-xs font-normal text-zinc-400">admin</span>
    </Link>
    {children}
  </aside>
);

export function Sidebar() {
  const pathname = usePathname();
  const current = useSession();
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const logout = () => {
    session.clear();
    mutate(() => true, undefined, { revalidate: false });
    router.replace("/login");
  };

  return (
    <SidebarShell>
      <nav className="flex-1 space-y-1">
        {LINKS.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "block rounded-md px-3 py-2 text-sm font-medium",
                active ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/60 hover:text-white",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {current && (
        <div className="border-t border-zinc-800 px-3 pt-4 text-sm">
          <p className="truncate font-medium text-white">{current.user.name}</p>
          <p className="truncate text-xs text-zinc-400">{current.user.email}</p>
          <button onClick={logout} className="mt-3 text-zinc-400 hover:text-white">
            Log out
          </button>
        </div>
      )}
    </SidebarShell>
  );
}
