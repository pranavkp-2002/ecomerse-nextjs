"use client";

import { ApiError } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSWRConfig } from "swr";
import { api, errorMessage, fieldErrors, safeNext, startSession } from "@/lib/api";
import { AlertIcon, CheckIcon } from "../icons";

type Mode = "login" | "register";
type Tone = "info" | "warning" | "error" | "success";
type Field = "name" | "email" | "password";

// The API allows 10 attempts per 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000;

// Context notices from ?reason= / ?registered=, shown on Login until an error replaces them
const NOTICES: Record<string, { tone: Tone; text: string }> = {
  expired: { tone: "warning", text: "Session expired, please log in again" },
  cart: { tone: "info", text: "Log in to add items to your cart. We'll take you back to the product." },
  password: { tone: "success", text: "Password changed — please log in again" },
  registered: { tone: "success", text: "Account created. Log in with your new account." },
};

const COPY = {
  login: { title: "Log in", lead: "Welcome back. Log in to see your cart and orders.", submit: "Log in", busy: "Logging in" },
  register: { title: "Create an account", lead: "Save your cart and track your orders.", submit: "Create account", busy: "Creating account" },
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function validate(mode: Mode, values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {};
  if (mode === "register") {
    if (!values.name.trim()) errors.name = "Name is required";
    if (!isEmail(values.email)) errors.email = "Invalid email";
    if (values.password.length < 6) errors.password = "Password must be at least 6 characters";
  }
  return errors;
}

const tones: Record<Tone, string> = {
  info: "bg-[#e1f2f8] text-[#0a6688]",
  warning: "bg-warning-soft text-warning",
  error: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

function Notice({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div role={tone === "error" || tone === "warning" ? "alert" : "status"} className={cx("flex items-start gap-2.5 rounded-lg px-3.5 py-3", tones[tone])}>
      {tone === "success" ? <CheckIcon size={20} /> : <AlertIcon size={20} />}
      <p className="text-[13px] leading-[18px] text-ink">{children}</p>
    </div>
  );
}

const card = "flex w-full max-w-[440px] flex-col gap-6 md:rounded-xl md:border md:border-line md:bg-surface md:p-8";

export function AuthForm({ mode }: { mode: Mode }) {
  const params = useSearchParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const next = safeNext(params.get("next"));
  const notice = mode === "login" ? NOTICES[params.get("registered") === "1" ? "registered" : (params.get("reason") ?? "")] : undefined;

  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  // Blocks a double submit before React re-renders the disabled button
  const inFlight = useRef(false);

  // Re-enable Log in when the rate-limit window ends
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setTimeout(() => {
      setLockedUntil(null);
      setError(null);
    }, lockedUntil - Date.now());
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  const status = error instanceof ApiError ? error.status : null;
  const clientErrors = touched ? validate(mode, values) : {};
  // Login's 400/401 is shown as one generic message, not per field
  const serverErrors = mode === "register" ? fieldErrors(error) : {};
  const errors = { ...serverErrors, ...clientErrors };
  const duplicate = mode === "register" && error != null && /already registered/i.test(errorMessage(error));
  const banner =
    error == null || Object.keys(serverErrors).length > 0
      ? null
      : mode === "login" && (status === 400 || status === 401)
        ? "Email or password is wrong"
        : errorMessage(error);

  const withNext = (path: string) => (next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current || lockedUntil) return;
    setTouched(true);
    setError(null);

    const invalid = (["name", "email", "password"] as const).find((field) => validate(mode, values)[field]);
    if (invalid) {
      document.getElementById(`auth-${invalid}`)?.focus();
      return;
    }
    if (mode === "login" && (!values.email.trim() || !values.password)) {
      setError(new ApiError(401, "Email or password is wrong"));
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    const email = values.email.trim();
    let registered = false;
    try {
      if (mode === "register") {
        await api.auth.register({ name: values.name.trim(), email, password: values.password });
        registered = true;
      }
      // Registering doesn't return a token, so log straight in with the same details
      startSession(await api.auth.login({ email, password: values.password }));
      // Drop any data cached for the previous (or no) user
      mutate(() => true, undefined, { revalidate: false });
      router.replace(next);
      // Stay busy through navigation
    } catch (err) {
      if (registered) {
        // The account exists but the follow-up login failed (e.g. rate limited)
        router.replace(`/login?registered=1${next === "/" ? "" : `&next=${encodeURIComponent(next)}`}`);
        return;
      }
      if (err instanceof ApiError && err.status === 429) setLockedUntil(Date.now() + LOCKOUT_MS);
      setError(err);
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const field = (name: Field, label: string, input: React.InputHTMLAttributes<HTMLInputElement>, help?: string) => {
    const message = errors[name];
    // A duplicate email is explained in the banner; just outline the field
    const invalid = !!message || (name === "email" && duplicate);
    const describedBy = message ? `auth-${name}-error` : help ? `auth-${name}-help` : undefined;
    return (
      <div>
        <label htmlFor={`auth-${name}`} className="mb-1.5 block text-sm leading-5 font-semibold">
          {label}
        </label>
        <input
          id={`auth-${name}`}
          name={name}
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cx(
            "block h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-ink placeholder:text-ink-muted",
            invalid ? "border-danger" : "border-line-strong",
          )}
          {...input}
        />
        {message ? (
          <p id={`auth-${name}-error`} className="mt-1.5 flex items-center gap-1 text-[13px] leading-[18px] text-danger">
            <AlertIcon size={14} />
            {message}
          </p>
        ) : (
          help && (
            <p id={`auth-${name}-help`} className="mt-1.5 text-[13px] leading-[18px] text-ink-muted">
              {help}
            </p>
          )
        )}
      </div>
    );
  };

  const copy = COPY[mode];
  const locked = lockedUntil !== null;
  const link = "font-semibold text-primary hover:text-primary-hover hover:underline";

  return (
    <div className={card}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.01em] md:text-[30px] md:leading-[38px]">{copy.title}</h1>
        <p className="text-[15px] leading-[22px] text-ink-muted">{copy.lead}</p>
      </div>

      {/* One banner at a time: an error replaces the context notice */}
      {banner ? (
        <Notice tone="error">
          {duplicate ? (
            <>
              User already registered.{" "}
              <Link href={withNext("/login")} className={link}>Log in instead</Link>
            </>
          ) : (
            banner
          )}
        </Notice>
      ) : (
        notice && <Notice tone={notice.tone}>{notice.text}</Notice>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {mode === "register" && field("name", "Name", { autoComplete: "name", placeholder: "Your full name" })}
        {field("email", "Email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
        {field(
          "password",
          "Password",
          { type: "password", autoComplete: mode === "login" ? "current-password" : "new-password" },
          mode === "register" ? "At least 6 characters" : undefined,
        )}
        <button
          type="submit"
          disabled={submitting || locked}
          aria-busy={submitting}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] leading-[22px] font-semibold text-white transition-colors hover:not-disabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45 aria-busy:cursor-progress aria-busy:opacity-100 md:min-h-11"
        >
          {submitting ? (
            <>
              <Spinner className="size-[18px]" />
              <span className="sr-only">{copy.busy}</span>
            </>
          ) : (
            copy.submit
          )}
        </button>
        {locked && <p className="text-[13px] leading-[18px] text-ink-muted">You can try again in 15 minutes.</p>}
      </form>

      <p className="text-center text-[15px] leading-[22px] text-ink-muted">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <Link href={withNext(mode === "login" ? "/register" : "/login")} className={link}>
          {mode === "login" ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}

export function AuthCardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className={card}>
      <div className="h-8 w-1/2 rounded-md bg-skeleton" />
      <div className="h-11 rounded-lg bg-skeleton" />
      <div className="h-11 rounded-lg bg-skeleton" />
      <div className="h-12 rounded-lg bg-skeleton md:h-11" />
    </div>
  );
}
