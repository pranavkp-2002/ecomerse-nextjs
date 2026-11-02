import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { ProductDetail } from "@/components/shop/product-detail";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ id }) => (
        <ProductDetail id={id} />
      ))}
    </Suspense>
  );
}
