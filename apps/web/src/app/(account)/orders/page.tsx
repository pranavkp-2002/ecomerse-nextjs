import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton, OrderList } from "@/components/orders/order-list";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "My orders" };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<ListSkeleton />}>
        <OrderList />
      </Suspense>
    </RequireAuth>
  );
}
