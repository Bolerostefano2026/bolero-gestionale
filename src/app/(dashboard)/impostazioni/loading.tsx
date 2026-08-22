import { Skeleton } from "@/components/ui/skeleton";

export default function ImpostazioniLoading() {
  return (
    <div className="space-y-5 max-w-2xl">
      <Skeleton className="h-7 w-44" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-fog bg-surface p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
