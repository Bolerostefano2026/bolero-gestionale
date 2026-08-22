import { PageHeaderSkeleton, TableSkeleton, StatsSkeleton } from "@/components/ui/skeleton";

export default function FattureLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <StatsSkeleton count={3} />
      <TableSkeleton rows={7} />
    </div>
  );
}
