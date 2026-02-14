"use client";

import { useMemo, useState, useTransition } from "react";
import { setFlightStatusAction } from "@/app/ops/actions/setFlightStatusAction";

type FlightStatus = "SCHEDULED" | "OPEN" | "CLOSED" | "CANCELLED" | "DEPARTED";

function norm(s: string | null | undefined): FlightStatus | null {
  const v = (s ?? "").toUpperCase();
  if (v === "SCHEDULED" || v === "OPEN" || v === "CLOSED" || v === "CANCELLED" || v === "DEPARTED")
    return v;
  return null;
}

function canTransition(current: FlightStatus | null, next: FlightStatus) {
  // Conservative operational rules (safe + no surprises)
  // - CANCELLED/DEPARTED are terminal
  // - OPEN can go CLOSED/DEPARTED/CANCELLED
  // - SCHEDULED can go OPEN/CANCELLED
  // - CLOSED can go OPEN/CANCELLED
  if (!current) return false;
  if (current === "CANCELLED" || current === "DEPARTED") return false;
  if (next === current) return false;

  if (current === "SCHEDULED") return next === "OPEN" || next === "CANCELLED";
  if (current === "OPEN") return next === "CLOSED" || next === "DEPARTED" || next === "CANCELLED";
  if (current === "CLOSED") return next === "OPEN" || next === "CANCELLED";

  return false;
}

export function FlightLifecycleControls({
  flightId,
  currentStatus,
}: {
  flightId: string;
  currentStatus: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const cur = useMemo(() => norm(currentStatus), [currentStatus]);

  async function run(next: FlightStatus, confirmText: string) {
    setErr(null);

    if (!cur) {
      setErr("Unknown current flight status.");
      return;
    }
    if (!canTransition(cur, next)) return;

    const ok = confirm(confirmText);
    if (!ok) return;

    startTransition(async () => {
      try {
        await setFlightStatusAction(flightId, next);
      } catch (e: any) {
        setErr(e?.message ?? "Status update failed");
      }
    });
  }

  const disabledAll = pending || !cur || cur === "CANCELLED" || cur === "DEPARTED";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <button
          type="button"
          disabled={disabledAll || !canTransition(cur, "OPEN")}
          onClick={() =>
            run("OPEN", "Open this flight for reservations?\n\nThis will allow new holds and bookings.")
          }
          className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Open Flight
        </button>

        <button
          type="button"
          disabled={disabledAll || !canTransition(cur, "CLOSED")}
          onClick={() =>
            run("CLOSED", "Close this flight?\n\nThis will prevent new holds/bookings.")
          }
          className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Close Flight
        </button>

        <button
          type="button"
          disabled={disabledAll || !canTransition(cur, "DEPARTED")}
          onClick={() =>
            run("DEPARTED", "Mark this flight as DEPARTED?\n\nThis is typically final.")
          }
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          Depart Flight
        </button>

        <button
          type="button"
          disabled={disabledAll || !canTransition(cur, "CANCELLED")}
          onClick={() =>
            run(
              "CANCELLED",
              "Cancel this flight?\n\nThis is a terminal state and will prevent any new reservations."
            )
          }
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          Cancel Flight
        </button>
      </div>

      {pending ? <div className="text-xs text-slate-600">Updating status…</div> : null}
      {err ? <div className="text-sm text-red-700">{err}</div> : null}
    </div>
  );
}
