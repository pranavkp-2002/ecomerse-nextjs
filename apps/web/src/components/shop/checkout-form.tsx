"use client";

import { formatPrice, type Address } from "@ecomerse/api";
import { Alert, Button, EmptyState, Field, Input, Loading } from "@ecomerse/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import { useCart } from "@/lib/cart";

const FIELDS: { name: keyof Address; label: string; autoComplete: string }[] = [
  { name: "street", label: "Street address", autoComplete: "street-address" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
];

export function CheckoutForm() {
  const { data: cart, error: cartError, mutate } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (cartError) return <Alert>{errorMessage(cartError)}</Alert>;
  if (!cart) return <Loading />;
  if (cart.items.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        <Link href="/" className="font-medium text-indigo-600">Continue shopping</Link>
      </EmptyState>
    );
  }

  const errors = fieldErrors(error);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const address = Object.fromEntries(FIELDS.map(({ name }) => [name, String(form.get(name) ?? "").trim()])) as unknown as Address;

    setSubmitting(true);
    setError(null);
    try {
      const order = await api.orders.checkout(address);
      await mutate();
      router.push(`/orders/${order._id}?placed=1`);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Shipping address</h1>
        {error != null && <Alert>{errorMessage(error)}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ name, label, autoComplete }) => (
            <div key={name} className={name === "street" ? "sm:col-span-2" : undefined}>
              <Field label={label} error={errors[name]}>
                <Input name={name} required autoComplete={autoComplete} />
              </Field>
            </div>
          ))}
        </div>
        <Button type="submit" loading={submitting} className="w-full">
          Place order · {formatPrice(cart.subTotal)}
        </Button>
        <p className="text-xs text-zinc-500">Payment is collected on delivery.</p>
      </form>

      <aside className="h-fit space-y-3 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {cart.items.map((line) => (
            <li key={line.product._id} className="flex justify-between gap-4">
              <span className="text-zinc-600">
                {line.quantity} × {line.product.name}
              </span>
              <span>{formatPrice(line.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold">
          <span>Total</span>
          <span>{formatPrice(cart.subTotal)}</span>
        </div>
      </aside>
    </div>
  );
}
