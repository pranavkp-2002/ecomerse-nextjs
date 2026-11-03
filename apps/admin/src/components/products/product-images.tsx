"use client";

import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES, type Product } from "@ecomerse/api";
import { Alert, buttonClass, cx, Spinner } from "@ecomerse/ui";
import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useSWRConfig } from "swr";
import { api, errorMessage } from "@/lib/api";

const ACCEPT = IMAGE_TYPES.join(",");
const HINT = `JPEG, PNG, WEBP or AVIF, up to 5 MB each. At most ${MAX_PRODUCT_IMAGES} per product.`;

/** Same checks as the API, so bad files are caught before anything is uploaded. */
function validate(files: File[], existing: number) {
  if (files.some((f) => !(IMAGE_TYPES as readonly string[]).includes(f.type))) {
    return "Only JPEG, PNG, WEBP or AVIF images are allowed";
  }
  if (files.some((f) => f.size > MAX_IMAGE_BYTES)) return "Each image must be 5 MB or smaller";
  if (existing + files.length > MAX_PRODUCT_IMAGES) {
    return `A product can have at most ${MAX_PRODUCT_IMAGES} images (currently ${existing})`;
  }
  return null;
}

// Takes the files out of the input and clears it, so picking the same file again still fires onChange
const takeFiles = (event: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files ?? []);
  event.target.value = "";
  return files;
};

function AddButton({ disabled, onFiles, children }: { disabled?: boolean; onFiles: (files: File[]) => void; children: string }) {
  return (
    <label className={cx(buttonClass("secondary", "sm"), disabled ? "pointer-events-none opacity-50" : "cursor-pointer")}>
      {children}
      <input type="file" accept={ACCEPT} multiple disabled={disabled} className="sr-only" onChange={(e) => onFiles(takeFiles(e))} />
    </label>
  );
}

function Thumb({ src, alt, local, children }: { src: string; alt: string; local?: boolean; children?: ReactNode }) {
  return (
    <li className="group relative aspect-square overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200">
      {/* Local previews are blob: URLs, which the image optimizer can't fetch */}
      <Image src={src} alt={alt} fill sizes="128px" unoptimized={local} className="object-cover" />
      {children}
    </li>
  );
}

const thumbAction =
  "absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs font-medium text-red-600 shadow-sm hover:bg-white disabled:text-zinc-400";

/** For a product that doesn't exist yet: files are held here and sent with the create request. */
export function ImagePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const add = (picked: File[]) => {
    const problem = validate(picked, files.length);
    setError(problem);
    if (!problem) onChange([...files, ...picked]);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-zinc-800">Images</legend>
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((file, i) => (
            <Thumb key={previews[i]} src={previews[i]} alt={file.name} local>
              <button type="button" className={thumbAction} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                Remove
              </button>
            </Thumb>
          ))}
        </ul>
      )}
      <AddButton disabled={files.length >= MAX_PRODUCT_IMAGES} onFiles={add}>Add images</AddButton>
      {error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-zinc-500">{HINT}</p>}
    </fieldset>
  );
}

/** For an existing product: uploads and deletes go to the API straight away. */
export function ProductImages({ product }: { product: Product }) {
  const { mutate } = useSWRConfig();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const images = product.images ?? [];

  // The list shows cover images too, so refresh it along with this product
  const refresh = () => mutate((key) => Array.isArray(key) && String(key[0]).startsWith("admin-product"));

  const upload = async (files: File[]) => {
    const problem = validate(files, images.length);
    setError(problem);
    if (problem || files.length === 0) return;
    setUploading(true);
    try {
      await api.products.addImages(product._id, files);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (imageId: string) => {
    if (!window.confirm("Delete this image? It can't be recovered.")) return;
    setDeleting(imageId);
    setError(null);
    try {
      await api.products.removeImage(product._id, imageId);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-800">
          Images <span className="font-normal text-zinc-500">({images.length}/{MAX_PRODUCT_IMAGES})</span>
        </h2>
        <AddButton disabled={uploading || images.length >= MAX_PRODUCT_IMAGES} onFiles={upload}>
          {uploading ? "Uploading…" : "Add images"}
        </AddButton>
      </div>
      {error && <Alert>{error}</Alert>}
      {images.length === 0 && !uploading ? (
        <p className="text-sm text-zinc-500">No images yet. {HINT}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((image, i) => (
            <Thumb key={image._id} src={image.url} alt={`${product.name} image ${i + 1}`}>
              {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-zinc-900/75 px-1.5 py-0.5 text-xs text-white">Cover</span>}
              <button type="button" className={thumbAction} disabled={deleting !== null} onClick={() => remove(image._id)}>
                {deleting === image._id ? "Deleting…" : "Delete"}
              </button>
            </Thumb>
          ))}
          {uploading && (
            <li className="flex aspect-square items-center justify-center rounded-md bg-zinc-50 text-zinc-400 ring-1 ring-zinc-200">
              <Spinner />
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
