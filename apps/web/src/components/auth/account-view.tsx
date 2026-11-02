"use client";

import { formatDate } from "@ecomerse/api";
import { Alert, Button, Field, Input, Loading } from "@ecomerse/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api, errorMessage, fieldErrors, session } from "@/lib/api";
import { useSession } from "@/lib/session";

type Status = { tone: "error" | "success"; text: string; error?: unknown } | null;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function AccountView() {
  const current = useSession();
  const router = useRouter();
  const { mutate: mutateAll } = useSWRConfig();
  const { data: profile, error, mutate } = useSWR(current && ["profile", current.user.id], () => api.auth.profile());

  const [nameStatus, setNameStatus] = useState<Status>(null);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<"name" | "password" | "delete" | null>(null);

  if (error) return <Alert>{errorMessage(error)}</Alert>;
  if (!profile || !current) return <Loading />;

  const signOut = (to: string) => {
    session.clear();
    mutateAll(() => true, undefined, { revalidate: false });
    router.replace(to);
  };

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    setBusy("name");
    setNameStatus(null);
    try {
      const updated = await api.auth.update({ name });
      session.set({ ...current, user: { ...current.user, name: updated.name } });
      await mutate();
      setNameStatus({ tone: "success", text: "Name updated." });
    } catch (err) {
      setNameStatus({ tone: "error", text: errorMessage(err), error: err });
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("password");
    setPasswordStatus(null);
    try {
      await api.auth.update({
        oldPassword: String(form.get("oldPassword")),
        newPassword: String(form.get("newPassword")),
      });
      // The API revokes every token on password change, including this one
      signOut("/login?reason=password");
    } catch (err) {
      setPasswordStatus({ tone: "error", text: errorMessage(err), error: err });
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    setBusy("delete");
    try {
      await api.auth.deleteAccount();
      signOut("/");
    } catch (err) {
      window.alert(errorMessage(err));
      setBusy(null);
    }
  };

  const passwordErrors = fieldErrors(passwordStatus?.error);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {profile.email} · member since {formatDate(profile.createdAt)}
        </p>
      </div>

      <Section title="Profile">
        <form onSubmit={saveName} className="space-y-4">
          {nameStatus && <Alert tone={nameStatus.tone}>{nameStatus.text}</Alert>}
          <Field label="Name" error={fieldErrors(nameStatus?.error).name}>
            <Input name="name" required defaultValue={profile.name} autoComplete="name" />
          </Field>
          <Button type="submit" loading={busy === "name"}>Save</Button>
        </form>
      </Section>

      <Section title="Change password">
        <form onSubmit={changePassword} className="space-y-4">
          {passwordStatus && <Alert tone={passwordStatus.tone}>{passwordStatus.text}</Alert>}
          <Field label="Current password" error={passwordErrors.oldPassword}>
            <Input name="oldPassword" type="password" required autoComplete="current-password" />
          </Field>
          <Field label="New password" error={passwordErrors.newPassword} hint="At least 6 characters. You'll be logged out everywhere.">
            <Input name="newPassword" type="password" required minLength={6} autoComplete="new-password" />
          </Field>
          <Button type="submit" loading={busy === "password"}>Change password</Button>
        </form>
      </Section>

      <Section title="Delete account">
        <p className="text-sm text-zinc-600">Permanently remove your account. Past orders are kept for our records.</p>
        <Button variant="danger" onClick={deleteAccount} loading={busy === "delete"}>
          Delete account
        </Button>
      </Section>
    </div>
  );
}
