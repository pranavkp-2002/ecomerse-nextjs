import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationSkeleton, OrderConfirmation } from "@/components/orders/order-confirmation";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Order placed" };

export default function ConfirmationPage({ params }: PageProps<"/checkout/confirmation/[id]">) {
  return (
    <RequireAuth>
      <Suspense fallback={<ConfirmationSkeleton />}>
        {params.then(({ id }) => (
          <OrderConfirmation id={id} />
        ))}
      </Suspense>
    </RequireAuth>
  );
}
