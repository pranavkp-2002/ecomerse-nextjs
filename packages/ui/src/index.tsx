import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Apps must add `@source "../../../../packages/ui/src";` to their globals.css
// so Tailwind generates the classes used here.

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300",
  secondary:
    "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400",
  danger: "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300",
  ghost: "text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400",
};

export const buttonClass = (variant: Variant = "primary", size: "sm" | "md" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed",
    size === "sm" ? "px-2.5 py-1.5 text-sm" : "px-4 py-2 text-sm",
    variants[variant],
  );

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={cx(buttonClass(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

const controlClass =
  "block w-full rounded-md bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-zinc-50";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cx(controlClass, className)} {...props} />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cx(controlClass, className)} {...props} />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cx(controlClass, "pr-8", className)} {...props} />
);

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {error ? (
        <span className="block text-sm text-red-600">{error}</span>
      ) : (
        hint && <span className="block text-sm text-zinc-500">{hint}</span>
      )}
    </label>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "bg-red-50 text-red-800 ring-red-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    info: "bg-sky-50 text-sky-800 ring-sky-200",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-md px-4 py-3 text-sm ring-1 ring-inset", tones[tone])}>
      {children}
    </div>
  );
}

export const Spinner = ({ className }: { className?: string }) => (
  <svg className={cx("animate-spin", className ?? "size-5")} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
    <Spinner /> {label}
  </div>
);

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-14 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      {children && <div className="mt-2 text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-4 pt-6" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-zinc-600">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}

const statusTones: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  processing: "bg-sky-50 text-sky-800 ring-sky-200",
  shipped: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={cx(
      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
      statusTones[status] ?? statusTones.cancelled,
    )}
  >
    {status}
  </span>
);
