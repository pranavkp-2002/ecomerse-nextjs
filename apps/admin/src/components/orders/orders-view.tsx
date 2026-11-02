"use client";

import type { Order, OrderStatus } from "@ecomerse/api";
import { Alert, EmptyState, Loading, Pagination } from "@ecomerse/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { api, errorMessage } from "@/lib/api";
import { OrdersTable } from "./orders-table";

const PAGE_SIZE = 20;

export function OrdersView() {
  const page = Math.max(1, Number(useSearchParams().get("page")) || 1);
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, error, mutate } = useSWR(["admin-orders", page], () => api.orders.all({ page, limit: PAGE_SIZE }), {
    keepPreviousData: true,
  });

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setActionError(null);
    try {
      const updated = await api.orders.updateStatus(order._id, status);
      // The PATCH response isn't populated, so keep the customer we already have
      await mutate(
        (current) =>
          current && {
            ...current,
            items: current.items.map((o) => (o._id === order._id ? { ...o, status: updated.status } : o)),
          },
        { revalidate: false },
      );
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description={data ? `${data.total} orders · click an order number for items and address` : undefined}
      />
      {actionError && <div className="mb-4"><Alert>{actionError}</Alert></div>}
      {error ? (
        <Alert>{errorMessage(error)}</Alert>
      ) : !data ? (
        <Loading label="Loading orders…" />
      ) : data.items.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <>
          <OrdersTable orders={data.items} onStatusChange={changeStatus} />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => router.push(`/orders?page=${p}`)} />
        </>
      )}
    </>
  );
}
