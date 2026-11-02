"use client";

import { cx } from "@ecomerse/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { session } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cx(
        "rounded-md px-3 py-2 text-sm font-medium",
        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
      )}
    >
      {children}
    </Link>
  );
};

/** Static bar shown while the header's client-only state (path, session, cart) streams in. */
export const HeaderShell = ({ children }: { children?: React.ReactNode }) => (
  <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
      <Link href="/" className="mr-4 text-lg font-semibold tracking-tight">
        Ecomerse
      </Link>
      {children}
    </div>
  </header>
);

export function Header() {
  const current = useSession();
  const { data: cart } = useCart();
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const logout = () => {
    session.clear();
    // Drop every cached response so the next user starts clean
    mutate(() => true, undefined, { revalidate: false });
    router.push("/");
  };

  return (
    <HeaderShell>
      <nav className="flex flex-1 items-center gap-1">
        <NavLink href="/">Shop</NavLink>
        {current && <NavLink href="/orders">Orders</NavLink>}
      </nav>
      <nav className="flex items-center gap-1">
        <NavLink href="/cart">
          Cart
          {cart && cart.qtyTotal > 0 && (
            <span className="ml-1.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs text-white">
              {cart.qtyTotal}
            </span>
          )}
        </NavLink>
        {current ? (
          <>
            <NavLink href="/account">{current.user.name.split(" ")[0]}</NavLink>
            <button onClick={logout} className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900">
              Log out
            </button>
          </>
        ) : (
          <NavLink href="/login">Log in</NavLink>
        )}
      </nav>
    </HeaderShell>
  );
}
