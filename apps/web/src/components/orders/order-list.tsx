"use client";

import { formatDay, formatPrice, orderNumber, type Order } from "@ecomerse/api";
import { cx } from "@ecomerse/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { pageList } from "@/lib/page-list";
import { useSession } from "@/lib/session";
import { iconButtonClass } from "../header";
import { ChevronLeftIcon, ChevronRightIcon, PackageIcon } from "../icons";
import { StatusPill } from "./status-pill";

const PAGE_SIZE = 10;

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] font-semibold whitespace-nowrap transition-colors";
const h2 = "text-[19px] leading-[26px] font-bold md:text-[22px] md:leading-[30px]";
// Mobile: stacked cards. Desktop: one table, header and rows on the same grid.
const tableGrid = "md:grid md:min-w-[640px] md:grid-cols-[1.2fr_1fr_0.8fr_1fr_1fr_24px] md:gap-4";

const itemsText = (order: Order) => {
  const n = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return n === 1 ? "1 item" : `${n} items`;
};

export function OrderList() {
  const page = Math.max(1, Number(useSearchParams().get("page")) || 1);
  const current = useSession();
  const { data, error, mutate, isValidating } = useSWR(
    current && ["orders", current.user.id, page],
    () => api.orders.mine({ page, limit: PAGE_SIZE }),
    { keepPreviousData: true },
  );
  const href = (p: number) => (p === 1 ? "/orders" : `/orders?page=${p}`);

  return (
    <section aria-labelledby="my-orders" className="flex flex-col gap-4 md:gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="my-orders" className={h2}>My orders</h2>
        {data && data.total > 0 && (
          <p className="text-[13px] leading-[18px] text-ink-muted tabular-nums">
            {data.total === 1 ? "1 order" : `${data.total} orders`}
          </p>
        )}
      </div>

      {error && !data ? (
        <StateBox title="Something went wrong" role="alert">
          <p className="text-ink-muted">We couldn&apos;t load your orders right now.</p>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className={cx(btn, "mt-1 border-line-strong bg-surface text-ink hover:bg-surface-subtle")}
          >
            Retry
          </button>
        </StateBox>
      ) : !data ? (
        <ListSkeleton />
      ) : data.items.length === 0 ? (
        <StateBox title="No orders yet" icon>
          <p className="text-ink-muted">When you place an order, it will show up here.</p>
          <Link href="/" className={cx(btn, "mt-1 border-transparent bg-primary text-white hover:bg-primary-hover")}>
            Start shopping
          </Link>
        </StateBox>
      ) : (
        <>
          <div className="flex flex-col md:overflow-x-auto md:rounded-xl md:border md:border-line md:bg-surface">
            <div aria-hidden className={cx("hidden px-5 py-3 text-[13px] text-ink-muted", tableGrid)}>
              <span>Order</span>
              <span>Date</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            <ul className="flex flex-col gap-3 md:gap-0">
              {data.items.map((order) => (
                <li key={order._id}>
                  <Link
                    href={`/orders/${order._id}`}
                    aria-label={`Order ${orderNumber(order._id)}, ${formatDay(order.createdAt)}, ${itemsText(order)}, ${formatPrice(order.totalAmount)}, ${order.status}`}
                    className={cx(
                      "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2.5 rounded-xl border border-line bg-surface p-4 text-ink transition-shadow hover:shadow-card",
                      "md:items-center md:rounded-none md:border-0 md:border-t md:px-5 md:py-[18px] md:hover:bg-surface-subtle md:hover:shadow-none",
                      tableGrid,
                    )}
                  >
                    <span className="text-[15px] font-semibold tabular-nums">{orderNumber(order._id)}</span>
                    <span className="justify-self-end md:col-start-5 md:row-start-1 md:justify-self-start">
                      <StatusPill status={order.status} />
                    </span>
                    <span className="text-[13px] text-ink-muted md:text-[15px]">
                      {formatDay(order.createdAt)}
                      <span className="md:hidden"> · {itemsText(order)}</span>
                    </span>
                    <span className="hidden text-[15px] tabular-nums md:block">{itemsText(order)}</span>
                    <span className="justify-self-end text-[15px] font-bold tabular-nums md:justify-self-start md:font-semibold">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <ChevronRightIcon size={20} className="hidden text-ink-muted md:col-start-6 md:row-start-1 md:block" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {data.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-2 flex items-center justify-center gap-1">
              <PageLink href={page > 1 ? href(page - 1) : null} label="Previous page">
                <ChevronLeftIcon size={20} />
              </PageLink>
              {pageList(page, data.totalPages).map((p, i) =>
                p === "gap" ? (
                  <span key={`gap-${i}`} aria-hidden className="w-7 text-center text-ink-muted">…</span>
                ) : (
                  <Link
                    key={p}
                    href={href(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={cx(iconButtonClass, "text-[15px] tabular-nums", p === page && "bg-primary-soft font-bold text-primary")}
                  >
                    {p}
                  </Link>
                ),
              )}
              <PageLink href={page < data.totalPages ? href(page + 1) : null} label="Next page">
                <ChevronRightIcon size={20} />
              </PageLink>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  return href ? (
    <Link href={href} aria-label={label} className={iconButtonClass}>{children}</Link>
  ) : (
    <span aria-hidden className={cx(iconButtonClass, "cursor-not-allowed opacity-45 hover:bg-transparent")}>{children}</span>
  );
}

function StateBox({ title, icon, role, children }: { title: string; icon?: boolean; role?: "alert"; children: React.ReactNode }) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center">
      {icon && (
        <span className="flex size-16 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
          <PackageIcon size={28} />
        </span>
      )}
      <h3 className="text-[17px] leading-6 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Loading orders" className="flex flex-col gap-3 md:gap-0 md:rounded-xl md:border md:border-line">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 rounded-xl border border-line p-4 md:rounded-none md:border-0 md:border-t md:px-5 md:py-[18px] md:first:border-t-0">
          <div className="h-4 w-[90px] rounded-md bg-skeleton" />
          <div className="h-3.5 w-[100px] rounded-md bg-skeleton" />
          <div className="ml-auto h-4 w-[70px] rounded-md bg-skeleton" />
          <div className="h-6 w-[84px] rounded-full bg-skeleton" />
        </li>
      ))}
    </ul>
  );
}
