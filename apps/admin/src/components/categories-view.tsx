"use client";

import { formatDate, type Category } from "@ecomerse/api";
import { Alert, Button, EmptyState, Input, Loading } from "@ecomerse/ui";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { api, errorMessage } from "@/lib/api";

const readForm = (event: FormEvent<HTMLFormElement>) => {
  const form = new FormData(event.currentTarget);
  return { name: String(form.get("name")).trim(), description: String(form.get("description")).trim() };
};

export function CategoriesView() {
  const { data, error, mutate } = useSWR("categories", () => api.categories.list());
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id);
    setActionError(null);
    try {
      await action();
      await mutate();
      return true;
    } catch (err) {
      setActionError(errorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    if (await run("new", () => api.categories.create(readForm(event)))) formEl.reset();
  };

  const save = async (event: FormEvent<HTMLFormElement>, category: Category) => {
    event.preventDefault();
    if (await run(category._id, () => api.categories.update(category._id, readForm(event)))) setEditing(null);
  };

  const remove = (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"? Products in it are not deleted and will show no category.`)) return;
    run(category._id, () => api.categories.remove(category._id));
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Categories" description={data ? `${data.length} categories` : undefined} />

      <form onSubmit={create} className="mb-6 flex flex-wrap gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <Input name="name" required placeholder="New category name" className="w-56" aria-label="Name" />
        <Input name="description" placeholder="Description (optional)" className="min-w-48 flex-1" aria-label="Description" />
        <Button type="submit" loading={busy === "new"}>Add category</Button>
      </form>

      {actionError && <div className="mb-4"><Alert>{actionError}</Alert></div>}

      {error ? (
        <Alert>{errorMessage(error)}</Alert>
      ) : !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState title="No categories yet">Add one above to start creating products.</EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {data.map((category) =>
            editing === category._id ? (
              <li key={category._id} className="p-4">
                <form onSubmit={(e) => save(e, category)} className="flex flex-wrap gap-3">
                  <Input name="name" required defaultValue={category.name} className="w-56" aria-label="Name" autoFocus />
                  <Input name="description" defaultValue={category.description} className="min-w-48 flex-1" aria-label="Description" />
                  <Button type="submit" size="sm" loading={busy === category._id}>Save</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                </form>
              </li>
            ) : (
              <li key={category._id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-zinc-500">{category.description || "No description"}</p>
                </div>
                <span className="text-xs text-zinc-400">Updated {formatDate(category.updatedAt)}</span>
                <Button size="sm" variant="ghost" onClick={() => setEditing(category._id)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-600" loading={busy === category._id} onClick={() => remove(category)}>
                  Delete
                </Button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
