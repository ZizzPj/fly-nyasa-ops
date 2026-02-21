"use client";

import { useTransition } from "react";
import { confirmCharterBookingAction } from "@/app/ops/actions/confirmCharterBookingAction";

export function ConfirmCharterBookingButton({
  bookingId,
  status,
  bookingType,
}: {
  bookingId: string;
  status: string | null;
  bookingType: string | null;
}) {
  const [pending, startTransition] = useTransition();

  const canConfirm =
    (status ?? "").toUpperCase() === "RESERVED" &&
    (bookingType ?? "").toUpperCase() === "CHARTER";

  if (!canConfirm) return null;

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Ticket this charter reservation?")) return;
        startTransition(async () => {
          await confirmCharterBookingAction(bookingId);
        });
      }}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Ticketing..." : "Ticket Charter"}
    </button>
  );
}
