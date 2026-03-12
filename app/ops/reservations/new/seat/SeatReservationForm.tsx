"use client";

import { useMemo, useState, useTransition } from "react";
import { createSeatReservationAction } from "@/app/ops/actions/createSeatReservationAction";
import { routeLabel } from "@/lib/format/routeLabel";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  seats_available: number | null;
};

function weekdayLabel(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function SeatReservationForm({ flights }: { flights: FlightRow[] }) {
  const [pending, startTransition] = useTransition();
  const [preferredDate, setPreferredDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const totalPassengers = useMemo(() => adults + children, [adults, children]);
  const preferredWeekday = useMemo(() => weekdayLabel(preferredDate), [preferredDate]);

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        startTransition(async () => {
          try {
            await createSeatReservationAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create seat reservation");
          }
        });
      }}
    >
      <div className="text-sm font-semibold text-slate-900">Flight Selection</div>

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
          <label className="text-sm font-medium">Seat Count</label>
          <input
            type="number"
            name="seat_count"
            min={1}
            required
            defaultValue={1}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
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
      </div>

      <div className="text-sm font-semibold text-slate-900">Booking Details</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Staff</label>
          <input name="staff_name" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Agent</label>
          <input name="agent_name" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Booked By</label>
          <input name="booked_by" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Client / Lead Passenger</label>
          <input name="passenger_name" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Preferred Departure Date</label>
          <input
            type="date"
            name="preferred_departure_date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
          <div className="mt-1 text-xs text-slate-600">Day: {preferredWeekday}</div>
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-900">Passenger Counts</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Adults</label>
          <select
            name="no_of_adults"
            value={String(adults)}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Children</label>
          <select
            name="no_of_children"
            value={String(children)}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

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
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <div>
          <label className="text-sm font-medium">Return Date</label>
          <input
            type="date"
            name="return_date"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-900">Passenger Details</div>

      {totalPassengers === 0 ? (
        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
          Select at least 1 passenger.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: totalPassengers }).map((_, idx) => {
            const isChild = idx >= adults;
            const passengerNo = idx + 1;

            return (
              <div key={passengerNo} className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-semibold">
                  {isChild ? `Child ${passengerNo - adults}` : `Adult ${passengerNo}`}
                </div>

                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Full Name</label>
                    <input
                      name={`passenger_${passengerNo}_name`}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Nationality</label>
                    <input
                      name={`passenger_${passengerNo}_nationality`}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">ID / Passport</label>
                    <input
                      name={`passenger_${passengerNo}_document`}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-sm font-semibold text-slate-900">Commercials</div>

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

      <div className="text-sm font-semibold text-slate-900">Lodging & Notes</div>

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

      <input type="hidden" name="route_type" value="SEAT_RATE" />

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create Seat Reservation"}
        </button>

        <a href="/ops/reservations" className="text-sm underline text-slate-700">
          Back to Reservations
        </a>
      </div>
    </form>
  );
}