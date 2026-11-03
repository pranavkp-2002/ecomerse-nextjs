import type {
  Address,
  AuthUser,
  Cart,
  Category,
  Order,
  OrderStatus,
  Page,
  PageQuery,
  Product,
  ProductImage,
  ProductInput,
  ProductQuery,
  User,
} from "./types";

export interface FieldError {
  field: string;
  message: string;
}

/** Error body from the API's errorHandler: { success: false, message, ...details }. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldError[];
  readonly details: Record<string, unknown>;

  constructor(status: number, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.errors = Array.isArray(details.errors) ? (details.errors as FieldError[]) : [];
  }
}

export interface ApiClientOptions {
  /**
   * Backend origin, e.g. http://localhost:5000 (no trailing /api).
   * Empty string calls /api on the page's own origin (e.g. behind a Next rewrite proxy).
   */
  baseUrl: string;
  getToken?: () => string | null;
  /** Called when an authenticated request is rejected with 401 (expired or revoked token). */
  onUnauthorized?: () => void;
  /** Called before every request with an equivalent curl command (for debugging). */
  onRequest?: (curl: string) => void;
  /** Origin used in onRequest curls when baseUrl is a proxy; defaults to the request URL. */
  curlBaseUrl?: string;
}

const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

export function toCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string | FormData,
) {
  const parts = [`curl -X ${method} ${shellQuote(url)}`];
  for (const [key, value] of Object.entries(headers)) parts.push(`-H ${shellQuote(`${key}: ${value}`)}`);
  if (typeof body === "string") parts.push(`--data-raw ${shellQuote(body)}`);
  else if (body) {
    // Files can't be inlined; reference them by name so the command shows what was sent
    for (const [key, value] of body) {
      parts.push(`-F ${shellQuote(typeof value === "string" ? `${key}=${value}` : `${key}=@${value.name}`)}`);
    }
  }
  // Single line: turbo prefixes every output line with "app:dev:", which breaks multi-line copy
  return parts.join(" ");
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** FormData is sent as multipart; anything else as JSON. */
  body?: unknown;
  query?: Query;
}

// The API answers every request with a JSON envelope; fields beyond
// success/message vary per endpoint, so they're read by key below.
type Envelope = Record<string, unknown> & { success: boolean; message: string };

const toPage = <T>(items: T[], res: Envelope): Page<T> => {
  const limit = Number(res.limit);
  const total = Number(res.total);
  return {
    items,
    page: Number(res.page),
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  onRequest,
  curlBaseUrl,
}: ApiClientOptions) {
  const root = `${baseUrl.replace(/\/+$/, "")}/api`;

  async function request(path: string, { method = "GET", body, query }: RequestOptions = {}) {
    const url = new URL(root + path, globalThis.location?.origin);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }

    const token = getToken?.();
    const headers: Record<string, string> = { Accept: "application/json" };
    const multipart = body instanceof FormData;
    // For FormData, fetch sets Content-Type itself, including the multipart boundary
    if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    const payload = body === undefined ? undefined : multipart ? body : JSON.stringify(body);
    if (onRequest) {
      const curlUrl = curlBaseUrl
        ? `${curlBaseUrl.replace(/\/+$/, "")}${url.pathname}${url.search}`
        : url.toString();
      onRequest(toCurl(method, curlUrl, headers, payload));
    }

    let res: Response;
    try {
      res = await fetch(url, { method, headers, body: payload });
    } catch {
      throw new ApiError(0, "Cannot reach the server. Check that the API is running.");
    }

    const data = (await res.json().catch(() => null)) as Envelope | null;

    if (!res.ok || !data?.success) {
      if (res.status === 401 && token) onUnauthorized?.();
      const { message, success: _success, stack: _stack, ...details }: Record<string, unknown> =
        data ?? {};
      throw new ApiError(
        res.status,
        typeof message === "string" ? message : `Request failed (${res.status})`,
        details,
      );
    }

    return data;
  }

  return {
    health: async () => (await request("/health")).message,

    auth: {
      register: async (input: { name: string; email: string; password: string }) =>
        (await request("/auth/register", { method: "POST", body: input })).data as AuthUser,

      login: async (input: { email: string; password: string }) => {
        const res = await request("/auth/login", { method: "POST", body: input });
        return { token: res.token as string, user: res.data as AuthUser };
      },

      profile: async () => (await request("/auth/profile")).user as User,

      /** Changing the password revokes every token, including the current one. */
      update: async (input: { name?: string; oldPassword?: string; newPassword?: string }) =>
        (await request("/auth/update", { method: "PATCH", body: input })).user as Pick<
          User,
          "_id" | "name" | "email"
        >,

      deleteAccount: async () => {
        await request("/auth/delete", { method: "DELETE" });
      },
    },

    products: {
      list: async (query: ProductQuery = {}) => {
        const res = await request("/products", { query: query as Query });
        return toPage(res.product as Product[], res);
      },

      get: async (id: string) => (await request(`/products/${id}`)).product as Product,

      /** With images, the product is sent as multipart and only created if every upload succeeds. */
      create: async (input: ProductInput, images: File[] = []) => {
        let body: ProductInput | FormData = input;
        if (images.length) {
          body = new FormData();
          for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) body.append(key, String(value));
          }
          for (const image of images) body.append("images", image);
        }
        // The backend misspells the key
        return (await request("/products", { method: "POST", body })).prodcut as Product;
      },

      update: async (id: string, input: Partial<ProductInput>) =>
        (await request(`/products/${id}`, { method: "PUT", body: input }))
          .productData as Product,

      remove: async (id: string) => {
        await request(`/products/${id}`, { method: "DELETE" });
      },

      /** Appends to the product's existing images (at most MAX_PRODUCT_IMAGES in total). */
      addImages: async (id: string, images: File[]) => {
        const body = new FormData();
        for (const image of images) body.append("images", image);
        return (await request(`/products/${id}/images`, { method: "POST", body })).product as Product;
      },

      removeImage: async (id: string, imageId: ProductImage["_id"]) => {
        await request(`/products/${id}/images/${imageId}`, { method: "DELETE" });
      },
    },

    // The backend mounts categories at /api/categroy
    categories: {
      list: async () => (await request("/categroy")).categroy as Category[],

      get: async (id: string) => (await request(`/categroy/${id}`)).category as Category,

      create: async (input: { name: string; description?: string }) =>
        (await request("/categroy", { method: "POST", body: input })).categroy as Category,

      update: async (id: string, input: { name?: string; description?: string }) =>
        (await request(`/categroy/${id}`, { method: "PUT", body: input })).category as Category,

      remove: async (id: string) => {
        await request(`/categroy/${id}`, { method: "DELETE" });
      },
    },

    cart: {
      get: async (): Promise<Cart> => {
        const cart = (await request("/cart")).cart as Partial<Cart> & { subtotal?: number };
        // An empty cart comes back as { items: [], subtotal: 0 }
        return {
          items: cart.items ?? [],
          subTotal: cart.subTotal ?? cart.subtotal ?? 0,
          qtyTotal: cart.qtyTotal ?? 0,
        };
      },

      add: async (productId: string, quantity: number) => {
        await request("/cart", { method: "POST", body: { product: productId, quantity } });
      },

      /** Sets the quantity of a product already in the cart. */
      update: async (productId: string, quantity: number) => {
        await request(`/cart/${productId}`, { method: "PUT", body: { quantity } });
      },

      remove: async (productId: string) => {
        await request(`/cart/${productId}`, { method: "DELETE" });
      },
    },

    orders: {
      checkout: async (shippingAddress: Address) =>
        (await request("/checkout", { method: "POST", body: { shippingAddress } })).order as Order,

      mine: async (query: PageQuery = {}) => {
        const res = await request("/order", { query: { ...query } });
        return toPage(res.orders as Order[], res);
      },

      get: async (orderId: string) => (await request(`/order/${orderId}`)).order as Order,

      // Admin only
      all: async (query: PageQuery = {}) => {
        const res = await request("/order/admin/all", { query: { ...query } });
        return toPage(res.orders as Order[], res);
      },

      updateStatus: async (orderId: string, status: OrderStatus) =>
        (await request(`/order/admin/${orderId}`, { method: "PATCH", body: { status } }))
          .order as Order,
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
