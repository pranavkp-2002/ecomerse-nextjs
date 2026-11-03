/** Mobile: full-bleed form on white. Desktop: centred card on a subtle band. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 justify-center px-4 py-8 md:bg-surface-subtle md:py-16">{children}</div>;
}
