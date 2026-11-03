// Shapes returned by the ecomerse Express API (see ecomerse/src/models).
// Dates arrive as ISO strings over JSON.

export type Role = "customer" | "admin";

/** Returned by login/register. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Returned by GET /auth/profile. */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type CategoryRef = Pick<Category, "_id" | "name" | "description">;

/** Hosted on Cloudinary. Pass `_id` (not `publicId`) to the delete-image endpoint. */
export interface ProductImage {
  _id: string;
  url: string;
  publicId: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  /** Populated on the list endpoint, a bare id everywhere else. */
  category: string | CategoryRef;
  stock: number;
  /** Empty for products created before image upload existed. */
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
}

// Upload limits enforced by the API
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;

export type ProductSort = "price_asc" | "price_desc" | "newest";

export interface ProductQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface CartLine {
  product: { _id: string; name: string; price: number };
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartLine[];
  subTotal: number;
  qtyTotal: number;
}

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  _id: string;
  product: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  /** Populated with name/email on the admin list, a bare id elsewhere. */
  user: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: Address;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}
