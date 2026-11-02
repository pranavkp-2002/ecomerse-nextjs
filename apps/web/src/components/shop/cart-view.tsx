"use client";

import { formatPrice, type CartLine } from "@ecomerse/api";
import { Alert, Button, buttonClass, EmptyState, Input, Loading } from "@ecomerse/ui";
import Link from "next/link";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useCart } from "@/lib/cart";

export function CartView() {
  const { data: cart, error, mutate } = useCart();
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) return <Alert>{errorMessage(error)}</Alert>;
  if (!cart) return <Loading label="Loading cart…" />;

  const run = async (action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setActionError(errorMessage(err));
      return false;
    } finally {
      await mutate();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
      {actionError && <Alert>{actionError}</Alert>}

      {cart.items.length === 0 ? (
        <EmptyState title="Your cart is empty">
          <Link href="/" className="font-medium text-indigo-600">Continue shopping</Link>
        </EmptyState>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {cart.items.map((line) => (
              <CartRow
                key={line.product._id}
                line={line}
                onQuantity={(quantity) => run(() => api.cart.update(line.product._id, quantity))}
                onRemove={() => run(() => api.cart.remove(line.product._id))}
              />
            ))}
          </ul>
          <aside className="h-fit space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Items</span>
              <span>{cart.qtyTotal}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subTotal)}</span>
            </div>
            <Link href="/checkout" className={`${buttonClass()} w-full`}>
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (quantity: number) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}) {
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    const next = Math.floor(Number(quantity));
    if (!Number.isFinite(next) || next < 1 || next === line.quantity) {
      setQuantity(String(line.quantity));
      return;
    }
    setBusy(true);
    // Rejected (e.g. exceeds stock): show the quantity that's actually in the cart
    if (!(await onQuantity(next))) setQuantity(String(line.quantity));
    setBusy(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <div className="flex size-14 items-center justify-center rounded-md bg-zinc-100 text-lg font-semibold text-zinc-400">
        {line.product.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/products/${line.product._id}`} className="font-medium hover:text-indigo-700">
          {line.product.name}
        </Link>
        <p className="text-sm text-zinc-500">{formatPrice(line.product.price)} each</p>
      </div>
      <Input
        type="number"
        min={1}
        aria-label={`Quantity of ${line.product.name}`}
        value={quantity}
        disabled={busy}
        onChange={(e) => setQuantity(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="w-20"
      />
      <span className="w-24 text-right font-medium">{formatPrice(line.subtotal)}</span>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onRemove();
          setBusy(false);
        }}
      >
        Remove
      </Button>
    </li>
  );
}
