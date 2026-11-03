"use client";

import { ApiError, coverImage, formatPrice, type CartLine } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { AlertIcon, CartIcon, ChevronLeftIcon, ImageIcon, MinusIcon, PlusIcon, TrashIcon } from "../icons";

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const primaryBtn = cx(btn, "border-transparent bg-primary text-white hover:bg-primary-hover");
const secondaryBtn = cx(btn, "border-line-strong bg-surface text-ink hover:bg-surface-subtle");
const iconBtn =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:not-disabled:bg-surface-subtle hover:not-disabled:text-ink disabled:cursor-not-allowed disabled:opacity-45";
const stepClass =
  "flex h-[42px] w-11 items-center justify-center rounded-lg text-ink hover:not-disabled:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45";

const countText = (n: number) => (n === 1 ? "1 item" : `${n} items`);

export function CartView() {
  const { data: cart, error, mutate, isValidating } = useCart();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  // Lines whose product the store has deleted, reported by each CartRow
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});

  const run = async (productId: string, action: () => Promise<void>) => {
    setBusy((b) => ({ ...b, [productId]: true }));
    setLineErrors((e) => ({ ...e, [productId]: "" }));
    try {
      await action();
    } catch (err) {
      // e.g. the API's "Only N available" when the quantity exceeds stock
      setLineErrors((e) => ({ ...e, [productId]: errorMessage(err) }));
    } finally {
      // Also refreshes the header badge, which reads the same SWR key
      await mutate();
      setBusy((b) => ({ ...b, [productId]: false }));
    }
  };

  const items = cart?.items ?? [];
  const anyBusy = Object.values(busy).some(Boolean);
  const hasUnavailable = items.some((line) => unavailable[line.product._id]);

  return (
    <div className="flex flex-col gap-4 max-md:-mt-3 max-md:pb-40 md:gap-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.01em] md:text-[30px] md:leading-[38px]">Cart</h1>
        {items.length > 0 && <p className="text-ink-muted tabular-nums">{countText(cart!.qtyTotal)}</p>}
      </div>

      {error && !cart ? (
        <StateBox icon={<AlertIcon size={28} className="text-danger" />} title="Something went wrong" role="alert">
          <p className="text-ink-muted">We couldn&apos;t load your cart right now.</p>
          <button type="button" onClick={() => mutate()} disabled={isValidating} className={cx(secondaryBtn, "mt-2")}>
            Retry
          </button>
        </StateBox>
      ) : !cart ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <StateBox icon={<CartIcon size={32} />} title="Your cart is empty">
          <p className="text-ink-muted">Browse the shop and add something you like.</p>
          <Link href="/" className={cx(primaryBtn, "mt-2")}>Start shopping</Link>
        </StateBox>
      ) : (
        <div className="flex flex-wrap items-start gap-8">
          <section aria-label="Items in your cart" className="flex min-w-0 flex-[999_1_560px] flex-col">
            <div
              aria-hidden
              className="hidden grid-cols-[88px_1fr_132px_110px_44px] gap-4 border-b border-line pb-3 text-[13px] text-ink-muted md:grid"
            >
              <span className="col-span-2">Product</span>
              <span>Quantity</span>
              <span className="text-right">Subtotal</span>
            </div>
            <ul>
              {items.map((line) => (
                <CartRow
                  key={line.product._id}
                  line={line}
                  busy={!!busy[line.product._id]}
                  error={lineErrors[line.product._id]}
                  onUnavailable={(gone) =>
                    setUnavailable((u) => (u[line.product._id] === gone ? u : { ...u, [line.product._id]: gone }))
                  }
                  onQuantity={(quantity) => run(line.product._id, () => api.cart.update(line.product._id, quantity))}
                  onRemove={() => run(line.product._id, () => api.cart.remove(line.product._id))}
                />
              ))}
            </ul>
            <Link
              href="/"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-primary hover:text-primary-hover hover:underline"
            >
              <ChevronLeftIcon size={18} />
              Continue shopping
            </Link>
          </section>

          {/* Mobile: sticky bottom bar. Desktop: sticky card beside the items. */}
          <aside
            aria-labelledby="summary"
            className={cx(
              "fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2.5 border-t border-line bg-surface px-4 pt-3.5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-pop",
              "md:sticky md:top-[88px] md:z-auto md:max-w-[360px] md:flex-[1_1_320px] md:gap-4 md:rounded-xl md:border-0 md:bg-surface-subtle md:p-6 md:shadow-none",
            )}
          >
            <h2 id="summary" className="text-[22px] leading-[30px] font-bold max-md:sr-only">Order summary</h2>
            <div className="hidden flex-col gap-3 text-[15px] md:flex">
              <div className="flex justify-between">
                <span className="text-ink-muted">Items ({cart.qtyTotal})</span>
                <span className="tabular-nums">{formatPrice(cart.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Shipping</span>
                <span className="font-semibold text-success">Free</span>
              </div>
            </div>
            <hr className="hidden border-line md:block" />
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold md:text-[17px]">Total</p>
                <p className="text-[13px] leading-[18px] text-ink-muted md:hidden">
                  {countText(cart.qtyTotal)} · <span className="font-semibold text-success">Free shipping</span>
                </p>
              </div>
              <p className="text-2xl leading-[30px] font-extrabold tabular-nums md:text-[30px] md:leading-9">
                {formatPrice(cart.subTotal)}
              </p>
            </div>
            {hasUnavailable && (
              <p className="text-[13px] leading-[18px] text-warning">Remove unavailable items to continue.</p>
            )}
            <Link
              href="/checkout"
              aria-disabled={anyBusy || hasUnavailable}
              onClick={(e) => {
                if (anyBusy || hasUnavailable) e.preventDefault();
              }}
              className={cx(
                primaryBtn,
                "min-h-12 w-full md:min-h-[52px] md:text-base",
                (anyBusy || hasUnavailable) && "cursor-not-allowed opacity-45",
              )}
            >
              Proceed to checkout
            </Link>
            <p className="hidden text-center text-[13px] leading-[18px] text-ink-muted md:block">Pay with cash on delivery</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartRow({
  line,
  busy,
  error,
  onUnavailable,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  error?: string;
  onUnavailable: (gone: boolean) => void;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { _id: id, name, price } = line.product;
  // The cart API omits stock and images, so read them from the product (shares the detail page's cache)
  const { data: product, error: productError } = useSWR(["product", id], () => api.products.get(id));
  // 404 means the store deleted the product; tell CartView so it can block checkout
  const gone = productError instanceof ApiError && productError.status === 404;
  useEffect(() => onUnavailable(gone), [gone, onUnavailable]);
  const image = product ? coverImage(product) : null;
  const atMax = product !== undefined && line.quantity >= product.stock;
  const href = `/products/${id}`;

  const thumb = image ? <Image src={image} alt="" fill sizes="88px" className="object-cover" /> : <ImageIcon size={24} />;
  const thumbClass =
    "relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-subtle text-ink-muted md:size-[88px]";

  return (
    <li className="flex gap-3 border-b border-line py-3.5 md:items-center md:gap-4 md:py-5">
      {gone ? (
        <>
          <span aria-hidden className={thumbClass}>{thumb}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1 self-center">
            <p className="line-clamp-2 text-[15px] leading-[22px] font-semibold opacity-45">{name}</p>
            <p className="flex items-center gap-1 text-[13px] leading-[18px] text-danger">
              <AlertIcon size={16} /> This product is no longer available
            </p>
          </div>
          <button type="button" onClick={onRemove} disabled={busy} className={cx(secondaryBtn, "min-h-9 self-center px-3.5 text-sm")}>
            {busy ? <Spinner className="size-4" /> : <TrashIcon size={16} />}
            Remove
          </button>
        </>
      ) : (
        <>
          <Link href={href} aria-label={name} className={thumbClass}>{thumb}</Link>

          <div className="flex min-w-0 flex-1 flex-col gap-2 md:grid md:grid-cols-[1fr_132px_110px] md:items-center md:gap-x-4 md:gap-y-1">
            <div className="flex items-start justify-between gap-2 md:col-start-1 md:row-start-1">
              <div className="min-w-0">
                <Link href={href} className="line-clamp-2 text-[15px] leading-[22px] font-semibold text-ink hover:underline">
                  {name}
                </Link>
                <p className="text-[13px] leading-[18px] text-ink-muted tabular-nums">{formatPrice(price)} each</p>
              </div>
              <button type="button" aria-label={`Remove ${name}`} onClick={onRemove} disabled={busy} className={cx(iconBtn, "-mt-2 -mr-2.5 md:hidden")}>
                <TrashIcon size={20} />
              </button>
            </div>
            {error && (
              <p role="alert" className="flex items-center gap-1 text-[13px] leading-[18px] text-danger md:col-start-1 md:row-start-2">
                <AlertIcon size={16} /> {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 md:contents">
              {busy ? (
                <div
                  aria-busy="true"
                  className="inline-flex h-11 w-[132px] items-center justify-center gap-2.5 rounded-lg border border-line-strong text-[13px] text-ink-muted md:col-start-2 md:row-span-2 md:row-start-1"
                >
                  <Spinner className="size-[18px]" /> Updating
                </div>
              ) : (
                <div
                  role="group"
                  aria-label={`Quantity for ${name}`}
                  className={cx(
                    "inline-flex h-11 w-fit items-center rounded-lg border bg-surface md:col-start-2 md:row-span-2 md:row-start-1",
                    error ? "border-danger" : "border-line-strong",
                  )}
                >
                  <button type="button" aria-label="Decrease quantity" disabled={line.quantity <= 1} onClick={() => onQuantity(line.quantity - 1)} className={stepClass}>
                    <MinusIcon size={18} />
                  </button>
                  <span className="min-w-9 text-center text-[15px] font-semibold tabular-nums">{line.quantity}</span>
                  <button type="button" aria-label="Increase quantity" disabled={atMax} onClick={() => onQuantity(line.quantity + 1)} className={stepClass}>
                    <PlusIcon size={18} />
                  </button>
                </div>
              )}
              <p
                className={cx(
                  "text-[17px] leading-6 font-bold tabular-nums md:col-start-3 md:row-span-2 md:row-start-1 md:text-right",
                  busy && "opacity-45",
                )}
              >
                {formatPrice(line.subtotal)}
              </p>
            </div>
          </div>

          <button type="button" aria-label={`Remove ${name}`} onClick={onRemove} disabled={busy} className={cx(iconBtn, "hidden md:inline-flex")}>
            <TrashIcon size={20} />
          </button>
        </>
      )}
    </li>
  );
}

function StateBox({
  icon,
  title,
  role,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  role?: "alert";
  children: React.ReactNode;
}) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center md:py-16">
      <span className="flex size-[72px] items-center justify-center rounded-full border border-line bg-surface text-ink-muted">{icon}</span>
      <h2 className="text-[17px] leading-6 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading cart" className="flex flex-wrap items-start gap-8">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line py-5">
            <div className="size-[72px] rounded-md bg-skeleton md:size-[88px]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-3/5 rounded-md bg-skeleton" />
              <div className="h-3 w-1/4 rounded-md bg-skeleton" />
            </div>
            <div className="hidden h-11 w-[132px] rounded-lg bg-skeleton md:block" />
          </div>
        ))}
      </div>
      <div className="hidden max-w-[360px] flex-[1_1_320px] flex-col gap-4 rounded-xl bg-surface-subtle p-6 md:flex">
        <div className="h-6 w-3/5 rounded-md bg-skeleton" />
        <div className="h-4 rounded-md bg-skeleton" />
        <div className="h-[52px] rounded-lg bg-skeleton" />
      </div>
    </div>
  );
}
