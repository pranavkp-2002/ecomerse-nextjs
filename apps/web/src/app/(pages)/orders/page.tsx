import type { Metadata } from "next";
import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { OrderList } from "@/components/orders/order-list";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<Loading />}>
        <OrderList />
      </Suspense>
    </RequireAuth>
  );
}
