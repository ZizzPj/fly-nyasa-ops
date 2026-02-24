"use client";

import { useTransition } from "react";
import { confirmBookingAction } from "@/app/ops/actions/confirmBookingAction";

export function ConfirmBookingButton(props: { bookingId: string; status: string | null }) {
  const [pending, startTransition] = useTransition();

  const status = (props.status ?? "").toUpperCase();

  // ✅ Allow confirm from RESERVED only (your DB confirm_booking enforces this too)
  const canConfirm = status === "RESERVED";

  const label = pending ? "Confirming..." : "Confirm Booking";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!canConfirm || pending}
        className={[
          "rounded-lg px-4 py-2 text-sm font-medium",
          canConfirm && !pending
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-slate-200 text-slate-600 cursor-not-allowed",
        ].join(" ")}
        onClick={() => {
          startTransition(async () => {
            await confirmBookingAction(props.bookingId);
          });
        }}
      >
        {label}
      </button>

      {!canConfirm ? (
        <div className="text-xs text-slate-600">
          Cannot confirm from status: <b>{props.status ?? "—"}</b>
        </div>
      ) : null}
    </div>
  );
}