"use client";

import { formatDate, formatPrice, ORDER_STATUSES, type Order, type OrderStatus } from "@ecomerse/api";
import { Select, StatusBadge } from "@ecomerse/ui";
import { Fragment, useState } from "react";

const customer = (order: Order) =>
  typeof order.user === "string" ? { name: "Deleted user", email: order.user } : order.user;

export function OrdersTable({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  /** Omit to render status as a read-only badge. */
  onStatusChange?: (order: Order, status: OrderStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Placed</th>
            <th className="px-4 py-3 text-right font-medium">Items</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {orders.map((order) => {
            const who = customer(order);
            const expanded = open === order._id;
            const address = order.shippingAddress;
            return (
              <Fragment key={order._id}>
                <tr className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpen(expanded ? null : order._id)}
                      aria-expanded={expanded}
                      className="font-mono text-indigo-700 hover:underline"
                    >
                      #{order._id.slice(-8).toUpperCase()}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{who.name}</p>
                    <p className="text-xs text-zinc-500">{who.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{order.items.reduce((n, item) => n + item.quantity, 0)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    {onStatusChange ? (
                      <Select
                        aria-label={`Status of order ${order._id}`}
                        value={order.status}
                        disabled={saving === order._id}
                        onChange={async (event) => {
                          setSaving(order._id);
                          await onStatusChange(order, event.target.value as OrderStatus);
                          setSaving(null);
                        }}
                        className="w-36 py-1.5 capitalize"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <StatusBadge status={order.status} />
                    )}
                  </td>
                </tr>
                {expanded && (
                  <tr className="bg-zinc-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                        <ul className="space-y-1">
                          {order.items.map((item) => (
                            <li key={item._id} className="flex justify-between gap-4">
                              <span>
                                {item.quantity} × {item.name}{" "}
                                <span className="text-zinc-500">@ {formatPrice(item.price)}</span>
                              </span>
                              <span>{formatPrice(item.quantity * item.price)}</span>
                            </li>
                          ))}
                        </ul>
                        <address className="not-italic text-zinc-600">
                          <span className="font-medium text-zinc-900">Ship to</span>
                          <br />
                          {address.street}, {address.city}
                          <br />
                          {address.state} {address.postalCode}, {address.country}
                        </address>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
