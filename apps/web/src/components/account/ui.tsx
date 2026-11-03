import { cx } from "@ecomerse/ui";
import type { ReactNode } from "react";
import { AlertIcon } from "../icons";

export const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45 aria-busy:cursor-progress aria-busy:opacity-100";
export const secondaryBtn = cx(btn, "border-line-strong bg-surface text-ink hover:not-disabled:bg-surface-subtle");
export const dangerBtn = cx(btn, "border-transparent bg-danger text-white hover:not-disabled:bg-[#a51f26]");
export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-danger">
      <AlertIcon size={20} />
      <p className="text-[13px] leading-[18px] text-ink">{children}</p>
    </div>
  );
}
