"use client";

import dynamic from "next/dynamic";
import type { Dimensions } from "@/lib/dimensions";

const PergolaModel = dynamic(
  () => import("./pergola-model").then((m) => m.PergolaModel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-ink3">
        Caricamento anteprima…
      </div>
    ),
  }
);

function formatMeters(n: number) {
  return `${n.toLocaleString("it-IT", { maximumFractionDigits: 2 })} m`;
}

export function Preview3DPanel({ dimensions }: { dimensions: Dimensions }) {
  return (
    <div className="overflow-hidden rounded-lg border border-fog bg-surface">
      <div className="h-72 w-full">
        <PergolaModel dimensions={dimensions} />
      </div>
      <div className="flex items-center justify-between border-t border-fog bg-sunken px-4 py-2 text-xs text-ink2">
        <span>Anteprima parametrica — trascina per ruotare</span>
        <span className="tabular-nums">
          {formatMeters(dimensions.width)} × {formatMeters(dimensions.depth)} ×{" "}
          {formatMeters(dimensions.height)}
        </span>
      </div>
    </div>
  );
}
