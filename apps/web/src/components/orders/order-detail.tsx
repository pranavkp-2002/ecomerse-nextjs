"use client";

import { formatDate, formatPrice } from "@ecomerse/api";
import { Alert, Loading, StatusBadge } from "@ecomerse/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";

export function OrderDetail({ id }: { id: string }) {
  const placed = useSearchParams().get("placed") === "1";
  const { data: order, error } = useSWR(["order", id], () => api.orders.get(id));

  if (error) return <Alert>{errorMessage(error)}</Alert>;
  if (!order) return <Loading />;

  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm text-zinc-500 hover:text-zinc-900">← All orders</Link>
      {placed && <Alert tone="success">Thanks! Your order has been placed.</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Order #{order._id.slice(-8).toUpperCase()}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-zinc-500">Placed {formatDate(order.createdAt)}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-200">
            {order.items.map((item) => (
              <li key={item._id} className="flex justify-between gap-4 p-4 text-sm">
                <Link href={`/products/${item.product}`} className="hover:text-indigo-700">
                  {item.quantity} × {item.name}
                </Link>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-zinc-200 p-4 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Shipping to</h2>
          <address className="not-italic leading-6 text-zinc-600">
            {address.street}
            <br />
            {address.city}, {address.state} {address.postalCode}
            <br />
            {address.country}
          </address>
        </aside>
      </div>
    </div>
  );
}
