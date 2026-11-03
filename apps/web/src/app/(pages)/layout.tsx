export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <div className="page-wrap flex-1 py-8">{children}</div>;
}
