export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-[100dvh] bg-[var(--dashboard-bg)]">{children}</main>;
}
