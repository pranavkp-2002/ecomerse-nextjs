"use client";

import { cx } from "@ecomerse/ui";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertIcon, CheckIcon, CloseIcon } from "../icons";

export type Toast = { tone: "success" | "error"; title?: string; text: string };

/** Success toasts auto-dismiss after 4s; errors stay until dismissed. */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (next: Toast) => {
    setToast(next);
    clearTimeout(timer.current);
    if (next.tone === "success") timer.current = setTimeout(() => setToast(null), 4000);
  };
  const dismiss = () => {
    clearTimeout(timer.current);
    setToast(null);
  };
  return [toast, show, dismiss] as const;
}

/** Top of the screen on mobile, bottom-right on desktop. */
export function ToastView({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  return (
    <div
      role={toast?.tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cx(
        "fixed inset-x-4 top-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3.5 shadow-pop transition-[transform,opacity] duration-200 ease-out",
        "lg:inset-x-auto lg:top-auto lg:right-8 lg:bottom-8 lg:w-[380px]",
        toast?.tone === "error" ? "border-danger-soft bg-danger-soft" : "border-line bg-surface",
        toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0 lg:translate-y-3",
      )}
    >
      {toast && (
        <>
          {toast.tone === "success" ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckIcon size={18} />
            </span>
          ) : (
            <AlertIcon size={22} className="mt-0.5 text-danger" />
          )}
          <div className="flex flex-1 flex-col gap-0.5 self-center text-[15px]">
            {toast.title && <p className="font-semibold">{toast.title}</p>}
            <p className={toast.title ? "text-[13px] leading-[18px] text-ink-muted" : "font-semibold"}>{toast.text}</p>
          </div>
          {toast.tone === "success" && (
            <Link href="/cart" className="self-center text-[13px] font-semibold text-primary hover:text-primary-hover">
              View cart
            </Link>
          )}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="-mt-1 -mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-surface-subtle"
          >
            <CloseIcon size={18} />
          </button>
        </>
      )}
    </div>
  );
}
