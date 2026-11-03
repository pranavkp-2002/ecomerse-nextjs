"use client";

import { categoryId, formatPrice, type Product } from "@ecomerse/api";
import { Alert, Button, buttonClass, cx, Input, Loading } from "@ecomerse/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { api, errorMessage } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

export function ProductDetail({ id }: { id: string }) {
  const { data: product, error } = useSWR(["product", id], () => api.products.get(id));
  // The detail endpoint returns a bare category id, so resolve its name from the list
  const { data: categories } = useSWR("categories", () => api.categories.list());
  const { mutate: refreshCart } = useCart();
  const current = useSession();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>{errorMessage(error)}</Alert>
        <Link href="/" className={buttonClass("secondary")}>Back to shop</Link>
      </div>
    );
  }
  if (!product) return <Loading />;

  const category = categories?.find((c) => c._id === categoryId(product));
  const inStock = product.stock > 0;

  const addToCart = async () => {
    if (!current) {
      router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await api.cart.add(product._id, quantity);
      await refreshCart();
      setMessage({ tone: "success", text: `Added ${quantity} × ${product.name} to your cart.` });
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">← Back to shop</Link>
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery product={product} />
        <div className="space-y-5">
          {category && (
            <Link href={`/?category=${category._id}`} className="text-sm font-medium uppercase tracking-wide text-indigo-600">
              {category.name}
            </Link>
          )}
          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
          {product.description && <p className="whitespace-pre-line text-zinc-600">{product.description}</p>}
          <p className={inStock ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
            {inStock ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {inStock && (
            <div className="flex items-end gap-3">
              <label className="space-y-1.5">
                <span className="block text-sm font-medium">Quantity</span>
                <Input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
                  className="w-24"
                />
              </label>
              <Button onClick={addToCart} loading={adding}>
                Add to cart
              </Button>
            </div>
          )}

          {message && (
            <Alert tone={message.tone}>
              {message.text}{" "}
              {message.tone === "success" && (
                <Link href="/cart" className="font-medium underline">View cart</Link>
              )}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

function Gallery({ product }: { product: Product }) {
  const images = product.images ?? [];
  const [selected, setSelected] = useState(0);
  const image = images[Math.min(selected, images.length - 1)];

  if (!image) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-zinc-100 text-7xl font-semibold text-zinc-400">
        {product.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
        <Image src={image.url} alt={product.name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <li key={img._id}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={img === image}
                className={cx(
                  "relative block aspect-square w-full overflow-hidden rounded-md bg-zinc-100 ring-2",
                  img === image ? "ring-indigo-600" : "ring-transparent hover:ring-zinc-300",
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
