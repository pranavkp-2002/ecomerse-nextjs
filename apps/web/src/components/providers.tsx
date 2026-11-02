"use client";

import { ApiError } from "@ecomerse/api";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        // Client errors (404, 401, validation) won't fix themselves on retry
        shouldRetryOnError: (error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      }}
    >
      {children}
    </SWRConfig>
  );
}
