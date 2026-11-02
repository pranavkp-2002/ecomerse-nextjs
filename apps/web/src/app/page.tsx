import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { ProductBrowser } from "@/components/shop/product-browser";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductBrowser />
    </Suspense>
  );
}
