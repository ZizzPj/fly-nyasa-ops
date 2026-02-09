"use client";

import { useTransition } from "react";
import { closeFlightsPastCutoffAction } from "@/app/ops/actions/closeFlightsPastCutoff";

export function CloseCutoffButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        const ok = confirm(
          "Run cutoff close?\n\nThis will automatically close flights past cutoff according to backend rules."
        );
        if (!ok) return;

        startTransition(async () => {
          try {
            const closed = await closeFlightsPastCutoffAction();
            alert(`Cutoff job complete.\nFlights closed: ${closed}`);
          } catch (e: any) {
            alert(e?.message ?? "Cutoff close failed");
          }
        });
      }}
    >
      {isPending ? "Running…" : "Run Cutoff Close"}
    </button>
  );
}
