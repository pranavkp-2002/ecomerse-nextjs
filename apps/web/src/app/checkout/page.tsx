import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutForm />
    </RequireAuth>
  );
}
