import { Suspense } from "react";
import { ProductDetail, ProductDetailSkeleton } from "@/components/shop/product-detail";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      {params.then(({ id }) => (
        <ProductDetail id={id} />
      ))}
    </Suspense>
  );
}
