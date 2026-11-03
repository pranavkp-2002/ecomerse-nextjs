"use client";

import { ApiError, categoryId, formatPrice, type Product } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import {
  AlertIcon,
  CartIcon,
  ChevronRightIcon,
  ImageIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  TruckIcon,
} from "../icons";
import { ProductCard } from "./product-card";
import { ToastView, useToast } from "./toast";

const RELATED_COUNT = 4;

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const primaryBtn = cx(btn, "border-transparent bg-primary text-white hover:bg-primary-hover");
const secondaryBtn = cx(btn, "border-line-strong bg-surface text-ink hover:bg-surface-subtle");
const stepClass =
  "flex h-[42px] w-11 items-center justify-center rounded-lg text-ink hover:not-disabled:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45";

export function ProductDetail({ id }: { id: string }) {
  const { data: product, error, mutate } = useSWR(["product", id], () => api.products.get(id));
  // The detail endpoint returns a bare category id, so resolve its name from the list
  const { data: categories } = useSWR("categories", () => api.categories.list());
  const catId = product && categoryId(product);
  const { data: related } = useSWR(catId ? ["related", catId] : null, () =>
    api.products.list({ category: catId, limit: RELATED_COUNT + 1 }),
  );
  const { mutate: refreshCart } = useCart();
  const current = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, showToast, dismissToast] = useToast();

  if (error) {
    // 400 is an id that isn't a valid ObjectId
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
          {missing ? <PackageIcon size={28} /> : <AlertIcon size={28} className="text-danger" />}
        </span>
        <h1 className="text-[17px] leading-6 font-semibold">
          {missing ? "We couldn't find this product" : "Something went wrong"}
        </h1>
        <p className="text-ink-muted">
          {missing ? "It may have been removed or the link is wrong." : errorMessage(error)}
        </p>
        {missing ? (
          <Link href="/" className={primaryBtn}>Continue shopping</Link>
        ) : (
          <button type="button" onClick={() => mutate()} className={secondaryBtn}>Retry</button>
        )}
      </div>
    );
  }
  if (!product) return <ProductDetailSkeleton />;

  const category = categories?.find((c) => c._id === catId);
  const categoryHref = `/?category=${catId}`;
  const others = related?.items.filter((p) => p._id !== product._id).slice(0, RELATED_COUNT) ?? [];

  const addToCart = async (item: Product, quantity: number) => {
    if (!current) {
      router.push(`/login?reason=cart&next=${encodeURIComponent(pathname)}`);
      return;
    }
    try {
      await api.cart.add(item._id, quantity);
      await refreshCart();
      showToast({ tone: "success", title: "Added to cart", text: `${quantity} × ${item.name}` });
    } catch (err) {
      showToast({ tone: "error", text: errorMessage(err) });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 overflow-hidden text-[13px] leading-[18px] whitespace-nowrap">
          <li><Link href="/" className="font-medium text-primary hover:underline">Home</Link></li>
          {category && (
            <>
              <li aria-hidden className="flex text-ink-muted"><ChevronRightIcon size={14} /></li>
              <li><Link href={categoryHref} className="font-medium text-primary hover:underline">{category.name}</Link></li>
            </>
          )}
          <li aria-hidden className="flex text-ink-muted"><ChevronRightIcon size={14} /></li>
          <li aria-current="page" className="truncate text-ink-muted">{product.name}</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
        <Gallery product={product} />

        <section aria-label="Product information" className="flex max-w-[520px] flex-[1_1_400px] flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            {category && (
              <Link href={categoryHref} className="text-[13px] font-semibold text-primary hover:underline">
                {category.name}
              </Link>
            )}
            <h1 className="text-2xl leading-8 font-bold tracking-[-0.01em] md:text-[30px] md:leading-[38px]">{product.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[30px] leading-9 font-extrabold tabular-nums">{formatPrice(product.price)}</p>
            <StockBadge stock={product.stock} />
          </div>

          <hr className="border-line" />

          {/* key resets the chosen quantity when navigating to a related product */}
          <AddToCart key={product._id} stock={product.stock} onAdd={(quantity) => addToCart(product, quantity)} />

          <div className="flex flex-col gap-2.5 rounded-xl bg-surface-subtle p-4 text-[13px] leading-[18px]">
            <p className="flex items-center gap-2.5"><TruckIcon size={20} /> Shipping calculated at checkout</p>
            <p className="flex items-center gap-2.5"><PackageIcon size={20} /> Cash on delivery available</p>
          </div>

          {product.description && (
            <div className="flex flex-col gap-2">
              <h2 className="text-[17px] leading-6 font-semibold">Description</h2>
              <p className="text-[17px] leading-[26px] whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </section>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="more" className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="more" className="text-[22px] leading-[30px] font-bold">More from this category</h2>
            <Link href={categoryHref} className="text-[15px] font-semibold text-primary hover:text-primary-hover hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {others.map((p) => (
              <ProductCard key={p._id} product={p} onAdd={(item) => addToCart(item, 1)} />
            ))}
          </div>
        </section>
      )}

      <ToastView toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

/** 0 → Out of stock · 1–5 → Only N left · more → In stock */
function StockBadge({ stock }: { stock: number }) {
  const [tone, label] =
    stock < 1
      ? ["bg-danger-soft text-danger", "Out of stock"]
      : stock <= 5
        ? ["bg-warning-soft text-warning", `Only ${stock} left`]
        : ["bg-success-soft text-success", "In stock"];
  return (
    <span className={cx("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-semibold tracking-[0.02em] whitespace-nowrap", tone)}>
      {label}
    </span>
  );
}

function AddToCart({ stock, onAdd }: { stock: number; onAdd: (quantity: number) => Promise<void> }) {
  const [chosen, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const out = stock < 1;
  // Stock can drop below the chosen quantity when SWR revalidates
  const quantity = Math.max(1, Math.min(chosen, stock));

  const add = async () => {
    setAdding(true);
    try {
      await onAdd(quantity);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <p id="qty-label" className="text-sm leading-5 font-semibold">Quantity</p>
        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-labelledby="qty-label"
            className="inline-flex h-11 items-center rounded-lg border border-line-strong bg-surface"
          >
            <button type="button" aria-label="Decrease quantity" disabled={out || quantity <= 1} onClick={() => setQuantity(quantity - 1)} className={stepClass}>
              <MinusIcon size={18} />
            </button>
            <span aria-live="polite" className="min-w-9 text-center text-[15px] font-semibold tabular-nums">
              {quantity}
            </span>
            <button type="button" aria-label="Increase quantity" disabled={out || quantity >= stock} onClick={() => setQuantity(quantity + 1)} className={stepClass}>
              <PlusIcon size={18} />
            </button>
          </div>
          {!out && quantity >= stock && <p className="text-[13px] leading-[18px] text-ink-muted">Maximum available</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={add}
          disabled={out || adding}
          aria-busy={adding}
          className={cx(primaryBtn, "min-h-[52px] flex-[1_1_240px] text-base")}
        >
          {adding ? <Spinner className="size-[18px]" /> : <CartIcon size={20} />}
          Add to cart
        </button>
        <Link href="/cart" className={cx(secondaryBtn, "min-h-[52px]")}>View cart</Link>
      </div>
      {out && <p className="-mt-2 text-[13px] leading-[18px] text-ink-muted">This product is out of stock right now.</p>}
    </>
  );
}

function Gallery({ product }: { product: Product }) {
  const images = product.images ?? [];
  const [selected, setSelected] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const active = Math.min(selected, count - 1);
  const image = images[active];

  // Full-bleed on mobile, rounded beside the thumbnails from md up
  const frame = "relative -mx-4 aspect-square bg-surface-subtle md:mx-0 md:flex-1 md:overflow-hidden md:rounded-xl";

  if (!image) {
    return (
      <section aria-label="Product images" className="min-w-0 flex-[1_1_520px]">
        <div className={cx(frame, "flex flex-col items-center justify-center gap-2 text-[13px] text-ink-muted")}>
          <ImageIcon size={48} />
          <span>No image</span>
        </div>
      </section>
    );
  }

  const go = (i: number) => setSelected((i + count) % count);
  const picker = (className: string, render: (selected: boolean, url: string) => React.ReactNode) =>
    images.map((img, i) => (
      <button
        key={img._id}
        type="button"
        aria-label={`Show image ${i + 1} of ${count}`}
        aria-pressed={i === active}
        onClick={() => setSelected(i)}
        className={className}
      >
        {render(i === active, img.url)}
      </button>
    ));

  return (
    <section aria-label="Product images" className="flex min-w-0 flex-[1_1_520px] flex-col gap-3 md:flex-row md:gap-4">
      {count > 1 && (
        <div className="hidden flex-col gap-3 md:flex">
          {picker("relative size-20 overflow-hidden rounded-lg bg-surface-subtle", (on, url) => (
            <>
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <span className={cx("absolute inset-0 rounded-lg", on ? "border-2 border-primary" : "border border-line")} />
            </>
          ))}
        </div>
      )}

      <div
        className={cx(frame, "touch-pan-y overflow-hidden")}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <Image
          src={image.url}
          alt={count > 1 ? `${product.name}, image ${active + 1} of ${count}` : product.name}
          fill
          priority
          sizes="(min-width: 1024px) 640px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        {count > 1 && (
          <span className="absolute right-3 bottom-3 rounded-full bg-surface px-2 py-1 text-xs font-semibold tabular-nums md:hidden">
            {active + 1} / {count}
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center md:hidden">
          {picker("flex size-7 items-center justify-center", (on) => (
            <span className={cx("h-2 rounded-full transition-[width] duration-150 ease-out", on ? "w-5 bg-ink" : "w-2 bg-line-strong")} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="flex flex-col gap-6">
      <div className="h-3.5 w-[260px] max-w-full rounded-md bg-skeleton" />
      <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
        <div className="flex min-w-0 flex-[1_1_520px] gap-4">
          <div className="hidden flex-col gap-3 md:flex">
            {[0, 1, 2, 3].map((i) => <div key={i} className="size-20 rounded-lg bg-skeleton" />)}
          </div>
          <div className="-mx-4 aspect-square flex-1 bg-skeleton md:mx-0 md:rounded-xl" />
        </div>
        <div className="flex max-w-[520px] flex-[1_1_400px] flex-col gap-5">
          <div className="h-3.5 w-[30%] rounded-md bg-skeleton" />
          <div className="h-8 w-[85%] rounded-md bg-skeleton" />
          <div className="h-9 w-2/5 rounded-md bg-skeleton" />
          <div className="mt-4 h-[52px] rounded-lg bg-skeleton" />
          <div className="h-[120px] rounded-md bg-skeleton" />
        </div>
      </div>
    </div>
  );
}
