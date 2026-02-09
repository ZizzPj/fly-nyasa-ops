"use client";

import { useState, useTransition } from "react";
import { setFlightStatusAction } from "@/app/ops/actions/setFlightStatus";

const STATUSES = ["SCHEDULED", "OPEN", "CLOSED", "CANCELLED"] as const;

export function FlightStatusControl({
  flightId,
  currentStatus,
}: {
  flightId: string;
  currentStatus: string | null;
}) {
  const [value, setValue] = useState<string>(currentStatus ?? "SCHEDULED");
  const [isPending, startTransition] = useTransition();

  const disabled = isPending || value === (currentStatus ?? "");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-col">
        <label className="text-xs text-slate-600">Flight Status</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <button
        className="mt-4 rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 sm:mt-0"
        disabled={disabled}
        onClick={() => {
          if (value === (currentStatus ?? "")) return;

          const ok = confirm(
            `Change flight status from "${currentStatus ?? "—"}" to "${value}"?\n\nThis affects operational availability.`
          );
          if (!ok) return;

          startTransition(async () => {
            try {
              await setFlightStatusAction(flightId, value);
            } catch (err: any) {
              alert(err?.message ?? "Failed to update flight status");
            }
          });
        }}
      >
        {isPending ? "Updating…" : "Apply"}
      </button>
    </div>
  );
}
