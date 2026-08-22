import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <StatsSkeleton count={4} />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
