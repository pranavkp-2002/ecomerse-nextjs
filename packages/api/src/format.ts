import type { Product } from "./types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const day = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export const formatPrice = (amount: number) => currency.format(amount);

export const formatDate = (iso: string) => date.format(new Date(iso));

/** Date only, e.g. "3 Nov 2026". */
export const formatDay = (iso: string) => day.format(new Date(iso));

export const categoryName = (product: Pick<Product, "category">) =>
  typeof product.category === "string" ? null : product.category.name;

export const categoryId = (product: Pick<Product, "category">) =>
  typeof product.category === "string" ? product.category : product.category._id;

/** First image's URL, or null. `?.` covers backends deployed before image upload existed. */
export const coverImage = (product: Pick<Product, "images">) => product.images?.[0]?.url ?? null;

/** "#A1B2C3D4": the last 8 characters of the order id, as shown in every order list. */
export const orderNumber = (id: string) => `#${id.slice(-8).toUpperCase()}`;

/** Up to two initials for an avatar, e.g. "Asha Rao" → "AR". */
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";
