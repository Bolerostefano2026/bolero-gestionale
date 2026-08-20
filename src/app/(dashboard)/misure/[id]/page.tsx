import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { DeleteMeasurementButton } from "./delete-button";
import { Preview3DPanel } from "@/components/three/preview-3d-panel";
import { extractDimensions, hasAnyDimension } from "@/lib/dimensions";
import type { FieldDef } from "@/lib/field-types";

function formatValue(field: FieldDef, value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "checkbox") return value ? "Sì" : "No";
  if (field.type === "dimension") return `${value}${field.unit ? " " + field.unit : ""}`;
  return String(value);
}

export default async function MeasurementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const measurement = await prisma.measurement.findUnique({
    where: { id },
    include: { client: true, product: true, template: true, createdBy: true },
  });

  if (!measurement) notFound();

  // Si usa la scheda congelata al momento del rilievo, così i dati restano
  // leggibili anche se il prodotto è stato ridefinito nel frattempo. Il
  // template corrente serve solo alle misurazioni registrate prima di questa
  // modifica, che non hanno ancora la copia.
  const snapshot = measurement.fieldsSnapshot as unknown as FieldDef[] | null;
  const fields =
    snapshot && snapshot.length > 0
      ? snapshot
      : (measurement.template.fields as unknown as FieldDef[]);
  const schedaModificata =
    snapshot !== null && measurement.templateVersion !== measurement.template.version;
  const data = measurement.data as Record<string, unknown>;
  const photos = measurement.photos as { url: string }[];
  const canWrite = hasPermission(session?.user.permissions, "measurements:write");

  return (
    <div className="max-w-2xl">
      <Link
        href="/misure"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna alle misure
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {measurement.product.name}
          </h1>
          <Link
            href={`/clienti/${measurement.clientId}`}
            className="mt-1 inline-block text-sm text-ink2 hover:text-copper"
          >
            {measurement.client.name} {measurement.client.surname}
          </Link>
        </div>
        {canWrite && <DeleteMeasurementButton measurementId={measurement.id} />}
      </div>

      {hasAnyDimension(fields) && (
        <div className="mb-6">
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Anteprima 3D
          </h2>
          <Preview3DPanel dimensions={extractDimensions(fields, data)} />
        </div>
      )}

      <div className="rounded-lg border border-fog bg-surface p-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
          Misure rilevate
        </h2>
        {schedaModificata && (
          <p className="mb-4 rounded-md bg-warn-bg px-3 py-2 text-xs text-warn">
            La scheda di misurazione di questo prodotto è stata modificata dopo il
            rilievo. Qui sotto vedi i campi com&apos;erano quando le misure sono state
            prese.
          </p>
        )}
        {fields.length === 0 ? (
          <p className="text-sm text-ink3">Nessun campo definito per questa scheda.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs uppercase tracking-wide text-ink3">{field.label}</dt>
                <dd className="mt-0.5 text-ink">{formatValue(field, data[field.key])}</dd>
              </div>
            ))}
          </dl>
        )}

        {photos.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink3">
              Foto
            </h3>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo.url}
                  alt=""
                  className="h-24 w-24 rounded-md border border-fog object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {measurement.notes && (
          <div className="mt-6">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink3">
              Note
            </h3>
            <p className="whitespace-pre-wrap text-sm text-ink2">{measurement.notes}</p>
          </div>
        )}

        <p className="mt-6 text-xs text-ink3">
          Rilevata il {measurement.createdAt.toLocaleDateString("it-IT")}
          {measurement.createdBy && ` da ${measurement.createdBy.name}`}
        </p>
      </div>
    </div>
  );
}
