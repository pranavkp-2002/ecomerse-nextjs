"use client";

import { ApiError, formatDay, formatPrice, orderNumber } from "@ecomerse/api";
import { cx } from "@ecomerse/ui";
import Link from "next/link";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { AlertIcon, CheckIcon, TruckIcon } from "../icons";
import { StatusPill } from "./status-pill";

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors md:min-w-[200px]";
const primaryBtn = cx(btn, "border-transparent bg-primary text-white hover:bg-primary-hover");
const secondaryBtn = cx(btn, "border-line-strong bg-surface text-ink hover:bg-surface-subtle");
const card = "flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 md:gap-5 md:p-6";
const wrap = "mx-auto flex w-full max-w-[752px] flex-col gap-5 md:pt-4";

export function OrderConfirmation({ id }: { id: string }) {
  // Same key as the order detail page, so "View order" opens instantly
  const { data: order, error } = useSWR(["order", id], () => api.orders.get(id));

  if (error) {
    // 400 is an id that isn't a valid ObjectId
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <div className={wrap}>
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center">
          <span className="flex size-[72px] items-center justify-center rounded-full border border-line bg-surface text-danger">
            <AlertIcon size={28} />
          </span>
          <h1 className="text-[17px] leading-6 font-semibold">
            {missing ? "We couldn't find this order" : "Something went wrong"}
          </h1>
          <p className="text-ink-muted">
            {missing ? "You can find all your orders under My orders." : errorMessage(error)}
          </p>
          <Link href="/orders" className={cx(secondaryBtn, "mt-2")}>My orders</Link>
        </div>
      </div>
    );
  }
  if (!order) return <ConfirmationSkeleton />;

  const address = order.shippingAddress;

  return (
    <div className={wrap}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckIcon size={32} strokeWidth={2.25} />
        </span>
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.01em] md:text-[30px] md:leading-[38px]">
          Order placed successfully
        </h1>
        <p className="text-[15px] leading-[22px] text-ink-muted md:text-[17px] md:leading-[26px]">
          We&apos;ve received your order and will send it out soon. You&apos;ll pay in cash on delivery.
        </p>
      </div>

      <section aria-label="Order details" className={card}>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <dt className="text-[13px] leading-[18px] text-ink-muted">Order number</dt>
            <dd className="mt-0.5 text-[15px] leading-[22px] font-semibold tabular-nums">{orderNumber(order._id)}</dd>
          </div>
          <div>
            <dt className="text-[13px] leading-[18px] text-ink-muted">Date</dt>
            <dd className="mt-0.5 text-[15px] leading-[22px] font-semibold">{formatDay(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[13px] leading-[18px] text-ink-muted">Status</dt>
            <dd className="mt-0.5"><StatusPill status={order.status} /></dd>
          </div>
        </dl>
        <hr className="border-line" />
        <ul className="flex flex-col gap-3.5">
          {order.items.map((item) => (
            <li key={item._id} className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] leading-[22px] font-semibold">{item.name}</span>
                <span className="text-[13px] leading-[18px] text-ink-muted tabular-nums">
                  {item.quantity} × {formatPrice(item.price)}
                </span>
              </span>
              <span className="text-[17px] leading-6 font-bold tabular-nums">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <hr className="border-line" />
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-semibold md:text-[17px]">Total</span>
          <span className="text-2xl leading-[30px] font-extrabold tabular-nums md:text-[30px] md:leading-9">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </section>

      <section aria-labelledby="ship-to" className={cx(card, "flex-row items-start gap-3.5 md:gap-3.5")}>
        <TruckIcon size={22} className="text-ink-muted" />
        <div>
          <h2 id="ship-to" className="text-[17px] leading-6 font-semibold">Shipping to</h2>
          <address className="mt-1 text-[15px] leading-[22px] not-italic">
            {address.street}
            <br />
            {address.city}, {address.state} {address.postalCode}
            <br />
            {address.country}
          </address>
        </div>
      </section>

      <div className="flex flex-col gap-2.5 md:flex-row md:justify-center md:gap-3">
        <Link href={`/orders/${order._id}`} className={primaryBtn}>View order</Link>
        <Link href="/" className={secondaryBtn}>Continue shopping</Link>
      </div>
    </div>
  );
}

export function ConfirmationSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order" className={wrap}>
      <div className="size-16 self-center rounded-full bg-skeleton" />
      <div className="h-8 w-3/5 self-center rounded-md bg-skeleton" />
      <div className="h-[280px] rounded-xl bg-skeleton" />
    </div>
  );
}
