"use client";

import { Alert, Button, Field, Input } from "@ecomerse/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { api, errorMessage, fieldErrors, safeNext, session } from "@/lib/api";

const NOTICES: Record<string, string> = {
  password: "Your password was changed. Please log in again.",
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const next = safeNext(params.get("next"));
  const notice = NOTICES[params.get("reason") ?? ""];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const errors = fieldErrors(error);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setSubmitting(true);
    setError(null);
    try {
      if (mode === "register") {
        await api.auth.register({ name: String(form.get("name")), email, password });
      }
      session.set(await api.auth.login({ email, password }));
      mutate(() => true, undefined, { revalidate: false });
      router.replace(next);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const otherHref = (path: string) => (next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`);

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <Link href={otherHref(mode === "login" ? "/register" : "/login")} className="font-medium text-indigo-600">
            {mode === "login" ? "Create an account" : "Log in"}
          </Link>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        {notice && !error && <Alert tone="info">{notice}</Alert>}
        {error != null && <Alert>{errorMessage(error)}</Alert>}
        {mode === "register" && (
          <Field label="Name" error={errors.name}>
            <Input name="name" required autoComplete="name" />
          </Field>
        )}
        <Field label="Email" error={errors.email}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password} hint={mode === "register" ? "At least 6 characters" : undefined}>
          <Input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 6 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
