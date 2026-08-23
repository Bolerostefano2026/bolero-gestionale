"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updateAppointmentStatus } from "@/app/(dashboard)/calendario/actions";

export function CompleteAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      title="Segna completato"
      onClick={() =>
        start(async () => {
          await updateAppointmentStatus(appointmentId, "COMPLETATO");
          router.refresh();
        })
      }
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-success/10 hover:text-success disabled:opacity-40 transition"
    >
      <CheckCircle2 size={16} />
    </button>
  );
}
