"use client";

import { Alert, Button, Field, Input } from "@ecomerse/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { api, errorMessage, fieldErrors, safeNext, session } from "@/lib/api";

const NOTICES: Record<string, string> = {
  forbidden: "That account doesn't have admin access.",
};

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const notice = NOTICES[params.get("reason") ?? ""];
  const errors = fieldErrors(error);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.auth.login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      // The API happily logs customers in; the admin routes would then 403 on every call
      if (result.user.role !== "admin") throw new Error(NOTICES.forbidden);
      session.set(result);
      mutate(() => true, undefined, { revalidate: false });
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Ecomerse</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Admin sign in</h1>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        {error != null ? <Alert>{errorMessage(error)}</Alert> : notice && <Alert tone="info">{notice}</Alert>}
        <Field label="Email" error={errors.email}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input name="password" type="password" required autoComplete="current-password" />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
