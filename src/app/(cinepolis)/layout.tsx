import { RequireCinepolisCashier } from "@/components/auth/cinepolis-guards";
import { CinepolisShell } from "@/components/cinepolis/cinepolis-shell";

export default function CinepolisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireCinepolisCashier>
      <CinepolisShell>{children}</CinepolisShell>
    </RequireCinepolisCashier>
  );
}
