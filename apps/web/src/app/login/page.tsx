import type { Metadata } from "next";
import { Loading } from "@ecomerse/ui";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
