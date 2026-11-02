"use client";

import type { ProductQuery, ProductSort } from "@ecomerse/api";
import { Alert, Button, cx, EmptyState, Input, Loading, Pagination, Select } from "@ecomerse/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { ProductCard } from "./product-card";

const SORTS: { value: ProductSort | ""; label: string }[] = [
  { value: "", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const PAGE_SIZE = 12;

export function ProductBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
  const { data, error, isLoading } = useSWR(["products", query], () => api.products.list(query), {
    keepPreviousData: true,
  });

  // Every filter change goes back to page 1
  const update = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    if (!("page" in changes)) next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      search: String(form.get("search") ?? "").trim(),
      minPrice: String(form.get("minPrice") ?? ""),
      maxPrice: String(form.get("maxPrice") ?? ""),
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Categories</h2>
          <ul className="space-y-1 text-sm">
            {[{ _id: "", name: "All products" }, ...(categories ?? [])].map((category) => (
              <li key={category._id}>
                <button
                  onClick={() => update({ category: category._id })}
                  className={cx(
                    "w-full rounded-md px-2 py-1.5 text-left",
                    (query.category ?? "") === category._id
                      ? "bg-indigo-50 font-medium text-indigo-700"
                      : "text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="min-w-0">
        {/* key resets the uncontrolled inputs when the URL changes elsewhere (back button, category click) */}
        <form key={params.toString()} onSubmit={onFilter} className="mb-6 flex flex-wrap items-end gap-3">
          <Input
            name="search"
            type="search"
            placeholder="Search products or categories"
            defaultValue={query.search}
            className="min-w-48 flex-1"
            maxLength={100}
          />
          <Input name="minPrice" type="number" min={0} placeholder="Min ₹" defaultValue={query.minPrice} className="w-24" />
          <Input name="maxPrice" type="number" min={0} placeholder="Max ₹" defaultValue={query.maxPrice} className="w-24" />
          <Button type="submit">Search</Button>
          <Select
            aria-label="Sort"
            value={query.sort ?? ""}
            onChange={(event) => update({ sort: event.target.value })}
            className="w-auto"
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </Select>
        </form>

        {error ? (
          <Alert>{errorMessage(error)}</Alert>
        ) : isLoading || !data ? (
          <Loading label="Loading products…" />
        ) : data.items.length === 0 ? (
          <EmptyState title="No products found">Try a different search or category.</EmptyState>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              {data.total} product{data.total === 1 ? "" : "s"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(page) => update({ page })} />
          </>
        )}
      </section>
    </div>
  );
}
