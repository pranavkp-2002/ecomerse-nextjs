"use client";

import { cx } from "@ecomerse/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/lib/session";
import { LogoutIcon, PackageIcon, UserIcon } from "../icons";

const LINKS = [
  { href: "/account", label: "Profile", Icon: UserIcon },
  { href: "/orders", label: "My orders", Icon: PackageIcon },
];

// Mobile: full-width tabs under the header. Desktop: a vertical list beside the content.
const linkClass = cx(
  "flex min-h-11 flex-1 items-center justify-center gap-2.5 border-b-2 border-transparent px-3 text-[15px] font-semibold text-ink-muted hover:text-ink",
  "md:flex-none md:justify-start md:rounded-lg md:border-0 md:font-medium md:text-ink md:hover:bg-surface-subtle",
);
const activeClass = "border-primary text-primary md:bg-primary-soft md:font-semibold md:text-primary md:hover:bg-primary-soft";

/** Without `pathname` (the static shell), no tab is marked active. */
export function AccountNav({ pathname }: { pathname?: string }) {
  const signOut = useSignOut();
  return (
    <nav
      aria-label="Account"
      className="-mx-4 flex border-b border-line bg-surface px-4 md:mx-0 md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-0 md:bg-transparent md:px-0"
    >
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname !== undefined && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cx(linkClass, active && activeClass)}>
            <Icon size={20} className="hidden md:block" />
            {label}
          </Link>
        );
      })}
      {/* On mobile, Log out sits at the bottom of the profile page instead */}
      <button type="button" onClick={() => signOut("/")} className={cx(linkClass, "hidden md:flex")}>
        <LogoutIcon size={20} />
        Log out
      </button>
    </nav>
  );
}

export function LiveAccountNav() {
  return <AccountNav pathname={usePathname()} />;
}
