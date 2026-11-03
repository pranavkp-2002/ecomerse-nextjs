"use client";

import type { Product, ProductInput } from "@ecomerse/api";
import { Alert, Button, buttonClass, Field, Input, Loading, Select, Textarea } from "@ecomerse/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { PageHeader } from "@/components/page-header";
import { ImagePicker, ProductImages } from "@/components/products/product-images";
import { api, errorMessage, fieldErrors } from "@/lib/api";

export function EditProduct({ id }: { id: string }) {
  const { data, error } = useSWR(["admin-product", id], () => api.products.get(id));
  if (error) return <Alert>{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  return <ProductForm product={data} />;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: categories, error: categoriesError } = useSWR("categories", () => api.categories.list());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // New products only; an existing product's images are managed by <ProductImages>
  const [images, setImages] = useState<File[]>([]);
  const errors = fieldErrors(error);

  const currentCategory = typeof product?.category === "object" ? product.category._id : product?.category;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: ProductInput = {
      name: String(form.get("name")).trim(),
      description: String(form.get("description")),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      category: String(form.get("category")),
    };

    setSubmitting(true);
    setError(null);
    try {
      if (product) await api.products.update(product._id, input);
      else await api.products.create(input, images);
      // Lists, totals and this product's own cache entry are all stale now
      await mutate((key) => Array.isArray(key) && String(key[0]).startsWith("admin-product"), undefined);
      router.push("/products");
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={product ? `Edit ${product.name}` : "New product"} />
      <form onSubmit={submit} className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6">
        {error != null && <Alert>{errorMessage(error)}</Alert>}
        {categoriesError && <Alert>{errorMessage(categoriesError)}</Alert>}
        {categories?.length === 0 && (
          <Alert tone="info">
            Create a <Link href="/categories" className="font-medium underline">category</Link> first; every product needs one.
          </Alert>
        )}

        <Field label="Name" error={errors.name}>
          <Input name="name" required defaultValue={product?.name} />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea name="description" rows={4} defaultValue={product?.description} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (₹)" error={errors.price}>
            <Input name="price" type="number" required min={0} step="0.01" defaultValue={product?.price} />
          </Field>
          <Field label="Stock" error={errors.stock}>
            <Input name="stock" type="number" required min={0} step={1} defaultValue={product?.stock ?? 0} />
          </Field>
          <Field label="Category" error={errors.category}>
            <Select name="category" required defaultValue={currentCategory ?? ""} key={categories ? "loaded" : "loading"}>
              <option value="" disabled>
                {categories ? "Choose…" : "Loading…"}
              </option>
              {categories?.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        {!product && <ImagePicker files={images} onChange={setImages} />}
        <div className="flex gap-3">
          <Button type="submit" loading={submitting}>
            {product ? "Save changes" : "Create product"}
          </Button>
          <Link href="/products" className={buttonClass("secondary")}>Cancel</Link>
        </div>
      </form>
      {product && <ProductImages product={product} />}
    </div>
  );
}
