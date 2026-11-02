import { Suspense } from "react";
import { RequireAdmin } from "@/components/auth/require-admin";
import { Sidebar, SidebarShell } from "@/components/sidebar";

export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Suspense fallback={<SidebarShell />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <RequireAdmin>{children}</RequireAdmin>
      </main>
    </div>
  );
}
