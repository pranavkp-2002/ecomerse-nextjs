import type { NextConfig } from "next";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "https://commerce-be-express.onrender.com").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  /* config options here */
  // Proxy API calls through this origin so the browser never makes a cross-origin request
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
  // Product images are hosted on Cloudinary
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/*/image/upload/**" }],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
