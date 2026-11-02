"use client";

import { formatPrice } from "@ecomerse/api";
import { Alert, EmptyState, Loading } from "@ecomerse/ui";
import Link from "next/link";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { OrdersTable } from "./orders/orders-table";
import { PageHeader } from "./page-header";

function Stat({ label, value, href }: { label: string; value?: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-indigo-300">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value ?? "—"}</p>
    </Link>
  );
}

export function Dashboard() {
  // limit=1: only the totals are needed from the paginated endpoints
  const products = useSWR(["admin-products-total"], () => api.products.list({ limit: 1 }));
  const categories = useSWR("categories", () => api.categories.list());
  const recent = useSWR(["admin-orders", "recent"], () => api.orders.all({ page: 1, limit: 8 }));

  const error = products.error ?? categories.error ?? recent.error;
  const pending = recent.data?.items.filter((order) => order.status === "pending").length;
  const recentRevenue = recent.data?.items
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <>
      <PageHeader title="Dashboard" />
      {error && <div className="mb-6"><Alert>{errorMessage(error)}</Alert></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Products" value={products.data?.total} href="/products" />
        <Stat label="Categories" value={categories.data?.length} href="/categories" />
        <Stat label="Orders" value={recent.data?.total} href="/orders" />
        <Stat
          label={`Revenue, last ${recent.data?.items.length ?? 0} orders`}
          value={recentRevenue === undefined ? undefined : formatPrice(recentRevenue)}
          href="/orders"
        />
      </div>

      <div className="mb-3 mt-10 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">
          Recent orders
          {!!pending && <span className="ml-2 text-sm font-normal text-amber-700">{pending} pending</span>}
        </h2>
        <Link href="/orders" className="text-sm font-medium text-indigo-600">View all</Link>
      </div>
      {!recent.data ? (
        recent.error ? null : <Loading />
      ) : recent.data.items.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <OrdersTable orders={recent.data.items} />
      )}
    </>
  );
}
