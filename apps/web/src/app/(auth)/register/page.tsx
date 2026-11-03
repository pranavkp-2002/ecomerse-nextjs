import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton, AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
