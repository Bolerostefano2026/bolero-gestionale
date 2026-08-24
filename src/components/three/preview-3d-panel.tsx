"use client";

import dynamic from "next/dynamic";
import type { Dimensions } from "@/lib/dimensions";

const PergolaModel = dynamic(
  () => import("./pergola-model").then((m) => m.PergolaModel),
  { ssr: false, loading: () => <Skeleton /> }
);

const TendaModel = dynamic(
  () => import("./tenda-model").then((m) => m.TendaModel),
  { ssr: false, loading: () => <Skeleton /> }
);

const ZanzarieraModel = dynamic(
  () => import("./zanzariera-model").then((m) => m.ZanzarieraModel),
  { ssr: false, loading: () => <Skeleton /> }
);

function Skeleton() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-ink3">
      Caricamento anteprima…
    </div>
  );
}

function formatMeters(n: number) {
  return `${n.toLocaleString("it-IT", { maximumFractionDigits: 2 })} m`;
}

function resolveModelType(productName: string): "tenda" | "zanzariera" | "pergola" {
  const n = productName.toLowerCase();
  if (n.includes("tenda") || n.includes("awning") || n.includes("sole") || n.includes("muro")) {
    return "tenda";
  }
  if (n.includes("zanzar") || n.includes("screen") || n.includes("mosquito")) {
    return "zanzariera";
  }
  return "pergola";
}

export function Preview3DPanel({
  dimensions,
  productName = "",
  color,
}: {
  dimensions: Dimensions;
  productName?: string;
  color?: string | null;
}) {
  const type = resolveModelType(productName);

  return (
    <div className="overflow-hidden rounded-lg border border-fog bg-surface">
      <div className="h-72 w-full">
        {type === "tenda" && <TendaModel dimensions={dimensions} color={color} />}
        {type === "zanzariera" && <ZanzarieraModel dimensions={dimensions} color={color} />}
        {type === "pergola" && <PergolaModel dimensions={dimensions} color={color} />}
      </div>
      <div className="flex items-center justify-between border-t border-fog bg-sunken px-4 py-2 text-xs text-ink2">
        <span className="flex items-center gap-2">
          {color && (
            <span
              className="inline-block h-3 w-3 rounded-full border border-fog/60"
              style={{ background: color }}
            />
          )}
          Anteprima parametrica — trascina per ruotare
        </span>
        <span className="tabular-nums">
          {formatMeters(dimensions.width)} × {formatMeters(dimensions.depth)} ×{" "}
          {formatMeters(dimensions.height)}
        </span>
      </div>
    </div>
  );
}
