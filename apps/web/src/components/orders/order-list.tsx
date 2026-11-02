"use client";

import { formatDate, formatPrice } from "@ecomerse/api";
import { Alert, EmptyState, Loading, Pagination, StatusBadge } from "@ecomerse/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { useSession } from "@/lib/session";

export function OrderList() {
  const page = Math.max(1, Number(useSearchParams().get("page")) || 1);
  const router = useRouter();
  const current = useSession();
  const { data, error } = useSWR(current && ["orders", current.user.id, page], () => api.orders.mine({ page, limit: 10 }), {
    keepPreviousData: true,
  });

  if (error) return <Alert>{errorMessage(error)}</Alert>;
  if (!data) return <Loading label="Loading orders…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Your orders</h1>
      {data.items.length === 0 ? (
        <EmptyState title="No orders yet">
          <Link href="/" className="font-medium text-indigo-600">Start shopping</Link>
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {data.items.map((order) => (
              <li key={order._id}>
                <Link href={`/orders/${order._id}`} className="flex flex-wrap items-center gap-4 p-4 hover:bg-zinc-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-zinc-500">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-zinc-600">
                      {formatDate(order.createdAt)} · {order.items.reduce((n, item) => n + item.quantity, 0)} items
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                  <span className="w-28 text-right font-semibold">{formatPrice(order.totalAmount)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => router.push(`/orders?page=${p}`)} />
        </>
      )}
    </div>
  );
}
