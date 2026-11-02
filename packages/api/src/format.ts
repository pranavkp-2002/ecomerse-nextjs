import type { Product } from "./types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const formatPrice = (amount: number) => currency.format(amount);

export const formatDate = (iso: string) => date.format(new Date(iso));

export const categoryName = (product: Pick<Product, "category">) =>
  typeof product.category === "string" ? null : product.category.name;

export const categoryId = (product: Pick<Product, "category">) =>
  typeof product.category === "string" ? product.category : product.category._id;
