import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function PreventiviLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={7} />
    </div>
  );
}
