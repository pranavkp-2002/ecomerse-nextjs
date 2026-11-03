"use client";

import type { Product, ProductQuery, ProductSort } from "@ecomerse/api";
import { cx } from "@ecomerse/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { iconButtonClass } from "../header";
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon, SearchIcon } from "../icons";
import { pageList } from "@/lib/page-list";
import { ProductCard } from "./product-card";
import { ToastView, useToast } from "./toast";

const SORTS: { value: ProductSort | ""; label: string }[] = [
  { value: "", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const PAGE_SIZE = 12;

const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ink hover:bg-surface-subtle";
const inputClass =
  "block h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-ink-muted";

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-center gap-1">
      <button type="button" className={iconButtonClass} aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeftIcon size={20} />
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cx(iconButtonClass, "text-[15px] tabular-nums", p === page && "bg-primary-soft font-bold text-primary")}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className={iconButtonClass} aria-label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRightIcon size={20} />
      </button>
    </nav>
  );
}

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-xl border border-line" aria-hidden>
    <div className="aspect-square bg-skeleton" />
    <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4">
      <div className="h-3 w-2/5 rounded-md bg-skeleton" />
      <div className="h-3.5 w-[90%] rounded-md bg-skeleton" />
      <div className="h-3.5 w-3/5 rounded-md bg-skeleton" />
      <div className="mt-1 h-[18px] w-[35%] rounded-md bg-skeleton" />
      <div className="mt-1.5 h-9 rounded-lg bg-skeleton" />
    </div>
  </div>
);

function StateBox({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">{icon}</span>
      <h2 className="text-[17px] leading-6 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export function ProductBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = useSession();
  const { mutate: refreshCart } = useCart();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, showToast, dismissToast] = useToast();

  const num = (key: string) => {
    const value = params.get(key);
    return value === null || value === "" || Number.isNaN(Number(value)) ? undefined : Number(value);
  };

  const query: ProductQuery = {
    search: params.get("search") || undefined,
    category: params.get("category") || undefined,
    sort: (params.get("sort") as ProductSort) || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    page: num("page") ?? 1,
    limit: PAGE_SIZE,
  };

  const { data: categories } = useSWR("categories", () => api.categories.list());
  const { data, error, isLoading, mutate } = useSWR(["products", query], () => api.products.list(query), {
    keepPreviousData: true,
  });

  const navigate = (next: URLSearchParams) => {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Every filter change goes back to page 1
  const update = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    if (!("page" in changes)) next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    navigate(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (query.sort) next.set("sort", query.sort);
    navigate(next);
  };

  const changePage = (page: number) => {
    update({ page });
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  const onPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({ minPrice: String(form.get("minPrice") ?? ""), maxPrice: String(form.get("maxPrice") ?? "") });
  };

  const addToCart = async (product: Product) => {
    if (!current) {
      const here = params.toString() ? `${pathname}?${params}` : pathname;
      router.push(`/login?reason=cart&next=${encodeURIComponent(here)}`);
      return;
    }
    try {
      await api.cart.add(product._id, 1);
      await refreshCart();
      showToast({ tone: "success", title: "Added to cart", text: product.name });
    } catch (err) {
      showToast({ tone: "error", text: errorMessage(err) });
    }
  };

  const setCartQuantity = async (item: Product, quantity: number) => {
    try {
      if (quantity > 0) await api.cart.update(item._id, quantity);
      else await api.cart.remove(item._id);
    } catch (err) {
      showToast({ tone: "error", text: errorMessage(err) });
    } finally {
      await refreshCart();
    }
  };

  const allCategories = [{ _id: "", name: "All" }, ...(categories ?? [])];
  const activeCategory = query.category ?? "";
  const sortSelect = (className: string, labelled: boolean) => (
    <select
      aria-label={labelled ? undefined : "Sort by"}
      value={query.sort ?? ""}
      onChange={(event) => update({ sort: event.target.value })}
      className={cx(inputClass, "cursor-pointer", className)}
    >
      {SORTS.map((sort) => (
        <option key={sort.value} value={sort.value}>
          {sort.label}
        </option>
      ))}
    </select>
  );

  return (
    <div id="shop" className="page-wrap flex scroll-mt-28 flex-col gap-5 pt-5 pb-12 lg:gap-6 lg:pt-8">
      <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        {allCategories.map((category) => (
          <button
            key={category._id}
            type="button"
            aria-pressed={activeCategory === category._id}
            onClick={() => update({ category: category._id })}
            className={cx(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap lg:min-h-9",
              activeCategory === category._id
                ? "border-primary bg-primary-soft font-semibold text-primary"
                : "border-line-strong bg-surface font-medium text-ink hover:bg-surface-subtle",
            )}
          >
            {category.name}
          </button>
        ))}
      </nav>

      <div className={cx("flex items-start gap-8", filtersOpen && "max-lg:flex-col max-lg:items-stretch")}>
        <aside
          id="filters"
          aria-label="Filters"
          className={cx(
            "flex-col gap-6 rounded-xl bg-surface-subtle p-5 lg:flex lg:w-60 lg:shrink-0",
            filtersOpen ? "flex" : "hidden",
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Filters</h2>
            <button type="button" onClick={clearFilters} className="min-h-9 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-surface">
              Clear filters
            </button>
          </div>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-2 text-[15px] font-semibold">Category</legend>
            {allCategories.map((category) => (
              <label key={category._id} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-[15px]">
                <input
                  type="radio"
                  name="category"
                  checked={activeCategory === category._id}
                  onChange={() => update({ category: category._id })}
                  className="size-[18px] accent-primary"
                />
                {category.name}
              </label>
            ))}
          </fieldset>
          {/* key resets the uncontrolled inputs when the URL changes elsewhere */}
          <form key={`${query.minPrice}-${query.maxPrice}`} onSubmit={onPrice}>
            <fieldset>
              <legend className="mb-2 text-[15px] font-semibold">Price</legend>
              <div className="flex gap-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Min ₹</span>
                  <input name="minPrice" type="number" min={0} inputMode="numeric" placeholder="0" defaultValue={query.minPrice} className={cx(inputClass, "tabular-nums")} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">Max ₹</span>
                  <input name="maxPrice" type="number" min={0} inputMode="numeric" placeholder="Any" defaultValue={query.maxPrice} className={cx(inputClass, "tabular-nums")} />
                </label>
              </div>
              <button type="submit" className={cx(secondaryBtn, "mt-3 min-h-9 w-full px-3.5 text-sm")}>
                Apply
              </button>
            </fieldset>
          </form>
        </aside>

        <section aria-label="Products" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="filters"
              onClick={() => setFiltersOpen((o) => !o)}
              className={cx(secondaryBtn, "px-3.5 text-sm")}
            >
              <FilterIcon size={18} />
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            {sortSelect("text-sm font-semibold", false)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-[15px] text-ink-muted tabular-nums">
              {data && `Showing ${data.items.length} of ${data.total} product${data.total === 1 ? "" : "s"}`}
            </p>
            <label className="hidden items-center gap-2 text-[13px] whitespace-nowrap text-ink-muted lg:flex">
              Sort by
              {sortSelect("w-[220px]", true)}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5" aria-busy={isLoading}>
            {error ? (
              <StateBox icon={<AlertIcon size={28} className="text-danger" />} title="Something went wrong">
                <p className="text-ink-muted">{errorMessage(error)}</p>
                <button type="button" onClick={() => mutate()} className={secondaryBtn}>
                  Retry
                </button>
              </StateBox>
            ) : isLoading || !data ? (
              Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            ) : data.items.length === 0 ? (
              <StateBox icon={<SearchIcon size={28} />} title="No products match your search">
                <p className="text-ink-muted">Try another word or widen the price range.</p>
                <button type="button" onClick={clearFilters} className={secondaryBtn}>
                  Clear filters
                </button>
              </StateBox>
            ) : (
              data.items.map((product) => <ProductCard key={product._id} product={product} onAdd={addToCart} onQuantity={setCartQuantity} />)
            )}
          </div>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={changePage} />}
        </section>
      </div>

      <ToastView toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
