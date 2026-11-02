import type { Metadata } from "next";
import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { ProductsView } from "@/components/products/products-view";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsView />
    </Suspense>
  );
}
