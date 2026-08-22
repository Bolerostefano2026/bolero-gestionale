import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sunken", className)} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-fog bg-surface overflow-hidden">
      <div className="border-b border-fog px-5 py-3 flex gap-4">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/5" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-fog last:border-0 items-center">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  const cols: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
  return (
    <div className={cn("grid gap-4 grid-cols-2", cols[count] && `lg:${cols[count]}`)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-fog bg-surface px-5 py-4">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}
