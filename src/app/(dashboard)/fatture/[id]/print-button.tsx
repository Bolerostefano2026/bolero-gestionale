"use client";

import { Printer } from "lucide-react";

export function PrintButton({ invoiceId }: { invoiceId: string }) {
  return (
    <a
      href={`/api/fatture/${invoiceId}/pdf`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        e.preventDefault();
        const win = window.open(`/api/fatture/${invoiceId}/pdf`, "_blank");
        if (win) {
          win.onload = () => {
            setTimeout(() => {
              win.print();
            }, 500);
          };
        }
      }}
      className="flex items-center gap-1.5 rounded-md border border-fog px-3 py-1.5 text-sm font-medium text-ink2 hover:border-copper hover:text-copper"
    >
      <Printer size={14} />
      Stampa
    </a>
  );
}
