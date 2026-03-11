"use client";

import { useTransition } from "react";
import { confirmBookingAction } from "@/app/ops/actions/confirmBookingAction";

export function ConfirmBookingButton(props: {
  bookingId: string;
  status: string | null;
}) {
  const [pending, startTransition] = useTransition();

  const status = (props.status ?? "").toUpperCase();
  const canTicket = status === "RESERVED";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!canTicket || pending}
        className={[
          "rounded-lg px-4 py-2 text-sm font-medium",
          canTicket && !pending
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-slate-200 text-slate-600 cursor-not-allowed",
        ].join(" ")}
        onClick={() => {
          startTransition(async () => {
            await confirmBookingAction(props.bookingId);
          });
        }}
      >
        {pending ? "Ticketing..." : "Ticket Booking"}
      </button>

      {!canTicket ? (
        <div className="text-xs text-slate-600">
          Cannot ticket from status: <b>{props.status ?? "—"}</b>
        </div>
      ) : null}
    </div>
  );
}