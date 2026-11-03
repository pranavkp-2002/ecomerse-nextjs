import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { Hero } from "@/components/shop/hero";
import { ProductBrowser } from "@/components/shop/product-browser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<Loading />}>
        <ProductBrowser />
      </Suspense>
    </>
  );
}
