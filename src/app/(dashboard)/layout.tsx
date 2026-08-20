import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RedirectCinepolisCashier } from "@/components/auth/cinepolis-guards";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RedirectCinepolisCashier>
      <DashboardShell>{children}</DashboardShell>
    </RedirectCinepolisCashier>
  );
}
