import type { OrderStatus } from "@ecomerse/api";
import { cx } from "@ecomerse/ui";

const tones: Record<OrderStatus, string> = {
  pending: "bg-warning-soft text-warning",
  processing: "bg-[#e1f2f8] text-[#0a6688]",
  shipped: "bg-[#f0eafc] text-[#6a3cc2]",
  delivered: "bg-success-soft text-success",
  cancelled: "bg-danger-soft text-danger",
};

export const StatusPill = ({ status, large = false }: { status: OrderStatus; large?: boolean }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-[0.02em] whitespace-nowrap capitalize",
      large ? "h-7 px-3 text-[13px]" : "h-6 px-2.5 text-xs",
      "before:size-1.5 before:rounded-full before:bg-current",
      tones[status],
    )}
  >
    {status}
  </span>
);
