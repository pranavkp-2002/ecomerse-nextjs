"use client";

import { categoryName, coverImage, formatPrice, type Product } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CartIcon, ImageIcon } from "../icons";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const category = categoryName(product);
  const cover = coverImage(product);
  const out = product.stock < 1;
  const href = `/products/${product._id}`;

  const add = async () => {
    setAdding(true);
    try {
      await onAdd(product);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-card">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className={cx(
          "relative flex aspect-square flex-col items-center justify-center gap-1.5 bg-surface-subtle text-[13px] text-ink-muted",
          out && "opacity-55",
        )}
      >
        {cover ? (
          <Image src={cover} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover" />
        ) : (
          <>
            <ImageIcon size={36} />
            <span>No image</span>
          </>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3 lg:px-4 lg:pt-3.5 lg:pb-4">
        {category && <p className={cx("text-[13px] leading-[18px] text-ink-muted", out && "opacity-55")}>{category}</p>}
        <Link
          href={href}
          className={cx(
            "line-clamp-2 min-h-11 text-[15px] leading-[22px] font-semibold text-ink hover:underline",
            out && "opacity-55",
          )}
        >
          {product.name}
        </Link>
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          <p className={cx("text-[17px] leading-6 font-bold tabular-nums", out && "opacity-55")}>
            {formatPrice(product.price)}
          </p>
          {out ? (
            <span className="inline-flex h-[22px] items-center rounded-md bg-danger-soft px-2 text-xs font-semibold tracking-[0.02em] text-danger">
              Out of stock
            </span>
          ) : product.stock <= 5 ? (
            <span className="inline-flex h-[22px] items-center rounded-md bg-warning-soft px-2 text-xs font-semibold tracking-[0.02em] text-warning">
              Only {product.stock} left
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={add}
          disabled={out || adding}
          className="mt-auto inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 text-sm font-semibold whitespace-nowrap text-ink transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45"
        >
          {adding ? <Spinner className="size-4" /> : <CartIcon size={18} className="hidden lg:inline" />}
          Add to cart
        </button>
      </div>
    </article>
  );
}
