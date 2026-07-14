import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CortesModule } from "@/features/cortes/components/cortes-module";

export default function CortesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[48rem] w-full rounded-md" />}>
      <CortesModule />
    </Suspense>
  );
}
