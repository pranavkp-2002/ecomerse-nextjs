"use client";

import { initials, type User } from "@ecomerse/api";
import { cx, Spinner } from "@ecomerse/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import { api, errorMessage, fieldErrors, session } from "@/lib/api";
import { useSession, useSignOut } from "@/lib/session";
import { CheckIcon, LogoutIcon } from "../icons";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { btn, ErrorNotice, secondaryBtn } from "./ui";

const card = "flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 md:gap-5 md:p-6";
const h2 = "text-[19px] leading-[26px] font-bold md:text-[22px] md:leading-[30px]";
const avatar =
  "flex size-[52px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary md:size-14 md:text-xl";

const since = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

function TextField({
  id,
  label,
  error,
  help,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; help?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm leading-5 font-semibold">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || help ? `${id}-note` : undefined}
        className={cx(
          "block h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-ink read-only:bg-surface-subtle read-only:text-ink-muted",
          error ? "border-danger" : "border-line-strong",
        )}
        {...input}
      />
      {(error || help) && (
        <p id={`${id}-note`} className={cx("mt-1.5 text-[13px] leading-[18px]", error ? "text-danger" : "text-ink-muted")}>
          {error || help}
        </p>
      )}
    </div>
  );
}

export function ProfileView() {
  const current = useSession();
  const signOut = useSignOut();
  const { data: profile, error, mutate, isValidating } = useSWR(current && ["profile", current.user.id], () =>
    api.auth.profile(),
  );

  if (error && !profile) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-surface-subtle px-4 py-12 text-center">
        <h2 className="text-[17px] leading-6 font-semibold">Something went wrong</h2>
        <p className="text-ink-muted">We couldn&apos;t load your profile right now.</p>
        <button type="button" onClick={() => mutate()} disabled={isValidating} className={cx(secondaryBtn, "mt-2")}>
          Retry
        </button>
      </div>
    );
  }
  if (!profile || !current) return <ProfileSkeleton />;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Mobile identity header; desktop shows the avatar inside Profile details */}
      <div className="flex items-center gap-3.5 md:hidden">
        <span className={avatar}>{initials(profile.name)}</span>
        <div className="min-w-0">
          <p className="truncate text-2xl leading-8 font-bold tracking-[-0.01em]">{profile.name}</p>
          <p className="truncate text-[13px] leading-[18px] text-ink-muted">{profile.email}</p>
        </div>
      </div>

      <NameCard
        profile={profile}
        onSaved={async (name) => {
          session.set({ ...current, user: { ...current.user, name } });
          await mutate({ ...profile, name }, { revalidate: false });
        }}
      />
      <PasswordCard onChanged={() => signOut("/login?reason=password")} />

      <button
        type="button"
        onClick={() => signOut("/")}
        className={cx(secondaryBtn, "w-full justify-start border-line md:hidden")}
      >
        <LogoutIcon size={20} />
        Log out
      </button>

      <DangerZone onDeleted={() => signOut("/")} />
    </div>
  );
}

function NameCard({ profile, onSaved }: { profile: User; onSaved: (name: string) => Promise<void> }) {
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const trimmed = name.trim();
  const dirty = trimmed !== profile.name;
  const nameError = trimmed === "" ? "Name is required" : fieldErrors(error).name;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [saved]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !dirty || !trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.auth.update({ name: trimmed });
      await onSaved(updated.name);
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="profile-details" className={card}>
      <div className="flex items-center gap-4">
        <span className={cx(avatar, "max-md:hidden")}>{initials(profile.name)}</span>
        <div>
          <h2 id="profile-details" className={h2}>Profile details</h2>
          <p className="text-[13px] leading-[18px] text-ink-muted">
            Customer since {since.format(new Date(profile.createdAt))}
          </p>
        </div>
      </div>

      {error != null && !fieldErrors(error).name && <ErrorNotice>{errorMessage(error)}</ErrorNotice>}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            id="profile-name"
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            error={nameError}
          />
          <TextField id="profile-email" label="Email" value={profile.email} readOnly help="Email can't be changed" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!dirty || !trimmed || saving}
            aria-busy={saving}
            className={cx(secondaryBtn, "max-md:w-full")}
          >
            {saving ? (
              <>
                <Spinner className="size-[18px]" />
                <span className="sr-only">Saving</span>
              </>
            ) : (
              "Save changes"
            )}
          </button>
          {saved && (
            <p role="status" className="flex items-center gap-1 text-[13px] text-success">
              <CheckIcon size={16} />
              Name updated
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function PasswordCard({ onChanged }: { onChanged: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Blocks a double submit before React re-renders the disabled button
  const inFlight = useRef(false);

  const server = fieldErrors(error);
  const errors = {
    old: (touched && !oldPassword ? "Current password is required" : "") || server.oldPassword,
    new: (touched && newPassword.length < 6 ? "Password must be at least 6 characters" : "") || server.newPassword,
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    setTouched(true);
    setError(null);
    if (!oldPassword) return document.getElementById("password-old")?.focus();
    if (newPassword.length < 6) return document.getElementById("password-new")?.focus();

    inFlight.current = true;
    setSaving(true);
    try {
      await api.auth.update({ oldPassword, newPassword });
      // The API revokes every token on password change, including this one
      onChanged();
    } catch (err) {
      setError(err);
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="change-password" className={card}>
      <div>
        <h2 id="change-password" className={h2}>Change password</h2>
        <p className="text-[13px] leading-[18px] text-ink-muted">You&apos;ll be logged out on all devices after changing it.</p>
      </div>

      {error != null && Object.keys(server).length === 0 && <ErrorNotice>{errorMessage(error)}</ErrorNotice>}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            id="password-old"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            error={errors.old}
          />
          <TextField
            id="password-new"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.new}
            help="At least 6 characters"
          />
        </div>
        <div>
          <button type="submit" disabled={saving} aria-busy={saving} className={cx(secondaryBtn, "max-md:w-full")}>
            {saving ? (
              <>
                <Spinner className="size-[18px]" />
                <span className="sr-only">Changing password</span>
              </>
            ) : (
              "Change password"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function DangerZone({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api.auth.deleteAccount();
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <section
      aria-labelledby="danger-zone"
      className="flex flex-col gap-3 rounded-xl border border-danger bg-surface p-4 md:flex-row md:items-center md:gap-4 md:p-6"
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <h2 id="danger-zone" className="text-[17px] leading-6 font-semibold text-danger">Danger zone</h2>
        <p className="text-[13px] leading-[18px] text-ink-muted">
          Deleting your account removes your profile and cart. Past orders are kept for our records. This can&apos;t be undone.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(btn, "border-danger bg-surface text-danger hover:bg-danger-soft max-md:w-full")}
      >
        Delete account
      </button>
      <DeleteAccountDialog
        open={open}
        deleting={deleting}
        error={error}
        onCancel={() => {
          if (deleting) return;
          setOpen(false);
          setError(null);
        }}
        onConfirm={confirm}
      />
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile" className="flex flex-col gap-4 md:gap-6">
      {[0, 1].map((i) => (
        <div key={i} className={card}>
          <div className="h-6 w-[200px] rounded-md bg-skeleton" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-11 rounded-lg bg-skeleton" />
            <div className="h-11 rounded-lg bg-skeleton" />
          </div>
          <div className="h-11 w-[140px] rounded-lg bg-skeleton" />
        </div>
      ))}
    </div>
  );
}
