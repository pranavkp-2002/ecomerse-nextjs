import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { OrderDetail } from "@/components/orders/order-detail";
import { RequireAuth } from "@/components/require-auth";

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <RequireAuth>
      <Suspense fallback={<Loading />}>
        {params.then(({ id }) => (
          <OrderDetail id={id} />
        ))}
      </Suspense>
    </RequireAuth>
  );
}
