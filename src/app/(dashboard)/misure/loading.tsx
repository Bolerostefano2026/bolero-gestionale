import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function MisureLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={7} />
    </div>
  );
}
