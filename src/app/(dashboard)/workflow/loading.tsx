import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function WorkflowLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
