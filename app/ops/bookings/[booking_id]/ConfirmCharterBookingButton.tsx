"use client";

import { useTransition } from "react";
import { confirmBookingAction } from "@/app/ops/actions/confirmBookingAction";

export function ConfirmCharterBookingButton(props: {
  bookingId: string;
  status: string | null;
  bookingType: string | null;
}) {
  const [pending, startTransition] = useTransition();

  const status = (props.status ?? "").toUpperCase();
  const type = (props.bookingType ?? "").toUpperCase();

  // Only show/enable for CHARTER bookings
  const isCharter = type === "CHARTER";
  const canConfirm = isCharter && status === "RESERVED";

  if (!isCharter) return null;

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
        {pending ? "Confirming..." : "Confirm Charter"}
      </button>

      {!canConfirm ? (
        <div className="text-xs text-slate-600">
          Cannot confirm from status: <b>{props.status ?? "—"}</b>
        </div>
      ) : null}
    </div>
  );
}