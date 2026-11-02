import type { Metadata } from "next";
import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
