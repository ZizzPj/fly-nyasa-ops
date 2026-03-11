"use client";

import { useTransition } from "react";
import { createCharterReservationAction } from "@/app/ops/actions/createCharterReservationAction";
import { routeLabel } from "@/lib/format/routeLabel";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  seats_available: number | null;
};

export function CharterReservationForm({ flights }: { flights: FlightRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createCharterReservationAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create charter reservation");
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Flight</label>
          <select
            name="flight_id"
            required
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            {flights.map((f) => (
              <option key={f.flight_id} value={f.flight_id}>
                {(f.flight_number ?? f.flight_id) +
                  " · " +
                  routeLabel(f) +
                  ` · Available: ${f.seats_available ?? 0}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Hold Duration (minutes)</label>
          <input
            type="number"
            name="hold_minutes"
            min={1}
            max={2160}
            required
            defaultValue={60}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Route Type</label>
          <input
            name="route_type"
            defaultValue="CHARTER"
            className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2"
            readOnly
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">PNR</label>
          <input name="pnr" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Staff</label>
          <input name="staff_name" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Agent</label>
          <input name="agent_name" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Passenger / Client</label>
          <input name="passenger_name" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Preferred Day</label>
          <input name="preferred_day" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Preferred Departure Date</label>
          <input
            type="date"
            name="preferred_departure_date"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Return Required</label>
          <select
            name="return_required"
            defaultValue="false"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Return Date</label>
          <input
            type="date"
            name="return_date"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">No. of Adults</label>
          <input
            type="number"
            name="no_of_adults"
            min={0}
            defaultValue={1}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">No. of Children</label>
          <input
            type="number"
            name="no_of_children"
            min={0}
            defaultValue={0}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Total Cost</label>
          <input type="number" step="0.01" name="total_cost" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Demurrage</label>
          <input type="number" step="0.01" name="demurrage" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Change Date Fee</label>
          <input type="number" step="0.01" name="change_date_fee" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Excess Baggage</label>
          <input type="number" step="0.01" name="excess_baggage_fee" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Fuel Surcharge</label>
          <input type="number" step="0.01" name="fuel_surcharge" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Credit Card Surcharge</label>
          <input type="number" step="0.01" name="credit_card_surcharge" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Departure Taxes</label>
          <input type="number" step="0.01" name="departure_taxes" defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Include VAT</label>
          <select
            name="include_vat"
            defaultValue="true"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">From Lodge</label>
          <input name="from_lodge" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">To Lodge</label>
          <input name="to_lodge" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create Charter Reservation"}
        </button>

        <a href="/ops/reservations" className="text-sm underline text-slate-700">
          Back to Reservations
        </a>
      </div>
    </form>
  );
}