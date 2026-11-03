import type { Metadata } from "next";
import { ProfileView } from "@/components/account/profile-view";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Profile" };

export default function AccountPage() {
  return (
    <RequireAuth>
      <ProfileView />
    </RequireAuth>
  );
}
