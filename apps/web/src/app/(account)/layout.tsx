import { Suspense } from "react";
import { AccountNav, LiveAccountNav } from "@/components/account/account-nav";

/** Profile and orders share this shell: side nav on desktop, tabs on mobile. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-wrap flex flex-1 flex-col gap-6 pb-12 md:pt-8 md:pb-16">
      <h1 className="hidden text-[30px] leading-[38px] font-bold tracking-[-0.01em] md:block">Account</h1>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
        {/* The active tab depends on the path, which streams in after the static shell */}
        <Suspense fallback={<AccountNav />}>
          <LiveAccountNav />
        </Suspense>
        <div className="min-w-0 max-w-[720px] flex-1">{children}</div>
      </div>
    </div>
  );
}
