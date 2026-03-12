"use client";

import { useTransition } from "react";
import { reactivateFlightAction } from "@/app/ops/actions/reactivateFlightAction";

export function ReactivateFlightButton({
  flightId,
  status,
}: {
  flightId: string;
  status: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const canReactivate = (status ?? "").toUpperCase() === "CANCELLED";

  if (!canReactivate) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await reactivateFlightAction(flightId);
        });
      }}
      className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? "Reactivating..." : "Reactivate Flight"}
    </button>
  );
}