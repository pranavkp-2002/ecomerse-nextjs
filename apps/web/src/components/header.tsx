"use client";

import { initials } from "@ecomerse/api";
import { cx } from "@ecomerse/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useSession, useSignOut } from "@/lib/session";
import { CartIcon, ChevronDownIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";

export const iconButtonClass =
  "relative inline-flex size-11 items-center justify-center rounded-lg text-ink hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent";

const menuItemClass = "block w-full px-4 py-2.5 text-left text-[15px] text-ink hover:bg-surface-subtle";

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const Wordmark = () => (
  <Link
    href="/"
    className="flex-[1_0_auto] whitespace-nowrap text-xl font-extrabold tracking-[-0.02em] text-ink lg:flex-none lg:text-[22px]"
  >
    Ecomerse
  </Link>
);

/** Static bar shown while the header's client-only state (path, session, cart) streams in. */
export const HeaderShell = ({ children }: { children?: React.ReactNode }) => (
  <header className="sticky top-0 z-20 border-b border-line bg-surface">
    {children ?? (
      <div className="page-wrap flex h-14 items-center lg:h-16">
        <Wordmark />
      </div>
    )}
  </header>
);

function SearchForm({ id, className }: { id: string; className?: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const current = params.get("search") ?? "";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("search") ?? "").trim().slice(0, 100);
    // Searching from anywhere lands on the shop, keeping category/sort when already there
    const next = new URLSearchParams(pathname === "/" ? params.toString() : "");
    next.delete("page");
    if (value) next.set("search", value);
    else next.delete("search");
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  };

  return (
    // key resets the input when the URL's search changes elsewhere (clear filters, back button)
    <form key={current} role="search" onSubmit={onSubmit} className={cx("relative flex items-center", className)}>
      <label className="sr-only" htmlFor={id}>
        Search products
      </label>
      <SearchIcon size={20} className="pointer-events-none absolute left-3 text-ink-muted" />
      <input
        id={id}
        name="search"
        type="search"
        maxLength={100}
        defaultValue={current}
        placeholder="Search products or categories"
        className="block h-11 w-full rounded-lg border border-line-strong bg-surface-subtle pr-3 pl-[42px] text-[15px] text-ink placeholder:text-ink-muted"
      />
    </form>
  );
}

function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const { data: categories } = useSWR("categories", () => api.categories.list());

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ink hover:bg-surface-subtle"
      >
        Categories <ChevronDownIcon size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-line bg-surface py-2 shadow-pop">
          {[{ _id: "", name: "All products" }, ...(categories ?? [])].map((category) => (
            <Link
              key={category._id}
              role="menuitem"
              href={category._id ? `/?category=${category._id}` : "/"}
              onClick={() => setOpen(false)}
              className={menuItemClass}
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((o) => !o)}
        className={iconButtonClass}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
          {initials(name)}
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-line bg-surface py-2 shadow-pop">
          <p className="truncate px-4 pt-1 pb-2 text-[13px] text-ink-muted">Signed in as {name}</p>
          <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className={menuItemClass}>
            My orders
          </Link>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className={menuItemClass}>
            Account
          </Link>
          <button role="menuitem" type="button" onClick={onLogout} className={menuItemClass}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const current = useSession();
  const { data: cart } = useCart();
  const signOut = useSignOut();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cart?.qtyTotal ?? 0;

  // Close the mobile menu after navigating
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  const logout = () => {
    setMenuOpen(false);
    signOut("/");
  };

  const mobileLinks = [
    { href: "/", label: "Shop" },
    { href: "/cart", label: "Cart" },
    ...(current
      ? [
          { href: "/orders", label: "My orders" },
          { href: "/account", label: "Account" },
        ]
      : [{ href: "/login", label: "Log in" }]),
  ];

  return (
    <HeaderShell>
      <div className="page-wrap flex h-14 items-center gap-2 lg:h-16 lg:gap-6">
        <button
          type="button"
          className={cx(iconButtonClass, "lg:hidden")}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MenuIcon />
        </button>
        <Wordmark />
        <CategoriesMenu />
        <SearchForm id="q" className="hidden max-w-[560px] flex-1 lg:flex" />
        <div className="hidden flex-1 lg:block" />

        <Link href="/cart" className={iconButtonClass} aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
          <CartIcon />
          {count > 0 && (
            <span className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white tabular-nums shadow-[0_0_0_2px_var(--surface)]">
              {count}
            </span>
          )}
        </Link>

        {current ? (
          <AccountMenu name={current.user.name} onLogout={logout} />
        ) : (
          <>
            <Link
              href="/login"
              className="hidden min-h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink hover:bg-surface-subtle lg:inline-flex"
            >
              <UserIcon size={18} />
              Log in
            </Link>
            <Link href="/login" className={cx(iconButtonClass, "lg:hidden")} aria-label="Log in">
              <UserIcon />
            </Link>
          </>
        )}
      </div>

      <div className="page-wrap pb-3 lg:hidden">
        <SearchForm id="qm" />
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-line py-2 lg:hidden">
          <div className="page-wrap flex flex-col">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cx(
                  "rounded-lg px-3 py-3 text-[15px] font-medium",
                  pathname === link.href ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-subtle",
                )}
              >
                {link.label}
              </Link>
            ))}
            {current && (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-3 text-left text-[15px] font-medium text-ink hover:bg-surface-subtle"
              >
                Log out
              </button>
            )}
          </div>
        </nav>
      )}
    </HeaderShell>
  );
}
