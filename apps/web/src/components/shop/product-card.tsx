"use client";

import { categoryName, coverImage, formatPrice, type Product } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { CartIcon, ImageIcon, MinusIcon, PlusIcon } from "../icons";

const stepClass =
  "flex h-[42px] w-11 items-center justify-center rounded-lg text-ink hover:not-disabled:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45";

export function ProductCard({
  product,
  onAdd,
  onQuantity,
}: {
  product: Product;
  onAdd: (product: Product) => Promise<void>;
  /** Sets the in-cart quantity; 0 removes the line. */
  onQuantity: (product: Product, quantity: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const { data: cart } = useCart();
  const inCart = cart?.items.find((line) => line.product._id === product._id)?.quantity ?? 0;
  const category = categoryName(product);
  const cover = coverImage(product);
  const out = product.stock < 1;
  const href = `/products/${product._id}`;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
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
        {inCart > 0 ? (
          <div
            role="group"
            aria-label={`Quantity of ${product.name} in cart`}
            className="mt-auto flex h-11 w-full items-center justify-between rounded-lg border border-line-strong bg-surface"
          >
            <button
              type="button"
              aria-label={inCart === 1 ? "Remove from cart" : "Decrease quantity"}
              disabled={busy}
              onClick={() => run(() => onQuantity(product, inCart - 1))}
              className={stepClass}
            >
              <MinusIcon size={18} />
            </button>
            <span aria-live="polite" className="flex min-w-9 justify-center text-[15px] font-semibold tabular-nums">
              {busy ? <Spinner className="size-4" /> : inCart}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={busy || inCart >= product.stock}
              onClick={() => run(() => onQuantity(product, inCart + 1))}
              className={stepClass}
            >
              <PlusIcon size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => run(() => onAdd(product))}
            disabled={out || busy}
            className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:not-disabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? <Spinner className="size-4" /> : <CartIcon size={18} className="hidden lg:inline" />}
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
