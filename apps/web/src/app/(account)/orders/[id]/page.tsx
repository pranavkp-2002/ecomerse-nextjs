import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail, OrderDetailSkeleton } from "@/components/orders/order-detail";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Order detail" };

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <RequireAuth>
      <Suspense fallback={<OrderDetailSkeleton />}>
        {params.then(({ id }) => (
          <OrderDetail id={id} />
        ))}
      </Suspense>
    </RequireAuth>
  );
}
