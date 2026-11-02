"use client";

import { categoryName, formatPrice, type Product } from "@ecomerse/api";
import { Alert, Button, buttonClass, cx, EmptyState, Input, Loading, Pagination, Select } from "@ecomerse/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { api, errorMessage } from "@/lib/api";

const PAGE_SIZE = 20;

export function ProductsView() {
  const params = useSearchParams();
  const router = useRouter();
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: categories } = useSWR("categories", () => api.categories.list());
  const query = { search: search || undefined, category: category || undefined, sort: "newest" as const, page, limit: PAGE_SIZE };
  const { data, error, mutate } = useSWR(["admin-products", query], () => api.products.list(query), {
    keepPreviousData: true,
  });

  const update = (changes: Record<string, string | number>) => {
    const next = new URLSearchParams(params.toString());
    if (!("page" in changes)) next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value === "") next.delete(key);
      else next.set(key, String(value));
    }
    router.push(`/products?${next}`);
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update({ search: String(new FormData(event.currentTarget).get("search")).trim() });
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? Carts holding it will drop the item.`)) return;
    setDeleting(product._id);
    setActionError(null);
    try {
      await api.products.remove(product._id);
      await mutate();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={data ? `${data.total} products` : undefined}
        actions={<Link href="/products/new" className={buttonClass()}>New product</Link>}
      />

      <form key={params.toString()} onSubmit={onSearch} className="mb-4 flex flex-wrap gap-3">
        <Input name="search" type="search" placeholder="Search by name or category" defaultValue={search} className="max-w-xs" maxLength={100} />
        <Button type="submit" variant="secondary">Search</Button>
        <Select aria-label="Category" value={category} onChange={(e) => update({ category: e.target.value })} className="w-auto">
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </Select>
      </form>

      {actionError && <div className="mb-4"><Alert>{actionError}</Alert></div>}

      {error ? (
        <Alert>{errorMessage(error)}</Alert>
      ) : !data ? (
        <Loading label="Loading products…" />
      ) : data.items.length === 0 ? (
        <EmptyState title="No products found">
          {search || category ? "Try clearing the filters." : <Link href="/products/new" className="font-medium text-indigo-600">Add your first product</Link>}
        </EmptyState>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {data.items.map((product) => (
                  <tr key={product._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/products/${product._id}`} className="font-medium hover:text-indigo-700">{product.name}</Link>
                      {product.description && <p className="max-w-md truncate text-xs text-zinc-500">{product.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{categoryName(product) ?? <span className="text-red-600">Missing</span>}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPrice(product.price)}</td>
                    <td className={cx("px-4 py-3 text-right tabular-nums", product.stock < 1 ? "text-red-600" : product.stock <= 5 && "text-amber-700")}>
                      {product.stock}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/products/${product._id}`} className={buttonClass("ghost", "sm")}>Edit</Link>
                      <Button variant="ghost" size="sm" className="text-red-600" loading={deleting === product._id} onClick={() => remove(product)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => update({ page: p })} />
        </>
      )}
    </>
  );
}
