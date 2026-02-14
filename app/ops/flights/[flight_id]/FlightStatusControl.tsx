"use client";

import { useMemo, useState, useTransition } from "react";
import { setFlightStatusAction } from "@/app/ops/actions/setFlightStatusAction";

type FlightStatus = "SCHEDULED" | "OPEN" | "CLOSED" | "CANCELLED" | "DEPARTED";

const STATUSES: FlightStatus[] = ["SCHEDULED", "OPEN", "CLOSED", "DEPARTED", "CANCELLED"];

function norm(s: string | null | undefined): FlightStatus | null {
  const v = (s ?? "").toUpperCase();
  if (v === "SCHEDULED" || v === "OPEN" || v === "CLOSED" || v === "CANCELLED" || v === "DEPARTED")
    return v;
  return null;
}

function canTransition(current: FlightStatus | null, next: FlightStatus) {
  // Conservative lifecycle rules (matches FlightLifecycleControls):
  // - CANCELLED/DEPARTED are terminal
  // - SCHEDULED -> OPEN/CANCELLED
  // - OPEN -> CLOSED/DEPARTED/CANCELLED
  // - CLOSED -> OPEN/CANCELLED
  if (!current) return false;
  if (current === "CANCELLED" || current === "DEPARTED") return false;
  if (next === current) return false;

  if (current === "SCHEDULED") return next === "OPEN" || next === "CANCELLED";
  if (current === "OPEN") return next === "CLOSED" || next === "DEPARTED" || next === "CANCELLED";
  if (current === "CLOSED") return next === "OPEN" || next === "CANCELLED";

  return false;
}

export function FlightStatusControl({
  flightId,
  currentStatus,
}: {
  flightId: string;
  currentStatus: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const cur = useMemo(() => norm(currentStatus), [currentStatus]);

  const [value, setValue] = useState<FlightStatus>(() => norm(currentStatus) ?? "SCHEDULED");

  // Keep select in sync if server status changes after action/revalidate
  // (only when not interacting)
  const effectiveCur = cur ?? "SCHEDULED";

  const terminal = effectiveCur === "CANCELLED" || effectiveCur === "DEPARTED";
  const allowed = canTransition(effectiveCur, value);

  const disabledApply =
    isPending || terminal || value === effectiveCur || !allowed;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex flex-col">
        <label className="text-xs text-slate-600">Flight Status</label>

        <select
          className="rounded-lg border bg-white px-3 py-2 text-sm"
          value={value}
          onChange={(e) => setValue(norm(e.target.value) ?? "SCHEDULED")}
          disabled={isPending || terminal}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} disabled={!canTransition(effectiveCur, s) && s !== effectiveCur}>
              {s}
            </option>
          ))}
        </select>

        {terminal ? (
          <div className="mt-2 text-xs text-slate-600">
            This flight is <b>{effectiveCur}</b> (terminal). No further transitions allowed.
          </div>
        ) : value !== effectiveCur && !allowed ? (
          <div className="mt-2 text-xs text-red-700">
            Transition not allowed: <b>{effectiveCur}</b> → <b>{value}</b>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-500">
            Current: <b>{effectiveCur}</b>
          </div>
        )}
      </div>

      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={disabledApply}
        onClick={() => {
          if (disabledApply) return;

          const ok = confirm(
            `Change flight status from "${effectiveCur}" to "${value}"?\n\nThis affects reservation availability and operations.`
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
