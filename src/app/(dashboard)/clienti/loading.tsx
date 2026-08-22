import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function ClientiLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  );
}
