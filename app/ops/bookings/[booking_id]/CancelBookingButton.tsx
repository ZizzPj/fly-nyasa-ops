"use client";

import { useState, useTransition } from "react";
import { cancelBookingAction } from "@/app/ops/actions/cancelBookingAction";

export function CancelBookingButton({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const s = (status ?? "").toUpperCase();
  const isCancelled = s === "CANCELLED";

  return (
    <div className="space-y-2">
      <button
        className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
          isCancelled ? "bg-slate-400" : "bg-red-600 hover:bg-red-700"
        }`}
        disabled={pending || isCancelled}
        onClick={() => {
          setErr(null);
          if (isCancelled) return;

          const ok = confirm(
            "Cancel this booking?\n\nThis will release inventory immediately and is auditable."
          );
          if (!ok) return;

          startTransition(async () => {
            try {
              await cancelBookingAction(bookingId);
            } catch (e: any) {
              setErr(e?.message ?? "Cancellation failed");
            }
          });
        }}
      >
        {isCancelled ? "Booking Cancelled" : pending ? "Cancelling…" : "Cancel Booking"}
      </button>

      {err ? <div className="text-sm text-red-700">{err}</div> : null}
    </div>
  );
}
