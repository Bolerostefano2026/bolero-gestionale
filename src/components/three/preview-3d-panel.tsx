"use client";

import dynamic from "next/dynamic";
import type { Dimensions } from "@/lib/dimensions";

const loading = () => (
  <div className="flex h-full items-center justify-center text-xs text-ink3">
    Caricamento anteprima…
  </div>
);

const PergolaModel = dynamic(() => import("./pergola-model").then((m) => m.PergolaModel), { ssr: false, loading });
const FinestraModel = dynamic(() => import("./finestra-model").then((m) => m.FinestraModel), { ssr: false, loading });
const PortaModel = dynamic(() => import("./porta-model").then((m) => m.PortaModel), { ssr: false, loading });
const TapparellaModel = dynamic(() => import("./tapparella-model").then((m) => m.TapparellaModel), { ssr: false, loading });
const TendaModel = dynamic(() => import("./tenda-model").then((m) => m.TendaModel), { ssr: false, loading });
const ParapettoModel = dynamic(() => import("./parapetto-model").then((m) => m.ParapettoModel), { ssr: false, loading });

type ModelType = "pergola" | "finestra" | "porta" | "tapparella" | "tenda" | "parapetto";

function resolveModel(productName: string): ModelType {
  const n = productName.toLowerCase();
  if (n.includes("pergol")) return "pergola";
  if (n.includes("tapparell") || n.includes("serranda")) return "tapparella";
  if (n.includes("tenda") || n.includes("frangisole") || n.includes("schermat")) return "tenda";
  if (n.includes("parapett")) return "parapetto";
  if (
    n.includes("porta") ||
    n.includes("portone") ||
    n.includes("blindat") ||
    n.includes("intern") ||
    n.includes("laccat") ||
    n.includes("tagliafuoco") ||
    n.includes("libro") ||
    n.includes("pvc")
  )
    return "porta";
  // finestre, serramenti, vetrate, default
  return "finestra";
}

function formatMeters(n: number) {
  return `${n.toLocaleString("it-IT", { maximumFractionDigits: 2 })} m`;
}

export function Preview3DPanel({
  dimensions,
  productName = "",
}: {
  dimensions: Dimensions;
  productName?: string;
}) {
  const modelType = resolveModel(productName);

  return (
    <div className="overflow-hidden rounded-lg border border-fog bg-surface">
      <div className="h-72 w-full">
        {modelType === "pergola" && <PergolaModel dimensions={dimensions} />}
        {modelType === "finestra" && <FinestraModel dimensions={dimensions} />}
        {modelType === "porta" && <PortaModel dimensions={dimensions} />}
        {modelType === "tapparella" && <TapparellaModel dimensions={dimensions} />}
        {modelType === "tenda" && <TendaModel dimensions={dimensions} />}
        {modelType === "parapetto" && <ParapettoModel dimensions={dimensions} />}
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
