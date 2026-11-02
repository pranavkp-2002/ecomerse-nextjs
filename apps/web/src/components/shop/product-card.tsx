import { categoryName, formatPrice, type Product } from "@ecomerse/api";
import Link from "next/link";

export function ProductCard({ product }: { product: Product }) {
  const category = categoryName(product);
  return (
    <Link
      href={`/products/${product._id}`}
      className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-md bg-zinc-100 text-3xl font-semibold text-zinc-400">
        {product.name.charAt(0).toUpperCase()}
      </div>
      {category && <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{category}</p>}
      <h3 className="mt-1 font-medium text-zinc-900 group-hover:text-indigo-700">{product.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="font-semibold">{formatPrice(product.price)}</span>
        {product.stock < 1 ? (
          <span className="text-xs text-red-600">Out of stock</span>
        ) : product.stock <= 5 ? (
          <span className="text-xs text-amber-700">Only {product.stock} left</span>
        ) : null}
      </div>
    </Link>
  );
}
