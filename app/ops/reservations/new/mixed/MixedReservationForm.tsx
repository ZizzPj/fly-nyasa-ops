"use client";

import { useMemo, useState, useTransition } from "react";
import { createMixedReservationAction } from "@/app/ops/actions/createMixedReservationAction";
import { routeLabel } from "@/lib/format/routeLabel";

type FlightRow = {
  flight_id: string;
  flight_number: string | null;
  departure_airport_name: string;
  via_airport_name: string | null;
  arrival_airport_name: string;
  departure_time: string | null;
  arrival_time: string | null;
  seats_available: number | null;
};

function fmtTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(11, 16);
}

function weekdayLabel(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function MixedReservationForm({ flights }: { flights: FlightRow[] }) {
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
            await createMixedReservationAction(form);
          } catch (err: any) {
            alert(err?.message ?? "Failed to create mixed reservation");
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Seat Flight</label>
          <select name="seat_flight_id" required defaultValue="" className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
            <option value="" disabled>Select seat flight</option>
            {flights.map((f) => (
              <option key={f.flight_id} value={f.flight_id}>
                {(f.flight_number ?? f.flight_id) + " · " + routeLabel(f) + ` · ${fmtTime(f.departure_time)}-${fmtTime(f.arrival_time)}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Charter Flight</label>
          <select name="charter_flight_id" required defaultValue="" className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
            <option value="" disabled>Select charter flight</option>
            {flights.map((f) => (
              <option key={f.flight_id} value={f.flight_id}>
                {(f.flight_number ?? f.flight_id) + " · " + routeLabel(f) + ` · ${fmtTime(f.departure_time)}-${fmtTime(f.arrival_time)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <input name="staff_name" placeholder="Staff" className="rounded-lg border px-3 py-2" />
        <input name="agent_name" placeholder="Agent" className="rounded-lg border px-3 py-2" />
        <input name="passenger_name" placeholder="Client / Lead Passenger" className="rounded-lg border px-3 py-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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

        <input type="number" name="hold_minutes" defaultValue={60} min={1} max={2160} className="rounded-lg border px-3 py-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <select
          name="no_of_adults"
          value={String(adults)}
          onChange={(e) => setAdults(Number(e.target.value))}
          className="rounded-lg border bg-white px-3 py-2"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <option key={i} value={i}>Adults: {i}</option>
          ))}
        </select>

        <select
          name="no_of_children"
          value={String(children)}
          onChange={(e) => setChildren(Number(e.target.value))}
          className="rounded-lg border bg-white px-3 py-2"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <option key={i} value={i}>Children: {i}</option>
          ))}
        </select>

        <input type="date" name="return_date" className="rounded-lg border px-3 py-2" />
      </div>

      {totalPassengers > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: totalPassengers }).map((_, idx) => {
            const passengerNo = idx + 1;
            return (
              <div key={passengerNo} className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-semibold">Passenger {passengerNo}</div>
                <div className="grid gap-3">
                  <input name={`passenger_${passengerNo}_name`} placeholder="Full Name" className="rounded-lg border px-3 py-2" />
                  <input name={`passenger_${passengerNo}_phone`} placeholder="Phone Number" className="rounded-lg border px-3 py-2" />
                  <input name={`passenger_${passengerNo}_email`} placeholder="Email Address" className="rounded-lg border px-3 py-2" />
                  <input name={`passenger_${passengerNo}_weight`} type="number" step="0.1" placeholder="Weight (kg)" className="rounded-lg border px-3 py-2" />
                  <input name={`passenger_${passengerNo}_nationality`} placeholder="Nationality" className="rounded-lg border px-3 py-2" />
                  <input name={`passenger_${passengerNo}_document`} placeholder="ID / Passport" className="rounded-lg border px-3 py-2" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <textarea name="notes" rows={3} placeholder="Notes" className="w-full rounded-lg border px-3 py-2" />

      <div className="flex items-center gap-3">
        <button disabled={pending} type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
          {pending ? "Creating..." : "Create Mixed Reservation"}
        </button>

        <a href="/ops/reservations" className="text-sm underline text-slate-700">
          Back to Reservations
        </a>
      </div>
    </form>
  );
}