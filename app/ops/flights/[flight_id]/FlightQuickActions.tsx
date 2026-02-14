"use client";

import { useMemo, useTransition } from "react";
import { setFlightStatusAction } from "@/app/ops/actions/setFlightStatus";

type FlightStatus = "SCHEDULED" | "OPEN" | "CLOSED" | "DEPARTED" | "CANCELLED";

function normalize(s: string | null | undefined): FlightStatus {
  const v = String(s ?? "SCHEDULED").toUpperCase().trim();
  if (v === "OPEN") return "OPEN";
  if (v === "CLOSED") return "CLOSED";
  if (v === "DEPARTED") return "DEPARTED";
  if (v === "CANCELLED") return "CANCELLED";
  return "SCHEDULED";
}

function canTransition(current: FlightStatus, next: FlightStatus) {
  // Simple airline-safe rules (no weird jumps)
  if (current === next) return false;

  switch (current) {
    case "SCHEDULED":
      return next === "OPEN" || next === "CANCELLED";
    case "OPEN":
      return next === "CLOSED" || next === "DEPARTED" || next === "CANCELLED";
    case "CLOSED":
      return next === "OPEN" || next === "DEPARTED" || next === "CANCELLED";
    case "DEPARTED":
      return false; // terminal
    case "CANCELLED":
      return false; // terminal
    default:
      return false;
  }
}

export function FlightQuickActions({
  flightId,
  currentStatus,
}: {
  flightId: string;
  currentStatus: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const cur = useMemo(() => normalize(currentStatus), [currentStatus]);

  async function go(next: FlightStatus, confirmText: string) {
    const ok = confirm(confirmText);
    if (!ok) return;

    startTransition(async () => {
      try {
        await setFlightStatusAction(flightId, next);
      } catch (e: any) {
        alert(e?.message ?? "Failed to update flight status");
      }
    });
  }

  const btnBase =
    "rounded-lg px-3 py-2 text-sm font-medium border disabled:opacity-60 disabled:cursor-not-allowed";

  const openOk = canTransition(cur, "OPEN");
  const closeOk = canTransition(cur, "CLOSED");
  const departOk = canTransition(cur, "DEPARTED");
  const cancelOk = canTransition(cur, "CANCELLED");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className={`${btnBase} bg-white hover:bg-slate-50`}
        disabled={pending || !openOk}
        onClick={() =>
          go("OPEN", `Open this flight?\n\nThis makes the flight bookable for holds/confirmations.`)
        }
        type="button"
      >
        Open Flight
      </button>

      <button
        className={`${btnBase} bg-white hover:bg-slate-50`}
        disabled={pending || !closeOk}
        onClick={() =>
          go(
            "CLOSED",
            `Close this flight?\n\nThis prevents new holds/bookings (operational cutoff).`
          )
        }
        type="button"
      >
        Close Flight
      </button>

      <button
        className={`${btnBase} bg-white hover:bg-slate-50`}
        disabled={pending || !departOk}
        onClick={() =>
          go(
            "DEPARTED",
            `Mark flight as DEPARTED?\n\nThis is a terminal status for the operational module.`
          )
        }
        type="button"
      >
        Depart Flight
      </button>

      <button
        className={`${btnBase} bg-red-600 text-white border-red-600 hover:bg-red-700`}
        disabled={pending || !cancelOk}
        onClick={() =>
          go(
            "CANCELLED",
            `Cancel this flight?\n\nThis is terminal and should be used only when approved operationally.`
          )
        }
        type="button"
      >
        Cancel Flight
      </button>

      <div className="ml-1 text-xs text-slate-600">
        Current: <span className="font-semibold">{cur}</span>
      </div>
    </div>
  );
}
