import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <RequireAuth>
      <CartView />
    </RequireAuth>
  );
}
