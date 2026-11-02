import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { EditProduct } from "@/components/products/product-form";

export default function EditProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ id }) => (
        <EditProduct id={id} />
      ))}
    </Suspense>
  );
}
