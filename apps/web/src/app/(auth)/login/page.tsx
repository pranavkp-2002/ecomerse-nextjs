import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton, AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
