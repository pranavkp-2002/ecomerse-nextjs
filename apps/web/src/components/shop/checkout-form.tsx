"use client";

import { coverImage, formatPrice, type Address, type CartLine } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { AlertIcon, CartIcon, ChevronLeftIcon, ImageIcon } from "../icons";

const FIELDS: { name: keyof Address; label: string; autoComplete: string }[] = [
  { name: "street", label: "Street", autoComplete: "street-address" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
];
const EMPTY: Address = { street: "", city: "", state: "", postalCode: "", country: "India" };

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors";
const primaryBtn = cx(btn, "border-transparent bg-primary text-white hover:bg-primary-hover");
const secondaryBtn = cx(btn, "border-line-strong bg-surface text-ink hover:bg-surface-subtle");
const card = "flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 md:gap-5 md:p-6";

type Banner = { kind: "stock" | "empty" | "other"; text: string };

export function CheckoutForm() {
  const { data: cart, error: cartError, mutate, isValidating } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState<Address>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Blocks a double click before React re-renders the disabled button
  const inFlight = useRef(false);

  if (cartError && !cart) {
    return (
      <StateBox icon={<AlertIcon size={28} className="text-danger" />} title="Something went wrong" role="alert">
        <p className="text-ink-muted">We couldn&apos;t load checkout right now.</p>
        <button type="button" onClick={() => mutate()} disabled={isValidating} className={cx(secondaryBtn, "mt-2")}>
          Retry
        </button>
      </StateBox>
    );
  }
  if (!cart) return <CheckoutSkeleton />;
  // After placing, the cart empties before navigation finishes; don't flash the empty state
  if (cart.items.length === 0 && !placing) {
    return (
      <StateBox icon={<CartIcon size={32} />} title="Cart is empty">
        <p className="text-ink-muted">Add something to your cart before checking out.</p>
        <Link href="/" className={cx(primaryBtn, "mt-2")}>Start shopping</Link>
      </StateBox>
    );
  }

  // Required-field errors from the client, then the API's validation errors
  const serverErrors = fieldErrors(error);
  const fieldError = (name: keyof Address) =>
    (touched && !address[name].trim() ? `${FIELDS.find((f) => f.name === name)!.label} is required` : "") ||
    serverErrors[name];
  const banner: Banner | null =
    error == null || Object.keys(serverErrors).length > 0
      ? null
      : /insufficient stock/i.test(errorMessage(error))
        ? { kind: "stock", text: errorMessage(error) }
        : /cart is empty/i.test(errorMessage(error))
          ? { kind: "empty", text: "Cart is empty" }
          : { kind: "other", text: errorMessage(error) };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    setTouched(true);
    setError(null);
    const missing = FIELDS.find(({ name }) => !address[name].trim());
    if (missing) {
      document.getElementById(`field-${missing.name}`)?.focus();
      return;
    }

    inFlight.current = true;
    setPlacing(true);
    try {
      const trimmed = Object.fromEntries(FIELDS.map(({ name }) => [name, address[name].trim()])) as unknown as Address;
      const order = await api.orders.checkout(trimmed);
      router.push(`/checkout/confirmation/${order._id}`);
      // Empties the cart and the header badge; the button stays busy through navigation
      void mutate();
    } catch (err) {
      setError(err);
      inFlight.current = false;
      setPlacing(false);
    }
  };

  const count = cart.qtyTotal === 1 ? "1 item" : `${cart.qtyTotal} items`;

  return (
    <div className="flex flex-col gap-4 max-md:-mt-4 max-md:pb-52 md:gap-6">
      <div className="flex flex-col">
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center gap-1 self-start text-[13px] font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          <ChevronLeftIcon size={16} />
          Back to cart
        </Link>
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.01em] md:text-[30px] md:leading-[38px]">Checkout</h1>
      </div>

      {banner && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-danger-soft px-5 py-4">
          <AlertIcon size={22} className="text-danger" />
          <div className="flex flex-col items-start gap-1.5">
            <p className="text-[15px] leading-[22px] font-semibold">{banner.text}</p>
            {banner.kind === "stock" && (
              <>
                <p className="text-[13px] leading-[18px]">Update the quantity in your cart, then try again.</p>
                <Link href="/cart" className={cx(secondaryBtn, "mt-1.5 min-h-9 px-3.5 text-sm")}>Back to cart</Link>
              </>
            )}
            {banner.kind === "empty" && (
              <>
                <p className="text-[13px] leading-[18px]">Add something to your cart before checking out.</p>
                <Link href="/" className={cx(secondaryBtn, "mt-1.5 min-h-9 px-3.5 text-sm")}>Start shopping</Link>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-wrap items-start gap-x-8 gap-y-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4 md:gap-6">
          <section aria-labelledby="ship" className={card}>
            <StepHead n={1} id="ship">Shipping address</StepHead>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {FIELDS.map(({ name, label, autoComplete }) => {
                const message = fieldError(name);
                return (
                  <div key={name} className={name === "street" ? "md:col-span-2" : undefined}>
                    <label htmlFor={`field-${name}`} className="mb-1.5 block text-sm leading-5 font-semibold">
                      {label}
                    </label>
                    <input
                      id={`field-${name}`}
                      name={name}
                      required
                      autoComplete={autoComplete}
                      inputMode={name === "postalCode" ? "numeric" : undefined}
                      value={address[name]}
                      onChange={(e) => setAddress((a) => ({ ...a, [name]: e.target.value }))}
                      aria-invalid={!!message}
                      aria-describedby={message ? `error-${name}` : undefined}
                      className={cx(
                        "block h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-ink",
                        message ? "border-danger" : "border-line-strong",
                      )}
                    />
                    {message && (
                      <p id={`error-${name}`} className="mt-1.5 flex items-center gap-1 text-[13px] leading-[18px] text-danger">
                        <AlertIcon size={14} />
                        {message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="pay" className={card}>
            <StepHead n={2} id="pay">Payment</StepHead>
            <label className="flex cursor-pointer items-center gap-3.5 rounded-lg border-2 border-primary bg-primary-soft p-4">
              <input type="radio" name="payment" value="cod" defaultChecked className="size-5 accent-primary" />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] leading-[22px] font-semibold">Cash on delivery</span>
                <span className="text-[13px] leading-[18px] text-ink-muted">Pay in cash when your order arrives.</span>
              </span>
            </label>
            <p className="text-[13px] leading-[18px] text-ink-muted">Card and UPI payments are coming soon.</p>
          </section>

          {/* Mobile: compact review above the sticky bar */}
          <section aria-labelledby="review-mobile" className={cx(card, "md:hidden")}>
            <h2 id="review-mobile" className="text-[17px] leading-6 font-semibold">Order review · {count}</h2>
            <ReviewList items={cart.items} thumbs={false} />
            <div className="flex justify-between text-[15px]">
              <span className="text-ink-muted">Shipping</span>
              <span className="font-semibold text-success">Free</span>
            </div>
          </section>
        </div>

        {/* Mobile: sticky bottom bar. Desktop: sticky card beside the form. */}
        <aside
          aria-labelledby="review"
          className={cx(
            "fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2.5 border-t border-line bg-surface px-4 pt-3.5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-pop",
            "md:sticky md:top-[88px] md:z-auto md:max-w-[360px] md:flex-[1_1_320px] md:gap-4 md:rounded-xl md:border-0 md:bg-surface-subtle md:p-6 md:shadow-none",
          )}
        >
          <h2 id="review" className="text-[22px] leading-[30px] font-bold max-md:sr-only">Order review</h2>
          <div className="hidden flex-col gap-4 md:flex">
            <ReviewList items={cart.items} thumbs />
            <hr className="border-line" />
            <div className="flex flex-col gap-2.5 text-[15px]">
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotal ({count})</span>
                <span className="tabular-nums">{formatPrice(cart.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Shipping</span>
                <span className="font-semibold text-success">Free</span>
              </div>
            </div>
            <hr className="border-line" />
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold md:text-[17px]">Total</span>
            <span className="text-2xl leading-[30px] font-extrabold tabular-nums md:text-[30px] md:leading-9">
              {formatPrice(cart.subTotal)}
            </span>
          </div>
          <button
            type="submit"
            disabled={placing}
            aria-busy={placing}
            className={cx(primaryBtn, "min-h-12 w-full disabled:cursor-progress md:min-h-[52px] md:text-base")}
          >
            {placing ? (
              <>
                <Spinner className="size-[18px]" />
                <span className="sr-only">Placing order</span>
              </>
            ) : (
              "Place order"
            )}
          </button>
          <p className="hidden text-center text-[13px] leading-[18px] text-ink-muted md:block">
            By placing your order you agree to pay on delivery.
          </p>
        </aside>
      </form>
    </div>
  );
}

function StepHead({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{n}</span>
      <h2 id={id} className="text-[19px] leading-[26px] font-bold md:text-[22px] md:leading-[30px]">{children}</h2>
    </div>
  );
}

function ReviewList({ items, thumbs }: { items: CartLine[]; thumbs: boolean }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((line) => (
        <li key={line.product._id} className="flex items-center gap-3">
          {thumbs && <Thumb id={line.product._id} />}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="line-clamp-2 text-[13px] font-semibold">{line.product.name}</span>
            <span className="text-[13px] leading-[18px] text-ink-muted">Qty {line.quantity}</span>
          </span>
          <span className="text-[15px] leading-[22px] font-semibold tabular-nums">{formatPrice(line.subtotal)}</span>
        </li>
      ))}
    </ul>
  );
}

/** The cart API omits images, so read them from the product (shares the cart and detail pages' cache). */
function Thumb({ id }: { id: string }) {
  const { data: product } = useSWR(["product", id], () => api.products.get(id));
  const image = product ? coverImage(product) : null;
  return (
    <span aria-hidden className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-subtle text-ink-muted">
      {image ? <Image src={image} alt="" fill sizes="48px" className="object-cover" /> : <ImageIcon size={18} />}
    </span>
  );
}

function StateBox({
  icon,
  title,
  role,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  role?: "alert";
  children: React.ReactNode;
}) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center">
      <span className="flex size-[72px] items-center justify-center rounded-full border border-line bg-surface text-ink-muted">{icon}</span>
      <h1 className="text-[17px] leading-6 font-semibold">{title}</h1>
      {children}
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading checkout" className="flex flex-col gap-6">
      <div className="h-8 w-[180px] rounded-md bg-skeleton" />
      <div className="flex flex-wrap items-start gap-8">
        <div className={cx(card, "min-w-0 flex-[999_1_560px]")}>
          <div className="h-6 w-[200px] rounded-md bg-skeleton" />
          {[0, 1, 2].map((i) => <div key={i} className="h-11 rounded-lg bg-skeleton" />)}
        </div>
        <div className="hidden max-w-[360px] flex-[1_1_320px] flex-col gap-4 rounded-xl bg-surface-subtle p-6 md:flex">
          <div className="h-6 w-3/5 rounded-md bg-skeleton" />
          <div className="h-[120px] rounded-md bg-skeleton" />
          <div className="h-[52px] rounded-lg bg-skeleton" />
        </div>
      </div>
    </div>
  );
}
