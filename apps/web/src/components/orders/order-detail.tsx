"use client";

import { ApiError, formatDate, formatPrice, orderNumber, type OrderStatus } from "@ecomerse/api";
import { cx } from "@ecomerse/ui";
import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import { CheckIcon, ChevronLeftIcon, CloseIcon, PackageIcon } from "../icons";
import { StatusPill } from "./status-pill";

const card = "flex flex-col gap-3.5 rounded-xl border border-line bg-surface p-4 md:gap-4 md:p-6";
const btn =
  "mt-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ink hover:bg-surface-subtle";

const STEPS: { status: Exclude<OrderStatus, "cancelled">; note: string }[] = [
  { status: "pending", note: "We have your order" },
  { status: "processing", note: "Packing your items" },
  { status: "shipped", note: "On its way" },
  { status: "delivered", note: "Handed to you" },
];

const BackLink = () => (
  <Link
    href="/orders"
    className="inline-flex min-h-11 items-center gap-1 self-start text-[13px] font-semibold text-primary hover:text-primary-hover hover:underline"
  >
    <ChevronLeftIcon size={16} />
    My orders
  </Link>
);

export function OrderDetail({ id }: { id: string }) {
  const { data: order, error, mutate, isValidating } = useSWR(["order", id], () => api.orders.get(id));

  if (error && !order) {
    // 400 is an id that isn't a valid ObjectId; 404 includes another user's order
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <div className="flex flex-col gap-4 md:gap-5">
        <BackLink />
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
            <PackageIcon size={28} />
          </span>
          <h2 className="text-[17px] leading-6 font-semibold">
            {missing ? "We couldn't find this order" : "Something went wrong"}
          </h2>
          <p className="text-ink-muted">
            {missing ? "It may belong to another account, or the link is wrong." : "We couldn't load this order right now."}
          </p>
          {missing ? (
            <Link href="/orders" className={btn}>My orders</Link>
          ) : (
            <button type="button" onClick={() => mutate()} disabled={isValidating} className={btn}>Retry</button>
          )}
        </div>
      </div>
    );
  }
  if (!order) return <OrderDetailSkeleton />;

  const address = order.shippingAddress;

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl leading-8 font-bold tracking-[-0.01em] tabular-nums md:text-[30px] md:leading-[38px]">
            Order {orderNumber(order._id)}
          </h2>
          <p className="text-ink-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusPill status={order.status} large />
      </div>

      {order.status === "cancelled" ? (
        <div role="status" className="flex items-start gap-3.5 rounded-xl bg-danger-soft px-5 py-4">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-danger text-danger">
            <CloseIcon size={14} strokeWidth={2.5} />
          </span>
          <div>
            <p className="mb-0.5 text-[17px] leading-6 font-semibold text-danger">This order was cancelled</p>
            <p className="text-[15px] leading-[22px]">Nothing was charged, because payment is collected on delivery.</p>
          </div>
        </div>
      ) : (
        <section aria-label="Order progress" className={card}>
          <Stepper status={order.status} />
        </section>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <section aria-labelledby="order-items" className={cx(card, "min-w-0 lg:flex-[2_1_0]")}>
          <h3 id="order-items" className="text-[19px] leading-[26px] font-bold md:text-[22px] md:leading-[30px]">Items</h3>
          <div
            aria-hidden
            className="hidden grid-cols-[1fr_60px_110px_110px] gap-3 border-b border-line pb-2.5 text-[13px] text-ink-muted md:grid [&>span:not(:first-child)]:text-right"
          >
            <span>Product</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span>Total</span>
          </div>
          <ul className="flex flex-col gap-3.5">
            {order.items.map((item) => (
              <li
                key={item._id}
                className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-0.5 md:grid-cols-[1fr_60px_110px_110px] md:items-center md:gap-3"
              >
                <Link
                  href={`/products/${item.product}`}
                  className="text-[15px] leading-[22px] font-semibold text-ink hover:underline md:col-start-1"
                >
                  {item.name}
                </Link>
                <span className="row-start-2 text-[13px] text-ink-muted tabular-nums md:hidden">
                  {item.quantity} × {formatPrice(item.price)}
                </span>
                <span className="hidden text-right text-[15px] tabular-nums md:block">{item.quantity}</span>
                <span className="hidden text-right text-[15px] text-ink-muted tabular-nums md:block">{formatPrice(item.price)}</span>
                <span className="col-start-2 row-span-2 row-start-1 text-right text-[15px] font-semibold tabular-nums md:col-start-4 md:row-span-1">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <hr className="border-line" />
          <div className="flex justify-between text-[15px]">
            <span className="text-ink-muted">Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[17px] font-semibold">Total</span>
            <span className="text-2xl leading-[30px] font-extrabold tabular-nums md:text-[30px] md:leading-9">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </section>

        {/* No cancel button: customers can't cancel orders themselves */}
        <div className="flex flex-col gap-4 md:gap-6 lg:flex-[1_1_0]">
          <section aria-labelledby="order-address" className={card}>
            <h3 id="order-address" className="text-[17px] leading-6 font-semibold">Shipping address</h3>
            <address className="text-[15px] leading-[22px] not-italic">
              {address.street}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </address>
          </section>
          <section aria-labelledby="order-payment" className={card}>
            <h3 id="order-payment" className="text-[17px] leading-6 font-semibold">Payment</h3>
            <p className="text-[15px] leading-[22px]">Cash on delivery</p>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Pending → Processing → Shipped → Delivered. Vertical on mobile, horizontal from md up. */
function Stepper({ status }: { status: Exclude<OrderStatus, "cancelled"> }) {
  const current = STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="flex flex-col md:grid md:grid-cols-4 md:py-1">
      {STEPS.map((step, i) => {
        // Delivered is the last step, so it shows as done rather than in progress
        const done = i < current || (i === current && status === "delivered");
        const isCurrent = i === current && !done;
        const last = i === STEPS.length - 1;
        return (
          <li
            key={step.status}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex min-h-[60px] gap-3.5 md:min-h-0 md:flex-col md:items-center md:gap-2.5 md:text-center"
          >
            {!last && (
              // Connector to the next step: green once that step is reached
              <span
                aria-hidden
                className={cx(
                  "absolute top-[34px] bottom-0.5 left-[15px] w-0.5",
                  "md:top-[15px] md:right-[calc(-50%+20px)] md:bottom-auto md:left-[calc(50%+20px)] md:h-0.5 md:w-auto",
                  i < current ? "bg-success" : "bg-line",
                )}
              />
            )}
            <span
              className={cx(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                done ? "border-success bg-success text-white" : isCurrent ? "border-success bg-surface" : "border-line-strong bg-surface",
              )}
            >
              {done && <CheckIcon size={16} strokeWidth={2.5} />}
              {isCurrent && <span className="size-2.5 rounded-full bg-success" />}
            </span>
            <span className="flex flex-col pt-1 pb-3 md:p-0">
              <span className={cx("text-[15px] leading-[22px] font-semibold capitalize", i <= current ? "text-ink" : "text-ink-muted")}>
                {step.status}
              </span>
              <span className="text-[13px] leading-[18px] text-ink-muted">{step.note}</span>
              <span className="sr-only">{done ? " (completed)" : isCurrent ? " (current)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order" className="flex flex-col gap-4 md:gap-5">
      <BackLink />
      <div className="h-8 w-60 rounded-md bg-skeleton" />
      <div className="h-[110px] rounded-xl bg-skeleton" />
      <div className="h-[260px] rounded-xl bg-skeleton" />
    </div>
  );
}
