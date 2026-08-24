import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 30;

export function buildPageUrl(
  searchParams: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, v);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export function Pagination({
  page,
  total,
  searchParams,
}: {
  page: number;
  total: number;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink3">
      <span>
        {from}–{to} di {total}
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildPageUrl(searchParams, page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-fog bg-surface hover:border-copper hover:text-copper transition"
          >
            <ChevronLeft size={15} />
          </Link>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-fog bg-sunken opacity-40">
            <ChevronLeft size={15} />
          </span>
        )}

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number;
          if (totalPages <= 7) {
            p = i + 1;
          } else if (page <= 4) {
            p = i + 1;
          } else if (page >= totalPages - 3) {
            p = totalPages - 6 + i;
          } else {
            p = page - 3 + i;
          }
          return (
            <Link
              key={p}
              href={buildPageUrl(searchParams, p)}
              className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition ${
                p === page
                  ? "border-copper bg-copper text-white"
                  : "border-fog bg-surface hover:border-copper hover:text-copper"
              }`}
            >
              {p}
            </Link>
          );
        })}

        {page < totalPages ? (
          <Link
            href={buildPageUrl(searchParams, page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-fog bg-surface hover:border-copper hover:text-copper transition"
          >
            <ChevronRight size={15} />
          </Link>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-fog bg-sunken opacity-40">
            <ChevronRight size={15} />
          </span>
        )}
      </div>
    </div>
  );
}
