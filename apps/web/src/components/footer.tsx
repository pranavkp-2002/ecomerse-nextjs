"use client";

import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";

const linkClass = "text-sm leading-7 text-ink-muted hover:text-ink hover:underline";

export function Footer() {
  const { data: categories } = useSWR("categories", () => api.categories.list());

  return (
    <footer className="border-t border-line bg-surface-subtle">
      <div className="page-wrap flex flex-col gap-7 pt-8 pb-6 lg:pt-12">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex flex-[1_1_240px] flex-col gap-2">
            <p className="text-xl font-extrabold tracking-[-0.02em]">Ecomerse</p>
            <p className="max-w-[280px] text-[13px] leading-[18px] text-ink-muted">
              Everyday electronics, clothing and home goods. Cash on delivery available.
            </p>
          </div>
          <nav aria-label="Shop" className="flex flex-[0_1_160px] flex-col">
            <p className="mb-1 text-[15px] font-semibold">Shop</p>
            <Link href="/" className={linkClass}>
              All products
            </Link>
            {categories?.slice(0, 4).map((category) => (
              <Link key={category._id} href={`/?category=${category._id}`} className={linkClass}>
                {category.name}
              </Link>
            ))}
          </nav>
          <nav aria-label="Account" className="flex flex-[0_1_160px] flex-col">
            <p className="mb-1 text-[15px] font-semibold">Account</p>
            <Link href="/orders" className={linkClass}>
              My orders
            </Link>
            <Link href="/account" className={linkClass}>
              Profile
            </Link>
            <Link href="/cart" className={linkClass}>
              Cart
            </Link>
          </nav>
        </div>
        <hr className="h-px border-0 bg-line" />
        <p className="text-[13px] leading-[18px] text-ink-muted">© Ecomerse. All rights reserved.</p>
      </div>
    </footer>
  );
}
