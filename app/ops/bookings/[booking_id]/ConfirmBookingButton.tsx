"use client";

import { useState, useTransition } from "react";
import { confirmBookingAction } from "@/app/ops/actions/confirmBookingAction";

export function ConfirmBookingButton({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Your RPC allows HELD or DRAFT (per functiondef you posted)
  const s = (status ?? "").toUpperCase();
  const canConfirm = s === "HELD" || s === "DRAFT";
  const isCancelled = s === "CANCELLED";
  const isConfirmed = s === "CONFIRMED";

  const disabledReason =
    isCancelled
      ? "Booking is CANCELLED."
      : isConfirmed
      ? "Booking is already CONFIRMED."
      : !canConfirm
      ? `Cannot confirm from status: ${s || "—"}`
      : null;

  return (
    <div className="space-y-2">
      <button
        disabled={pending || !canConfirm}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        onClick={() => {
          setErr(null);
          if (!canConfirm) return;

          if (!confirm("Confirm this booking? This will confirm held seats atomically.")) return;

          startTransition(async () => {
            try {
              await confirmBookingAction(bookingId);
            } catch (e: any) {
              setErr(e?.message ?? "Confirm failed");
            }
          });
        }}
      >
        {pending ? "Confirming…" : "Confirm Booking"}
      </button>

      {disabledReason ? (
        <div className="text-xs text-slate-600">{disabledReason}</div>
      ) : null}

      {err ? <div className="text-sm text-red-700">{err}</div> : null}
    </div>
  );
}
