import type { Metadata } from "next";
import { AccountView } from "@/components/auth/account-view";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountView />
    </RequireAuth>
  );
}
