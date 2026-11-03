"use client";

import { cx, Spinner } from "@ecomerse/ui";
import { useEffect, useRef } from "react";
import { AlertIcon } from "../icons";
import { dangerBtn, ErrorNotice, secondaryBtn } from "./ui";

/** Native <dialog>: focus trap, Escape and backdrop come for free. Bottom sheet on mobile, centred on desktop. */
export function DeleteAccountDialog({
  open,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Safest default for a destructive action
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      // Escape: route through onCancel so it's ignored mid-delete
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // A click on the dialog element itself is a click on the backdrop
      onClick={(e) => e.target === ref.current && onCancel()}
      className={cx(
        "mx-0 mt-auto mb-0 w-full max-w-full rounded-t-xl bg-surface text-ink shadow-[0_16px_48px_rgba(20,23,28,0.18)] backdrop:bg-[rgba(15,17,21,0.5)]",
        "md:m-auto md:max-w-[440px] md:rounded-xl",
      )}
    >
      <div className="flex flex-col gap-4 px-4 pt-6 pb-7 md:p-6">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-start">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertIcon size={22} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 id="delete-title" className="text-[17px] leading-6 font-semibold">Delete your account?</h2>
            <p id="delete-description" className="text-[15px] leading-[22px] text-ink-muted">
              This can&apos;t be undone. Your profile and cart will be permanently removed.
            </p>
          </div>
        </div>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end md:gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={deleting} className={secondaryBtn}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting} aria-busy={deleting} className={dangerBtn}>
            {deleting ? (
              <>
                <Spinner className="size-[18px]" />
                <span className="sr-only">Deleting account</span>
              </>
            ) : (
              "Delete account"
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
