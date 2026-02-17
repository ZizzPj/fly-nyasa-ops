"use client";

import { useTransition } from "react";
import { createFlightAction } from "@/app/ops/actions/createFlightAction";

export function CreateFlightForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid max-w-lg gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createFlightAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create flight");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-medium">Flight Number</label>
        <input
          name="flight_number"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="FN101"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Route ID</label>
        <input name="route_id" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium">Aircraft ID</label>
        <input name="aircraft_id" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium">Seat Config ID</label>
        <input name="seat_config_id" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Departure Time (local)</label>
          <input
            type="datetime-local"
            name="departure_time"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Arrival Time (local)</label>
          <input
            type="datetime-local"
            name="arrival_time"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Booking cutoff minutes</label>
        <input
          type="number"
          name="booking_cutoff_minutes"
          min={0}
          defaultValue={60}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
        <div className="mt-1 text-xs text-slate-500">Default is 60 minutes.</div>
      </div>

      <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-white">
        {pending ? "Creating..." : "Create Flight"}
      </button>
    </form>
  );
}
